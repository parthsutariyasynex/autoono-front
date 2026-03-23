"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { Search, RotateCcw } from "lucide-react";
import Pagination from "@/components/Pagination";
import toast from "react-hot-toast";

// Fetcher with token
const fetcher = async (url: string, token: string | null) => {
    if (!token) return null;
    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!res.ok) {
        const error = new Error("An error occurred while fetching the data.");
        // @ts-ignore
        error.info = await res.json();
        // @ts-ignore
        error.status = res.status;
        throw error;
    }
    return res.json();
};

export default function OrderAttachmentsPage() {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();

    // Filters state
    const [searchText, setSearchText] = useState("");
    const [searchOrderId, setSearchOrderId] = useState("");
    const [documentType, setDocumentType] = useState("All");
    const [invoiceDue, setInvoiceDue] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [openingFileId, setOpeningFileId] = useState<string | null>(null);

    // Auth Guard
    useEffect(() => {
        if (authStatus === "unauthenticated") {
            router.replace("/login");
        }
    }, [authStatus, router]);

    // Construct API URL with query params
    const token = (session as any)?.accessToken;
    const queryParams = new URLSearchParams();
    if (searchOrderId) queryParams.append("order_id", searchOrderId);
    if (documentType !== "All") queryParams.append("document_type", documentType);
    if (invoiceDue !== "All") queryParams.append("invoice_due", invoiceDue);
    queryParams.append("pageSize", pageSize.toString());
    queryParams.append("currentPage", currentPage.toString());

    const apiUrl = token
        ? `/api/kleverapi/order-attachments/search${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
        : null;

    // SWR for data fetching
    const { data, error, isLoading, mutate } = useSWR(
        apiUrl ? [apiUrl, token] : null,
        ([url, t]) => fetcher(url, t)
    );

    // Filter Options
    const { data: filterOptionsData } = useSWR(
        token ? [`/api/kleverapi/order-attachments/filter-options`, token] : null,
        ([url, t]) => fetcher(url, t)
    );

    const docTypeOptions = filterOptionsData?.document_type_options || filterOptionsData?.document_types || [];
    const invoiceDueOptions = filterOptionsData?.invoice_due_options || filterOptionsData?.invoice_due || [];

    // Helper to ensure "All" is present and at the start
    const getOptionsWithAll = (options: any[]) => {
        if (!options || options.length === 0) return ["All"];
        const hasAll = options.some(opt => {
            const label = typeof opt === 'string' ? opt : (opt.label || opt.name || opt.status || "");
            return label.toLowerCase() === "all";
        });
        return hasAll ? options : ["All", ...options];
    };

    const finalDocTypes = getOptionsWithAll(docTypeOptions);
    const finalInvoiceDues = getOptionsWithAll(invoiceDueOptions);

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSearchOrderId(searchText);
        setCurrentPage(1);
    };

    const handleReset = () => {
        setSearchText("");
        setSearchOrderId("");
        setDocumentType("All");
        setInvoiceDue("All");
        setCurrentPage(1);
    };

    const handleViewOrder = (orderId: string) => {
        if (!orderId) return;
        router.push(`/my-orders/${orderId}`);
    };

    const handleViewFile = async (attachment: any) => {
        const id = attachment.attachment_id || attachment.id;
        const fileUrl = attachment.file_url;
        if (!id) return;

        setOpeningFileId(id);
        try {
            // Build proxy URL with optional file_url for better reliability
            let proxyUrl = `/api/kleverapi/order-attachments/file/${id}`;
            if (fileUrl) {
                proxyUrl += `?url=${encodeURIComponent(fileUrl)}`;
            }

            const res = await fetch(proxyUrl, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || "Could not fetch file");
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');

            // Clean up: revoking immediately might break if the tab isn't loaded, 
            // but we'll let the user decide. Usually, we don't revoke until later.
        } catch (error: any) {
            console.error("View File Error:", error);
            toast.error(error.message || "Unable to open file");
        } finally {
            setOpeningFileId(null);
        }
    };

    const getDocTypeLabel = (fileName: string, origType: string) => {
        // If the backend provides a type (like "Invoice" or "Purchase Order"), use it directly
        if (origType && origType !== "-") return origType;

        if (!fileName) return "Document";
        const ext = fileName.split('.').pop()?.toLowerCase();

        switch (ext) {
            case 'pdf': return "PDF Document";
            case 'jpg':
            case 'jpeg':
            case 'png': return "Image";
            case 'doc':
            case 'docx': return "Word Document";
            case 'xls':
            case 'xlsx': return "Excel Document";
            default: return "Document";
        }
    };

    const formatDate = (dateStr: string | undefined | null) => {
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

    const attachments = Array.isArray(data) ? data : data?.attachments || data?.items || [];
    const totalItems = data?.total_count || attachments.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
        setCurrentPage(1);
    };

    return (
        <div className="min-h-screen bg-white font-['Rubik']">
            <Navbar />

            <div className="flex max-w-[1440px] mx-auto mt-[100px]">
                {/* Left Sidebar */}
                <Sidebar />

                {/* Right Content */}
                <main className="flex-1 p-8 bg-white min-h-screen">
                    <div className="max-w-[1200px]">
                        <h1 className="text-[24px] font-bold text-black uppercase mb-8">
                            MY ORDER ATTACHMENTS
                        </h1>

                        {/* Search Section */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-[300px]">
                                <input
                                    type="text"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    placeholder="Search Order..."
                                    className="w-full bg-white border border-gray-300 rounded-sm px-4 py-2 text-[14px] focus:outline-none focus:border-gray-400 placeholder:text-gray-400"
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                className="bg-black text-white font-bold py-2 px-8 rounded-sm text-[14px] uppercase tracking-wide transition-colors"
                            >
                                SEARCH
                            </button>
                        </div>

                        {/* Filters Section */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end mb-10">
                            {/* Document Type */}
                            <div className="md:col-span-3">
                                <label className="block text-[16px] font-normal text-black mb-3">
                                    Document
                                </label>
                                <div className="relative">
                                    <select
                                        value={documentType}
                                        onChange={(e) => {
                                            setDocumentType(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="w-full bg-[#f4b400] text-black font-medium border-none rounded-sm px-4 py-3 text-[14px] focus:outline-none appearance-none cursor-pointer"
                                    >
                                        {finalDocTypes.map((opt: any, idx: number) => {
                                            const label = typeof opt === 'string' ? opt : (opt.label || opt.name || opt.status || String(idx));
                                            const value = typeof opt === 'string' ? opt : (opt.value || opt.id || label);
                                            return (
                                                <option key={`${label}-${idx}`} value={value}>
                                                    {label}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 1L6 6L11 1" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Invoice Due */}
                            <div className="md:col-span-3">
                                <label className="block text-[16px] font-normal text-black mb-3">
                                    Invoice Due
                                </label>
                                <div className="relative">
                                    <select
                                        value={invoiceDue}
                                        onChange={(e) => {
                                            setInvoiceDue(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="w-full bg-[#f4b400] text-black font-medium border-none rounded-sm px-4 py-3 text-[14px] focus:outline-none appearance-none cursor-pointer"
                                    >
                                        {finalInvoiceDues.map((opt: any, idx: number) => {
                                            const label = typeof opt === 'string' ? opt : (opt.label || opt.name || opt.status || String(idx));
                                            const value = typeof opt === 'string' ? opt : (opt.value || opt.id || label);
                                            return (
                                                <option key={`${label}-${idx}`} value={value}>
                                                    {label}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 1L6 6L11 1" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Reset Button */}
                            <div className="md:col-span-2">
                                <button
                                    onClick={handleReset}
                                    className="bg-black hover:bg-gray-800 text-white font-bold py-3 px-10 rounded-sm text-[14px] uppercase tracking-wide transition-colors shadow-sm"
                                >
                                    RESET
                                </button>
                            </div>
                        </div>

                        {/* Table Section */}
                        {error ? (
                            <div className="bg-red-50 border border-red-100 text-red-600 p-8 rounded-sm text-center">
                                <p className="font-bold text-[14px] mb-2">Error Loading Attachments</p>
                                <p className="text-[13px]">{error.message}</p>
                                <button
                                    onClick={() => mutate()}
                                    className="mt-4 px-6 py-2 bg-red-600 text-white rounded font-bold text-[11px] uppercase"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : isLoading ? (
                            <div className="bg-white p-12 flex flex-col items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f4b400] mb-4"></div>
                                <span className="text-[14px] text-gray-600">Loading...</span>
                            </div>
                        ) : attachments.length > 0 ? (
                            <>
                                <div className="overflow-x-auto w-full border border-gray-200 rounded-sm shadow-sm">
                                    <table className="w-full border-collapse bg-white border border-gray-200 text-black">
                                        <thead>
                                            <tr className="bg-white border-b border-gray-200">
                                                <th className="px-4 py-3 font-bold text-[14px] text-center border-r border-gray-200 whitespace-nowrap">
                                                    # Order
                                                </th>
                                                <th className="px-4 py-3 font-bold text-[14px] text-left border-r border-gray-200 whitespace-nowrap">
                                                    File Name
                                                </th>
                                                <th className="px-4 py-3 font-bold text-[14px] text-center border-r border-gray-200 whitespace-nowrap">
                                                    Document Type
                                                </th>
                                                <th className="px-4 py-3 font-bold text-[14px] text-left border-r border-gray-200 whitespace-nowrap">
                                                    Created On
                                                </th>
                                                <th className="px-4 py-3 font-bold text-[14px] text-left border-r border-gray-200 whitespace-nowrap">
                                                    Invoice Due
                                                </th>
                                                <th className="px-4 py-3 font-bold text-[14px] text-left whitespace-nowrap">
                                                    Payment
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {attachments.map((attachment: any, idx: number) => {
                                                const attId = attachment.id || attachment.attachment_id || String(idx);
                                                const isOpening = openingFileId === String(attId);

                                                // Mapping based on user provided structure
                                                const orderDisplay = attachment.order_increment_id || attachment.order_id || "-";
                                                const fileName = attachment.file_name || attachment.label || "Download File";
                                                const docTypeLabel = getDocTypeLabel(fileName, attachment.comment || attachment.document_type || attachment.attachment_type);
                                                const createdAt = formatDate(attachment.created_at || attachment.upload_date);
                                                const invoiceDue = attachment.invoice_due ? formatDate(attachment.invoice_due) : "";
                                                const paymentStatus = attachment.payment || attachment.payment_status || "";

                                                return (
                                                    <tr key={attId} className="hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-0 text-[14px]">
                                                        <td className="px-4 py-3 text-center border-r border-gray-200 font-bold whitespace-nowrap">
                                                            <button
                                                                onClick={() => handleViewOrder(attachment.order_id)}
                                                                className="text-black hover:text-[#f5a623] hover:underline transition-color cursor-pointer focus:outline-none"
                                                            >
                                                                {orderDisplay}
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-3 text-left border-r border-gray-200">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        // Use file_path if file_url is missing
                                                                        const useUrl = attachment.file_url || attachment.file_path;
                                                                        handleViewFile({ ...attachment, file_url: useUrl, attachment_id: attId });
                                                                    }}
                                                                    disabled={isOpening}
                                                                    className={`text-black hover:underline inline-block break-all text-left focus:outline-none ${isOpening ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                                >
                                                                    {fileName}
                                                                </button>
                                                                {isOpening && (
                                                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#f4b400]"></div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center border-r border-gray-200">
                                                            {docTypeLabel}
                                                        </td>
                                                        <td className="px-4 py-3 text-left border-r border-gray-200">
                                                            {createdAt}
                                                        </td>
                                                        <td className="px-4 py-3 text-left border-r border-gray-200">
                                                            {invoiceDue}
                                                        </td>
                                                        <td className="px-4 py-3 text-left">
                                                            {paymentStatus}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
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
                            </>
                        ) : (
                            <div className="border border-gray-100 p-16 text-center rounded-sm">
                                <p className="text-gray-400 italic text-[14px]">No attachments found</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
