"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { formatPrice } from "@/utils/helpers";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import Filters from "@/components/Filters";
import OrdersTable, { Order } from "@/components/OrdersTable";
import Pagination from "@/components/Pagination";
import { useCart } from "@/modules/cart/context/CartContext";
import { toast } from "react-hot-toast";

function mapOrder(item: any): Order {
    const id = item.increment_id || "";
    const sapOrderNumber = item.sap_order_number || "";

    let date = "";
    if (item.created_at) {
        const d = new Date(item.created_at);
        date = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear().toString().slice(-2)}`;
    }

    const grandTotal = formatPrice(item.grand_total);

    let orderedBy = item.ordered_by || "";
    if (!orderedBy && item.billing_address) {
        orderedBy = `${item.billing_address.firstname || ""} ${item.billing_address.lastname || ""}`.trim();
    }
    if (!orderedBy && (item.customer_firstname || item.customer_lastname)) {
        orderedBy = `${item.customer_firstname || ""} ${item.customer_lastname || ""}`.trim();
    }

    let status = item.status || "";
    if (status === "approval_pending") {
        status = "Check Pending";
    } else if (status) {
        status = status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
    }

    return {
        id,
        sapOrderNumber,
        date,
        grandTotal,
        orderedBy,
        status,
        increment_id: item.increment_id || "",
        entity_id: (item.entity_id || item.order_id || item.increment_id || "").toString(),
    };
}

export default function MyOrdersPage() {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refetchCart } = useCart();

    const [orders, setOrders] = useState<Order[]>([]);
    const [allOrdersForCounts, setAllOrdersForCounts] = useState<any[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    // Filter states - derived from URL
    const searchInput = searchParams.get("orderNumber") || "All";
    const statusInput = searchParams.get("status") || "All";
    const companyInput = searchParams.get("companyCode") || "All";
    const currentPage = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

    // Local states for inputs to handle debounce
    const [localSearch, setLocalSearch] = useState(searchInput);
    const [localStatus, setLocalStatus] = useState(statusInput);

    // Sync local state when URL changes
    useEffect(() => {
        setLocalSearch(searchInput);
        setLocalStatus(statusInput);
    }, [searchInput, statusInput]);

    useEffect(() => {
        if (authStatus === "unauthenticated") {
            router.replace("/login");
        }
    }, [authStatus, router]);

    // Calculate counts dynamically from all orders
    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = { "All": allOrdersForCounts.length };
        allOrdersForCounts.forEach(order => {
            const rawStatus = order.status || "";
            // Normalize status to match what's in the filter options (usually lowercase or specific code)
            const s = rawStatus.toLowerCase();
            counts[s] = (counts[s] || 0) + 1;

            // Also handle human-readable status codes if they differ
            if (rawStatus === "approval_pending") counts["approval_pending"] = (counts["approval_pending"] || 0) + 1;
        });
        return counts;
    }, [allOrdersForCounts]);

    const fetchAllOrdersForCounts = useCallback(async () => {
        const token = (session as any)?.accessToken;
        if (!token) return;
        try {
            // Fetch a large enough page size to get all orders for counts
            const res = await fetch(`/api/kleverapi/my-orders?pageSize=1000&currentPage=1`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setAllOrdersForCounts(data.items || []);
            }
        } catch (err) {
            console.error("Failed to fetch all orders for counts", err);
        }
    }, [session]);

    const fetchOrders = useCallback(async (search: string, status: string, page: number, size: number, company: string) => {
        const token = (session as any)?.accessToken;
        if (!token) return;

        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                pageSize: size.toString(),
                currentPage: page.toString(),
            });
            if (status !== "All") {
                params.append("status", status);
            }
            if (search && search !== "All") {
                params.append("orderNumber", search);
            }
            if (company && company !== "All") params.append("companyCode", company);

            const res = await fetch(`/api/kleverapi/my-orders?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to fetch orders");

            const items: any[] = data.items || [];
            setOrders(items.map(mapOrder));
            setTotalItems(data.total_count || items.length);
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setIsLoading(false);
            setHasFetched(true);
        }
    }, [session]);

    // Initial fetch
    useEffect(() => {
        if (authStatus === "authenticated") {
            fetchOrders(searchInput, statusInput, currentPage, pageSize, companyInput);
            fetchAllOrdersForCounts();
        }
    }, [authStatus, fetchOrders, fetchAllOrdersForCounts, searchInput, statusInput, currentPage, pageSize, companyInput]);

    // Update URL helper
    const updateURLParams = useCallback((newSearch: string, newStatus: string, newPage: number, newSize: number = pageSize, newCompany: string = companyInput) => {
        const params = new URLSearchParams(searchParams.toString());

        // Handle Toast if no data for selected status
        if (newStatus !== "All" && (statusCounts[newStatus.toLowerCase()] === 0 || statusCounts[newStatus] === 0)) {
            toast.error("No orders found for selected status");
        }

        if (newSearch && newSearch !== "All") params.set("orderNumber", newSearch);
        else params.delete("orderNumber");

        if (newStatus && newStatus !== "All") params.set("status", newStatus);
        else params.delete("status");

        if (newCompany && newCompany !== "All") params.set("companyCode", newCompany);
        else params.delete("companyCode");

        if (newPage > 1) params.set("page", newPage.toString());
        else params.delete("page");

        if (newSize !== 10) params.set("pageSize", newSize.toString());
        else params.delete("pageSize");

        router.push(`/my-orders?${params.toString()}`);
    }, [router, searchParams, statusCounts, pageSize, companyInput]);

    // Auto search with debounce
    useEffect(() => {
        if (localSearch === searchInput && localStatus === statusInput) return;

        const timer = setTimeout(() => {
            updateURLParams(localSearch, localStatus, 1, pageSize, companyInput);
        }, 500);

        return () => clearTimeout(timer);
    }, [localSearch, localStatus, updateURLParams, searchInput, statusInput, pageSize, companyInput]);

    const handleSearchClick = () => {
        updateURLParams(localSearch, localStatus, 1, pageSize, companyInput);
    };

    const handleResetClick = () => {
        toast.dismiss();
        setLocalSearch("All");
        setLocalStatus("All");
        router.push("/my-orders");
    };

    const handlePageChange = (page: number) => {
        updateURLParams(localSearch, localStatus, page, pageSize, companyInput);
    };

    const handlePageSizeChange = (size: number) => {
        updateURLParams(localSearch, localStatus, 1, size, companyInput);
    };

    const handleViewOrder = (entityId: string) => {
        router.push(`/my-orders/${entityId}`);
    };

    const handleReorder = async (order: Order) => {
        const token = (session as any)?.accessToken;
        if (!token) {
            toast.error("You must be logged in to reorder.");
            return;
        }

        const toastId = toast.loading("Adding items to cart...");
        try {
            const res = await fetch(`/api/kleverapi/order/${order.entity_id}/reorder`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to reorder");

            await refetchCart();
            toast.success("Items added to cart", { id: toastId });
            router.push("/cart");
        } catch (err: any) {
            toast.error(err.message || "Something went wrong", { id: toastId });
        }
    };

    const handleExportOrders = async () => {
        const token = (session as any)?.accessToken;
        if (!token) {
            toast.error("You must be logged in to export orders.");
            return;
        }

        setIsExporting(true);
        const toastId = toast.loading("Exporting orders...");

        try {
            const response = await fetch("/api/kleverapi/orders/export", {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to export orders");

            const base64Content = data.pdf_base64 || data.content || data.base64 || data.csv_base64;
            if (!base64Content) throw new Error("No file content received from server");

            const byteCharacters = atob(base64Content);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: "text/csv" });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = data.filename || `Orders_Export_${new Date().getTime()}.csv`;
            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 100);

            toast.success("Orders exported successfully", { id: toastId });
        } catch (err: any) {
            console.error("Export Error:", err);
            toast.error(err.message || "Something went wrong", { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };

    const totalPages = Math.ceil(totalItems / pageSize);
    const isFiltered = !!(localSearch !== "All" || localStatus !== "All" || searchParams.get("orderNumber") || searchParams.get("status"));

    if (authStatus === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#f5a623]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-['Rubik']">
            <Navbar />

            <div className="flex max-w-[1440px] mx-auto mt-[80px]">
                <Sidebar />

                <main className="flex-1 p-8 min-h-screen">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-[24px] font-bold text-black uppercase">
                            MY ORDERS
                        </h1>
                        <button
                            onClick={handleExportOrders}
                            disabled={isExporting}
                            className={`flex items-center gap-2 border-2 border-[#f5a623] text-black text-[12px] font-bold px-5 py-2 uppercase tracking-wide hover:bg-[#f5a623] transition-colors ${isExporting ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isExporting ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            )}
                            {isExporting ? 'Exporting...' : 'Export Orders'}
                        </button>
                    </div>

                    <Filters
                        status={localStatus}
                        search={localSearch}
                        onStatusChange={setLocalStatus}
                        onSearchChange={setLocalSearch}
                        onApplySearch={handleSearchClick}
                        onReset={handleResetClick}
                        isFiltered={isFiltered}
                        statusCounts={statusCounts}
                    />

                    {isLoading && !hasFetched ? (
                        <div className="py-10">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-16 bg-gray-50 mb-2 animate-pulse rounded-lg"></div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-center py-16 text-red-500">
                            <p className="text-[14px] font-medium mb-3">{error}</p>
                            <button
                                onClick={() => fetchOrders(searchInput, statusInput, currentPage, pageSize, companyInput)}
                                className="h-[45px] px-8 bg-black text-white text-[13px] font-bold uppercase tracking-wider hover:bg-gray-800 transition-all rounded-[2px]"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="w-full">
                            <div className="mb-4">
                                <button
                                    onClick={handleResetClick}
                                    className="px-4 py-1.5 bg-[#f0f0f0] border border-gray-300 text-[13px] text-black hover:bg-gray-200 transition-colors rounded-[2px]"
                                >
                                    Reset
                                </button>
                            </div>
                            <div className="flex items-center gap-3 bg-[#fef9c3] border border-[#fef08a] p-4 rounded-md text-[#854d0e]">
                                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span className="text-[14px] font-medium">You have placed no orders.</span>
                            </div>
                        </div>
                    ) : (
                        <div className={`transition-opacity duration-200 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                            <OrdersTable
                                orders={orders}
                                onViewOrder={handleViewOrder}
                                onReorder={handleReorder}
                            />
                            {totalItems > 0 && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalItems={totalItems}
                                    pageSize={pageSize}
                                    onPageChange={handlePageChange}
                                    onPageSizeChange={handlePageSizeChange}
                                />
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
