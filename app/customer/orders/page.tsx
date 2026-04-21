"use client";
import { useLocalePath } from "@/hooks/useLocalePath";
import { useTranslation } from "@/hooks/useTranslation";

import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import Filters from "./components/Filters";
import OrdersTable, { Order } from "./components/OrdersTable";
import Pagination from "@/components/Pagination";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
// formatPrice removed — OrdersTable uses <Price> component directly

/**
 * Maps any Magento order item to our Order interface.
 * Strictly follows the internal mapping rules provided.
 */
function mapOrderItem(item: any): Order {
    // Order #
    const id = item.increment_id
        || item.order_number
        || item.entity_id?.toString()
        || "-";

    // SAP Order Number
    const sapOrderNumber = item.sap_order_number
        || item.sap_order_id
        || "";

    // Date → M/DD/YY matching live site (e.g. "3/17/26")
    let date = "";
    const rawDate = item.created_at || item.order_date;
    if (rawDate) {
        try {
            const d = new Date(rawDate);
            const month = d.getMonth() + 1;
            const day = d.getDate();
            const year = d.getFullYear().toString().slice(-2);
            date = `${month}/${day}/${year}`;
        } catch {
            date = rawDate;
        }
    }

    // Pass raw amount — OrdersTable renders it via <Price> component with dirham font
    const grandTotal = String(parseFloat(item.grand_total || item.total || 0));

    // Ordered By → show name if available, empty string if not (not "-")
    const orderedBy = item.ordered_by
        || item.customer_name
        || ((item.customer_firstname && item.customer_lastname)
            ? `${item.customer_firstname} ${item.customer_lastname}`
            : "");

    // Status → "approval_pending" → "Check Pending", others title-cased
    let status = item.status || item.order_status || "";
    if (status === "approval_pending") {
        status = "Check Pending";
    } else if (status) {
        status = status
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c: string) => c.toUpperCase());
    }

    return { id, sapOrderNumber, date, grandTotal, orderedBy, status };
}

export default function MyOrdersPage() {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();
    const lp = useLocalePath();
    const { t } = useTranslation();

    const [orders, setOrders] = useState<Order[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasFetched, setHasFetched] = useState(false);

    const [statusFilter, setStatusFilter] = useState("All");
    const [orderNumberFilter, setOrderNumberFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusQuery, setStatusQuery] = useState("All");

    // Auth guard
    useEffect(() => {
        if (authStatus === "unauthenticated") {
            router.replace(lp("/login?callback=/customer/orders"));
        }
    }, [authStatus, router]);

    const fetchOrders = useCallback(async () => {
        const token = (session as any)?.accessToken;
        if (!token) {
            console.log("[MyOrders] No token, skipping fetch. Auth status:", authStatus);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                pageSize: itemsPerPage.toString(),
                currentPage: currentPage.toString(),
            });

            if (statusQuery !== "All") {
                params.append("status", statusQuery);
            }
            if (searchQuery && searchQuery !== "All") {
                params.append("orderNumber", searchQuery);
            }

            const res = await fetch(`/api/kleverapi/my-orders?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                cache: "no-store",
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || `Server returned ${res.status}`);
            }

            const items: any[] = data.items || [];
            const mappedOrders = items.map(mapOrderItem);

            setOrders(mappedOrders);
            setTotalItems(data.total_count || mappedOrders.length);
        } catch (err: any) {
            console.error("[MyOrders] Error:", err);
            setError(typeof err === "string" ? err : (err.message || "Failed to load orders"));
        } finally {
            setIsLoading(false);
            setHasFetched(true);
        }
    }, [session, authStatus, currentPage, itemsPerPage, searchQuery, statusQuery]);

    useEffect(() => {
        if (authStatus === "authenticated") {
            fetchOrders();
        }
    }, [authStatus, fetchOrders]);

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const handleSearch = () => {
        setSearchQuery(orderNumberFilter);
        setStatusQuery(statusFilter);
        setCurrentPage(1);
    };

    const handleReset = () => {
        setStatusFilter("All");
        setOrderNumberFilter("All");
        setStatusQuery("All");
        setSearchQuery("");
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (count: number) => {
        if (count > 0) {
            setItemsPerPage(count);
            setCurrentPage(1);
        }
    };

    return (
        <div className="min-h-screen bg-white font-['Rubik'] pb-20">


            <div className="flex flex-1 min-h-0 w-full px-4 md:px-8 py-6 md:py-10">
                <div className="flex flex-1 flex-col lg:flex-row gap-6 md:gap-10 items-start w-full">
                    <Sidebar />

                    <main className="flex-1 w-full min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-8">
                            <h1 className="text-xl font-black text-black uppercase tracking-tight">
                                {t("nav.myOrders")}
                            </h1>
                            <div className="h-[2px] flex-1 bg-gradient-to-r from-primary to-transparent"></div>
                            <button className="hidden sm:flex items-center justify-center gap-2 bg-primary text-black text-label font-black px-6 py-3 uppercase tracking-widest hover:bg-[#e6950f] transition-all rounded-lg shadow-sm active:scale-95">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {t("orders.export")}
                            </button>
                        </div>

                        {/* Filters */}
                        <Filters
                            status={statusFilter}
                            orderNumber={orderNumberFilter}
                            onStatusChange={setStatusFilter}
                            onOrderNumberChange={setOrderNumberFilter}
                            onSearch={handleSearch}
                            onReset={handleReset}
                        />


                        {/* Table */}
                        <div className="relative">
                            {(isLoading || (authStatus === "loading") || (authStatus === "authenticated" && !hasFetched)) ? (
                                <div className="flex justify-center items-center py-20">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                                </div>
                            ) : error ? (
                                <div className="text-center py-16 text-red-500">
                                    <p className="text-body-lg font-medium mb-3">{error}</p>
                                    <button
                                        onClick={() => fetchOrders()}
                                        className="text-body-sm font-bold uppercase underline underline-offset-4 text-black hover:text-primary"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <OrdersTable orders={orders} />

                                    {totalItems > 0 && (
                                        <div className="mt-6">
                                            <Pagination
                                                currentPage={currentPage}
                                                totalPages={totalPages}
                                                totalItems={totalItems}
                                                pageSize={itemsPerPage}
                                                onPageChange={handlePageChange}
                                                onPageSizeChange={handleItemsPerPageChange}
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
