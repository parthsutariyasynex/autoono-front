"use client";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocalePath } from "@/hooks/useLocalePath";

import React, { useState, useEffect, useCallback } from "react";
import { redirectToLogin } from "@/utils/helpers";
import Price from "@/app/components/Price";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { toast } from "react-hot-toast";
import { useCart } from "@/modules/cart/context/CartContext";

export default function OrderDetailsPage() {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();
    const { t } = useTranslation();
    const lp = useLocalePath();
    const { orderId } = useParams();
    const { refetchCart } = useCart();

    const [order, setOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [attachments, setAttachments] = useState<any[]>([]);
    const [isAttachmentsLoading, setIsAttachmentsLoading] = useState(false);
    const [attachmentsError, setAttachmentsError] = useState<string | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [openingAttachmentId, setOpeningAttachmentId] = useState<string | null>(null);

    // Auth Guard
    useEffect(() => {
        if (authStatus === "unauthenticated") {
            redirectToLogin(router);
        }
    }, [authStatus, router]);

    // API Call
    const fetchOrderDetails = useCallback(async () => {
        const token = (session as any)?.accessToken;
        if (!token || !orderId) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/kleverapi/order/${orderId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch order details");
            }

            const data = await response.json();
            setOrder(data);
        } catch (err: any) {
            setError(err.message || "Something went wrong while fetching order details");
        } finally {
            setIsLoading(false);
        }
    }, [session, orderId]);

    const fetchAttachments = useCallback(async () => {
        const token = (session as any)?.accessToken;
        if (!token || !orderId) return;

        setIsAttachmentsLoading(true);
        setAttachmentsError(null);

        try {
            const response = await fetch(`/api/kleverapi/order/${orderId}/attachments`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                // If it's 404, we might just want to show "No attachments available" instead of an error message
                if (response.status === 404) {
                    setAttachments([]);
                    return;
                }
                throw new Error(data.message || "Failed to fetch order attachments");
            }

            const attachmentsList = Array.isArray(data)
                ? data
                : (data?.attachments || data?.items || []);

            setAttachments(attachmentsList);
        } catch (err: any) {
            console.error("Attachment Fetch Error:", err);
            setAttachmentsError(err.message || "Something went wrong while fetching order attachments");
        } finally {
            setIsAttachmentsLoading(false);
        }
    }, [session, orderId]);

    useEffect(() => {
        if (authStatus === "authenticated") {
            fetchOrderDetails();
        }
    }, [authStatus, fetchOrderDetails]);

    useEffect(() => {
        if (order) {
            fetchAttachments();
        }
    }, [order, fetchAttachments]);

    const handlePrintOrder = async () => {
        const token = (session as any)?.accessToken;
        if (!token || !orderId) {
            toast.error("User session not found. Please log in again.");
            return;
        }

        setIsPrinting(true);
        const toastId = toast.loading("Preparing your order PDF...");

        try {
            const response = await fetch(`/api/kleverapi/order/${orderId}/pdf`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to fetch order PDF");
            }

            const data = await response.json();

            // Handle base64 from response - checking common field names
            const base64Content = data.pdf_base64 || data.content || data.base64;
            const fileName = data.filename || `Order_${order?.increment_id || orderId}.pdf`;

            if (!base64Content) {
                throw new Error("No PDF content received from server.");
            }

            // Convert base64 → Blob
            const byteCharacters = atob(base64Content);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: "application/pdf" });

            // Use URL.createObjectURL
            const url = window.URL.createObjectURL(blob);

            // Trigger download with <a> tag
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("Order PDF downloaded successfully!", { id: toastId });
        } catch (err: any) {
            console.error("Print Error:", err);
            toast.error(err.message || "Something went wrong while printing", { id: toastId });
        } finally {
            setIsPrinting(false);
        }
    };

    const handleReorder = async () => {
        const token = (session as any)?.accessToken;
        if (!token) {
            toast.error("You must be logged in to reorder.");
            return;
        }

        const toastId = toast.loading("Adding items to cart...");
        try {
            // Use entity_id for reorder if available, otherwise orderId from params
            const targetOrderId = order?.entity_id || orderId;
            const res = await fetch(`/api/kleverapi/order/${targetOrderId}/reorder`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to reorder");

            await refetchCart();
            toast.success("Items added to cart", { id: toastId });
            router.push(lp("/cart"));
        } catch (err: any) {
            toast.error(err.message || "Something went wrong", { id: toastId });
        }
    };

    const handleOpenAttachment = async (attachment: any) => {
        const token = (session as any)?.accessToken;
        if (!token) {
            toast.error("Unable to open attachment");
            return;
        }

        const attachmentId = attachment.attachment_id || attachment.id;
        setOpeningAttachmentId(attachmentId);

        try {
            const fileUrl = attachment.file_url || "";
            const proxyUrl = `/api/kleverapi/order-attachments/file/${attachmentId}?url=${encodeURIComponent(fileUrl)}`;

            const response = await fetch(proxyUrl, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || `Failed to fetch file (${response.status})`);
            }

            const contentType = response.headers.get("content-type") || "application/octet-stream";
            const blob = await response.blob();

            if (blob.size === 0) {
                throw new Error("File is empty");
            }

            const blobUrl = URL.createObjectURL(new Blob([blob], { type: contentType }));
            const link = document.createElement("a");
            link.href = blobUrl;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err: any) {
            console.error("Attachment open error:", err);
            toast.error(err.message || "Unable to open attachment");
        } finally {
            setOpeningAttachmentId(null);
        }
    };

    // Helpers
    const formatStatus = (status: string) => {
        if (!status) return;
        if (status === "approval_pending") return "Check Pending";
        return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        const dateObj = new Date(dateString);
        return dateObj.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatCurrency = (amount: number | string | undefined | null) => {
        return <Price amount={amount} />;
    };

    if (authStatus === "loading" || (isLoading && !order)) {
        return (
            <div className="min-h-screen flex flex-col w-full bg-[#fcfcfc] font-rubik">
                <div className="flex flex-col lg:flex-row flex-1 w-full">
                    <Sidebar />
                    <main className="flex-1 w-full flex items-center justify-center p-4 md:p-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-yellow-400"></div>
                    </main>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col w-full bg-[#fcfcfc] font-rubik">
                <div className="flex flex-col lg:flex-row flex-1 w-full">
                    <Sidebar />
                    <main className="flex-1 w-full px-4 md:px-6 lg:px-8 py-10">
                        <div className="bg-red-50 border border-red-100 text-red-600 p-4 md:p-8 rounded-lg text-center shadow-sm">
                            <p className="font-bold text-[14px] uppercase tracking-widest mb-2">Error Loading Order</p>
                            <p className="text-xs">{error}</p>
                            <button
                                onClick={fetchOrderDetails}
                                className="mt-6 px-6 md:px-8 py-2.5 bg-red-600 text-white rounded-md font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all active:scale-95 w-full sm:w-auto"
                            >
                                Try Again
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!order) return null;

    const shippingAddress = order.extension_attributes?.shipping_assignments?.[0]?.shipping?.address || order.shipping_address;
    const billingAddress = order.billing_address;
    const paymentMethod = order.payment?.additional_information?.[0] || order.payment?.method || "N/A";

    return (
        <div className="min-h-screen flex flex-col w-full bg-[#fcfcfc] font-rubik">
            <div className="flex flex-col lg:flex-row flex-1 w-full">
                {/* Left Sidebar */}
                <Sidebar />

                {/* Right Content */}
                <main className="flex-1 w-full px-4 md:px-6 lg:px-8 py-10 min-w-0 text-xs">
                    {/* Header Section */}
                    <div className="flex flex-col mb-10">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-10 border-b-2 border-yellow-400 pb-2 gap-2 sm:gap-0">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                                <h1 className="text-[20px] md:text-[26px] font-black text-black uppercase tracking-tight">
                                    ORDER # {order.increment_id}
                                </h1>
                                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${order.status?.toLowerCase().includes('pending') ? 'bg-yellow-100 text-yellow-700' :
                                    order.status?.toLowerCase().includes('complete') ? 'bg-green-100 text-green-700' :
                                        order.status?.toLowerCase().includes('cancel') ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-700'
                                    }`}>
                                    {formatStatus(order.status)}
                                </span>
                            </div>
                            <div className="text-gray-500 font-bold uppercase tracking-widest text-[11px]">
                                {formatDate(order.created_at)}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-start items-stretch sm:items-center gap-3 w-full">
                            <button
                                onClick={handleReorder}
                                className="bg-yellow-400 hover:bg-yellow-500 text-black font-black py-2.5 px-6 md:px-8 rounded-md text-[11px] uppercase tracking-widest transition-all shadow-sm active:scale-95 border border-yellow-500 w-full sm:w-auto"
                            >
                                REORDER
                            </button>
                            <button
                                onClick={handlePrintOrder}
                                disabled={isPrinting}
                                className={`bg-white hover:bg-gray-50 text-black font-black py-2.5 px-6 md:px-8 rounded-md text-[11px] uppercase tracking-widest transition-all border border-[#ebebeb] shadow-sm flex items-center justify-center gap-2 no-print active:scale-95 w-full sm:w-auto ${isPrinting ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isPrinting ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
                                ) : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                        <rect x="6" y="14" width="12" height="8"></rect>
                                    </svg>
                                )}
                                {isPrinting ? "PRINTING..." : "PRINT ORDER"}
                            </button>
                        </div>
                    </div>

                    {/* Items Ordered Table */}
                    <div className="bg-white rounded-md border border-[#ebebeb] overflow-hidden mb-10 shadow-sm">
                        <div className="border-b border-[#ebebeb] px-3 md:px-6 py-3 md:py-4 bg-gray-50">
                            <h2 className="text-xs font-black text-black uppercase tracking-widest">
                                Items Ordered
                            </h2>
                        </div>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left min-w-[500px]">
                                <thead className="bg-gray-50/50 text-[11px] font-black text-black uppercase border-b border-[#ebebeb]">
                                    <tr>
                                        <th className="px-3 md:px-6 py-3 md:py-4 tracking-widest">Product Name</th>
                                        <th className="px-3 md:px-6 py-3 md:py-4 tracking-widest text-center">SKU</th>
                                        <th className="px-3 md:px-6 py-3 md:py-4 tracking-widest text-center">Price</th>
                                        <th className="px-3 md:px-6 py-3 md:py-4 tracking-widest text-center">Qty</th>
                                        <th className="px-3 md:px-6 py-3 md:py-4 tracking-widest text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#ebebeb]">
                                    {order.items?.map((item: any, idx: number) => (
                                        <tr key={item.item_id || item.id} className={`text-xs hover:bg-yellow-50/30 transition-colors ${idx % 2 !== 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                            <td className="px-3 md:px-6 py-3 md:py-5 text-black font-bold">
                                                {item.name}
                                            </td>
                                            <td className="px-3 md:px-6 py-3 md:py-5 text-gray-400 font-bold text-center">
                                                {item.sku}
                                            </td>
                                            <td className="px-3 md:px-6 py-3 md:py-5 text-black font-bold text-center">
                                                {formatCurrency(item.price)}
                                            </td>
                                            <td className="px-3 md:px-6 py-3 md:py-5 text-center text-gray-500 font-bold uppercase">
                                                {Math.round(item.qty_ordered)}
                                            </td>
                                            <td className="px-3 md:px-6 py-3 md:py-5 text-right font-black text-black">
                                                {formatCurrency(item.row_total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-[#ebebeb]">
                            {order.items?.map((item: any, idx: number) => (
                                <div key={item.item_id || item.id} className={`p-4 text-xs ${idx % 2 !== 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                    <p className="text-black font-black text-sm mb-2">{item.name}</p>
                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-3">SKU: {item.sku}</p>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-gray-500 font-bold uppercase tracking-widest">Price</span>
                                        <span className="text-black font-bold">{formatCurrency(item.price)}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-gray-500 font-bold uppercase tracking-widest">Qty</span>
                                        <span className="text-gray-500 font-bold">{Math.round(item.qty_ordered)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                        <span className="text-black font-black uppercase tracking-widest">Subtotal</span>
                                        <span className="text-black font-black">{formatCurrency(item.row_total)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="flex justify-end p-4 md:p-8 bg-gray-50/30 border-t border-[#ebebeb]">
                            <div className="w-full max-w-[340px] space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400 font-bold uppercase tracking-widest flex-1 text-right mr-10">Items Total</span>
                                    <span className="font-black text-black w-[110px] text-right">
                                        {formatCurrency(order.subtotal)}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400 font-bold uppercase tracking-widest flex-1 text-right mr-10">VAT (15%)</span>
                                    <span className="font-black text-black w-[110px] text-right">
                                        {formatCurrency(order.tax_amount)}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center text-black pt-4 border-t border-gray-200">
                                    <span className="font-black uppercase tracking-tighter flex-1 text-right mr-10 text-[18px]">Grand Total</span>
                                    <span className="font-black w-[110px] text-right text-[18px]">
                                        {formatCurrency(order.grand_total)}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center text-[11px] pt-1 pt-4 opacity-50">
                                    <span className="text-gray-500 font-black uppercase tracking-widest flex-1 text-right mr-10">Total Qty</span>
                                    <span className="font-black text-black w-[110px] text-right">
                                        {Math.round(order.total_item_count || order.items?.reduce((acc: number, item: any) => acc + (item.qty_ordered || 0), 0))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Information Section */}
                    <div className="mb-10">
                        <div className="border-b-2 border-yellow-400 inline-block pb-1 mb-10">
                            <h2 className="text-[16px] md:text-[18px] font-black text-black uppercase tracking-tight">
                                Order Information
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                            {/* Shipping Address */}
                            <div className="bg-white border border-[#ebebeb] rounded-md shadow-sm overflow-hidden">
                                <div className="bg-gray-50 px-5 py-3 border-b border-[#ebebeb]">
                                    <h3 className="text-xs font-black text-black uppercase tracking-widest">Shipping Address</h3>
                                </div>
                                <div className="p-4 md:p-6 text-xs text-gray-600 leading-relaxed min-h-[140px]">
                                    {shippingAddress ? (
                                        <div className="space-y-1">
                                            <p className="font-black text-black uppercase mb-2">{shippingAddress.firstname} {shippingAddress.lastname}</p>
                                            {shippingAddress.company && <p className="font-medium">{shippingAddress.company}</p>}
                                            <p className="font-medium">{shippingAddress.street?.join(", ")}</p>
                                            <p className="font-medium">{shippingAddress.city}, {shippingAddress.postcode}</p>
                                            <p className="font-medium">{shippingAddress.country_id === "SA" ? "Saudi Arabia" : shippingAddress.country_id}</p>
                                            <p className="pt-2 text-black font-black">T: <span className="text-gray-600 font-medium">{shippingAddress.telephone}</span></p>
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 italic">No shipping address available</p>
                                    )}
                                </div>
                            </div>

                            {/* Shipping Method */}
                            <div className="bg-white border border-[#ebebeb] rounded-md shadow-sm overflow-hidden">
                                <div className="bg-gray-50 px-5 py-3 border-b border-[#ebebeb]">
                                    <h3 className="text-xs font-black text-black uppercase tracking-widest">Shipping Method</h3>
                                </div>
                                <div className="p-4 md:p-6 text-xs text-gray-600 leading-relaxed min-h-[140px]">
                                    <p className="font-black text-black uppercase mb-2">{order.shipping_description || "Pickup from Warehouse"}</p>
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Expected Delivery</p>
                                        <p className="font-bold text-black">N/A</p>
                                    </div>
                                </div>
                            </div>

                            {/* Billing Address */}
                            <div className="bg-white border border-[#ebebeb] rounded-md shadow-sm overflow-hidden">
                                <div className="bg-gray-50 px-5 py-3 border-b border-[#ebebeb]">
                                    <h3 className="text-xs font-black text-black uppercase tracking-widest">Billing Address</h3>
                                </div>
                                <div className="p-4 md:p-6 text-xs text-gray-600 leading-relaxed min-h-[140px]">
                                    {billingAddress ? (
                                        <div className="space-y-1">
                                            <p className="font-black text-black uppercase mb-2">{billingAddress.firstname} {billingAddress.lastname}</p>
                                            {billingAddress.company && <p className="font-medium">{billingAddress.company}</p>}
                                            <p className="font-medium">{billingAddress.street?.join(", ")}</p>
                                            <p className="font-medium">{billingAddress.city}, {billingAddress.postcode}</p>
                                            <p className="font-medium">{billingAddress.country_id === "SA" ? "Saudi Arabia" : billingAddress.country_id}</p>
                                            <p className="pt-2 text-black font-black">T: <span className="text-gray-600 font-medium">{billingAddress.telephone}</span></p>
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 italic">No billing address available</p>
                                    )}
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="bg-white border border-[#ebebeb] rounded-md shadow-sm overflow-hidden">
                                <div className="bg-gray-50 px-5 py-3 border-b border-[#ebebeb]">
                                    <h3 className="text-xs font-black text-black uppercase tracking-widest">Payment Method</h3>
                                </div>
                                <div className="p-4 md:p-6 text-xs text-gray-600 leading-relaxed min-h-[140px]">
                                    <p className="font-black text-black uppercase mb-1">{order.payment?.method_title || paymentMethod}</p>
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Confirmed</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Attachments Section */}
                    <div className="mb-12">
                        <div className="border-b-2 border-yellow-400 inline-block pb-1 mb-10">
                            <h2 className="text-[16px] md:text-[18px] font-black text-black uppercase tracking-tight">
                                Order Attachments
                            </h2>
                        </div>

                        {attachmentsError ? (
                            <div className="bg-red-50 border border-red-100 text-red-600 p-4 md:p-8 rounded-md text-center shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-widest mb-2">Error Loading Attachments</p>
                                <p className="text-xs">{attachmentsError}</p>
                            </div>
                        ) : isAttachmentsLoading ? (
                            <div className="bg-white rounded-md border border-[#ebebeb] p-20 flex justify-center items-center shadow-sm">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-yellow-400"></div>
                            </div>
                        ) : attachments.length > 0 ? (
                            <div className="bg-white border border-[#ebebeb] rounded-md overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs border-collapse">
                                        <thead className="bg-gray-50 border-b border-[#ebebeb]">
                                            <tr className="h-[50px]">
                                                <th className="px-3 md:px-6 py-3 md:py-4 font-black text-black text-left tracking-widest uppercase">File Name</th>
                                                <th className="px-3 md:px-6 py-3 md:py-4 font-black text-black text-center tracking-widest uppercase">Type</th>
                                                <th className="px-3 md:px-6 py-3 md:py-4 font-black text-black text-center tracking-widest uppercase">Created On</th>
                                                <th className="px-3 md:px-6 py-3 md:py-4 font-black text-black text-center tracking-widest uppercase">Due Date</th>
                                                <th className="px-3 md:px-6 py-3 md:py-4 font-black text-black text-center tracking-widest uppercase">Payment</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#ebebeb]">
                                            {attachments.map((attachment: any, idx: number) => {
                                                const formatDateDDMMYYYY = (dateStr: string | undefined | null) => {
                                                    if (!dateStr) return "-";
                                                    try {
                                                        const d = new Date(dateStr);
                                                        if (isNaN(d.getTime())) return dateStr;
                                                        const day = String(d.getDate()).padStart(2, '0');
                                                        const month = String(d.getMonth() + 1).padStart(2, '0');
                                                        const year = d.getFullYear();
                                                        return `${day}-${month}-${year}`;
                                                    } catch {
                                                        return dateStr;
                                                    }
                                                };

                                                const currentAttachmentId = attachment.attachment_id || attachment.id || idx;
                                                const isOpening = openingAttachmentId === String(currentAttachmentId);

                                                return (
                                                    <tr key={currentAttachmentId} className={`hover:bg-yellow-50/30 transition-colors ${idx % 2 !== 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                                        <td className="px-3 md:px-6 py-3 md:py-5 text-left">
                                                            <button
                                                                onClick={() => handleOpenAttachment(attachment)}
                                                                disabled={isOpening}
                                                                className="text-yellow-600 hover:text-black font-black break-all text-left cursor-pointer inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait underline underline-offset-4"
                                                            >
                                                                {isOpening && (
                                                                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-500 border-t-transparent flex-shrink-0"></span>
                                                                )}
                                                                {attachment.file_name || "-"}
                                                            </button>
                                                        </td>
                                                        <td className="px-3 md:px-6 py-3 md:py-5 text-center text-gray-500 font-bold uppercase">
                                                            {attachment.document_type || attachment.attachment_type || "-"}
                                                        </td>
                                                        <td className="px-3 md:px-6 py-3 md:py-5 text-center text-gray-500 font-bold uppercase">
                                                            {formatDateDDMMYYYY(attachment.upload_date)}
                                                        </td>
                                                        <td className="px-3 md:px-6 py-3 md:py-5 text-center text-gray-400 font-bold uppercase">
                                                            {attachment.invoice_due ? formatDateDDMMYYYY(attachment.invoice_due) : "-"}
                                                        </td>
                                                        <td className="px-3 md:px-6 py-3 md:py-5 text-center">
                                                            <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                                {attachment.payment || attachment.payment_status || "-"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white border border-[#ebebeb] p-10 md:p-20 text-center text-gray-400 italic rounded-md shadow-sm text-xs font-bold uppercase tracking-widest">
                                No attachments available for this order
                            </div>
                        )}
                    </div>
                </main>
            </div>


            {/* --- Printable Area (Hidden on screen) --- */}
            <div id="printable-order" className="hidden-print-container">
                <div className="printable-header">
                    <div className="comp-info">
                        <p className="font-bold">Btire.com</p>
                        <p>Jeddah</p>
                        <p>Saudi Arabia</p>
                        <p>TRN: </p>
                        <p>Phone: {shippingAddress?.telephone || "-"}</p>
                        <p>Website: https://altalayi-demo.btire.com/</p>
                    </div>
                    <div className="order-title-box">
                        <h1 className="order-summary-title">ORDER SUMMARY</h1>
                    </div>
                    <div className="order-meta">
                        <img src="/logo/atcl-bridgestone-logo-v1.jpg" alt="Logo" className="print-logo" />
                        <div className="meta-row">
                            <span className="label">ORDER #</span>
                            <span className="value">{order.increment_id}</span>
                        </div>
                        <div className="meta-row">
                            <span className="label">DATE</span>
                            <span className="value">{formatDate(order.created_at)}</span>
                        </div>
                    </div>
                </div>

                <div className="address-box-container">
                    <div className="address-header-row">
                        <div className="header-cell">BILLING ADDRESS</div>
                        <div className="header-cell">SHIP TO</div>
                    </div>
                    <div className="address-content-row">
                        <div className="content-cell border-r border-black">
                            <p className="font-bold">{billingAddress?.firstname} {billingAddress?.lastname}</p>
                            <p>{billingAddress?.company || "-"}</p>
                            <p>{billingAddress?.street?.join(", ")}</p>
                            <p>{billingAddress?.city}, {billingAddress?.postcode}</p>
                            <p>{billingAddress?.country_id === "SA" ? "Saudi Arabia" : billingAddress?.country_id}</p>
                            <p>Phone: {billingAddress?.telephone}</p>
                            <p>Email: {order.customer_email || "-"}</p>
                        </div>
                        <div className="content-cell">
                            <p className="font-bold">{shippingAddress?.firstname} {shippingAddress?.lastname}</p>
                            <p>{shippingAddress?.company || "-"}</p>
                            <p>{shippingAddress?.street?.join(", ")}</p>
                            <p>{shippingAddress?.city}, {shippingAddress?.postcode}</p>
                            <p>{shippingAddress?.country_id === "SA" ? "Saudi Arabia" : shippingAddress?.country_id}</p>
                            <p>Phone: {shippingAddress?.telephone}</p>
                        </div>
                    </div>
                </div>

                <table className="items-print-table">
                    <thead>
                        <tr>
                            <th className="text-left">DESCRIPTION</th>
                            <th className="text-center">QTY</th>
                            <th className="text-right">UNIT PRICE</th>
                            <th className="text-right">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items?.map((item: any) => (
                            <tr key={item.item_id}>
                                <td>
                                    <p className="item-name">{item.name}</p>
                                    <p className="item-sku">{item.sku}</p>
                                </td>
                                <td className="text-center">{Math.round(item.qty_ordered)}</td>
                                <td className="text-right">{formatCurrency(item.price)}</td>
                                <td className="text-right font-bold">{formatCurrency(item.row_total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="totals-print-container">
                    <div className="totals-wrapper">
                        <div className="total-row">
                            <span>SUB TOTAL</span>
                            <span>{formatCurrency(order.subtotal)}</span>
                        </div>
                        <div className="total-row">
                            <span>TAX</span>
                            <span>{formatCurrency(order.tax_amount)}</span>
                        </div>
                        <div className="total-row grand-total-row">
                            <span>GRAND TOTAL</span>
                            <span>{formatCurrency(order.grand_total)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Styles for Printing */}
            <style jsx global>{`
                #printable-order {
                    display: none;
                }

                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-order, #printable-order * {
                        visibility: visible;
                    }
                    #printable-order {
                        display: block !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white !important;
                        color: black !important;
                        padding: 20px;
                        font-family: 'Rubik', sans-serif;
                    }
                    
                    /* Reset everything else */
                    .no-print, aside, nav, header, footer {
                        display: none !important;
                    }
                    
                    /* Header Styles */
                    .printable-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 30px;
                    }
                    .comp-info {
                        font-size: 11px;
                        line-height: 1.4;
                    }
                    .order-title-box {
                        flex: 1;
                        text-align: center;
                    }
                    .order-summary-title {
                        font-size: 20px;
                        font-weight: 700;
                        text-decoration: none;
                        display: inline-block;
                        border-bottom: 1.5px solid black;
                        padding-bottom: 2px;
                        margin-top: 10px;
                    }
                    .order-meta {
                        text-align: right;
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }
                    .print-logo {
                        height: 40px;
                        width: auto;
                        margin-bottom: 10px;
                        margin-left: auto;
                    }
                    .meta-row {
                        display: flex;
                        justify-content: space-between;
                        font-size: 11px;
                        font-weight: 600;
                        gap: 20px;
                    }
                    .meta-row .label { width: 60px; text-align: left; }
                    .meta-row .value { text-align: right; }

                    /* Address Box Styles */
                    .address-box-container {
                        border: 1px solid black;
                        margin-bottom: 30px;
                        border-radius: 2px;
                        overflow: hidden;
                    }
                    .address-header-row {
                        display: flex;
                        background-color: #f0f0f0 !important;
                        -webkit-print-color-adjust: exact;
                        border-bottom: 1px solid black;
                    }
                    .header-cell {
                        flex: 1;
                        padding: 6px 15px;
                        font-size: 11px;
                        font-weight: 700;
                    }
                    .address-content-row {
                        display: flex;
                    }
                    .content-cell {
                        flex: 1;
                        padding: 15px;
                        font-size: 11px;
                        line-height: 1.5;
                        min-height: 120px;
                    }

                    /* Table Styles */
                    .items-print-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 30px;
                    }
                    .items-print-table th {
                        background-color: #f0f0f0 !important;
                        -webkit-print-color-adjust: exact;
                        border: 1px solid black;
                        padding: 8px 15px;
                        font-size: 11px;
                        font-weight: 700;
                    }
                    .items-print-table td {
                        border: 1px solid black;
                        padding: 10px 15px;
                        font-size: 11px;
                        vertical-align: top;
                    }
                    .item-name { font-weight: 700; margin-bottom: 2px; }
                    .item-sku { font-size: 10px; color: #444; }

                    /* Totals Styles */
                    .totals-print-container {
                        display: flex;
                        justify-content: flex-end;
                    }
                    .totals-wrapper {
                        width: 250px;
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        font-size: 11px;
                        font-weight: 700;
                    }
                    .grand-total-row {
                        margin-top: 5px;
                        padding-top: 5px;
                        font-size: 13px;
                        font-weight: 900;
                    }
                }
            `}</style>
        </div>
    );
}
