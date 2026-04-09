"use client";
import { useTranslation } from "@/hooks/useTranslation";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import PortalDropdown from "@/components/PortalDropdown";
import { Search, RotateCcw } from "lucide-react";
import Pagination from "@/components/Pagination";
import toast from "react-hot-toast";
import { redirectToLogin } from "@/utils/helpers";

// Helper to normalize options (strings or objects) to {label, value} format
function normalizeOptions(options: any[]): { label: string; value: string }[] {
    return options.map((opt) => {
        if (typeof opt === "string") return { label: opt, value: opt };
        const label = opt.label || opt.name || opt.status || "";
        const value = opt.value || opt.id || label;
        return { label, value: String(value) };
    });
}

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
    const { t } = useTranslation();

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
            redirectToLogin(router);
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
        router.push(lp(`/my-orders/${orderId}`));
    };

    const handleViewFile = async (attachment: any) => {
        const id = attachment.attachment_id || attachment.id;
        const fileUrl = attachment.file_url;
        const fileName = attachment.file_name || attachment.label || "file";
        if (!id) return;

        setOpeningFileId(id);
        try {
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

            // Use a hidden link to trigger download/open — works on mobile without popup blocker
            const link = document.createElement("a");
            link.href = url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";

            // For PDF/images, open in new tab; for others, trigger download
            const ext = fileName.split('.').pop()?.toLowerCase() || "";
            const viewableTypes = ["pdf", "jpg", "jpeg", "png", "gif", "webp"];
            if (!viewableTypes.includes(ext)) {
                link.download = fileName;
            }

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Revoke after delay to allow the new tab to load
            setTimeout(() => window.URL.revokeObjectURL(url), 5000);
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
        <>


            <div className="min-h-screen flex flex-col w-full bg-[#fcfcfc] font-rubik">
                <div className="flex flex-col lg:flex-row flex-1 w-full">
                    {/* Left Sidebar */}
                    <Sidebar />

                    {/* Right Content */}
                    <main className="flex-1 w-full px-4 md:px-6 lg:px-8 py-10 min-w-0">
                        <h1 className="text-[20px] md:text-[26px] font-black text-black mb-6 md:mb-10 uppercase tracking-wide">
                            MY ORDER ATTACHMENTS
                        </h1>

                        {/* Search Section */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-6 md:mb-8">
                            <div className="w-full sm:w-[200px]">
                                <input
                                    type="text"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    placeholder="Search Order..."
                                    className="w-full bg-white border border-[#ebebeb] rounded-md px-4 py-2.5 text-xs text-black focus:outline-none focus:border-yellow-400 placeholder:text-gray-400 font-bold shadow-sm"
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-500 text-black font-black py-2.5 px-4 md:px-6 rounded-md text-xs uppercase tracking-widest transition-all shadow-sm active:scale-95"
                            >
                                SEARCH
                            </button>
                        </div>

                        {/* Filters Section */}
                        <div className="flex flex-col sm:flex-row gap-4 items-end mb-6 md:mb-10 bg-white p-4 md:p-6 border border-[#ebebeb] rounded-md shadow-sm">
                            {/* Document Type */}
                            <div className="w-full sm:w-auto sm:min-w-[200px]">
                                <label className="block text-xs font-black text-black mb-2 uppercase tracking-wider">Document</label>
                                <PortalDropdown
                                    value={documentType}
                                    onChange={(val) => { setDocumentType(val); setCurrentPage(1); }}
                                    options={normalizeOptions(finalDocTypes)}
                                    buttonClassName="w-full h-[40px] bg-white text-black font-bold border border-gray-300 rounded-md px-4 text-xs text-left flex items-center justify-between cursor-pointer focus:outline-none focus:border-yellow-400"
                                />
                            </div>

                            {/* Invoice Due */}
                            <div className="w-full sm:w-auto sm:min-w-[200px]">
                                <label className="block text-xs font-black text-black mb-2 uppercase tracking-wider">Invoice Due</label>
                                <PortalDropdown
                                    value={invoiceDue}
                                    onChange={(val) => { setInvoiceDue(val); setCurrentPage(1); }}
                                    options={normalizeOptions(finalInvoiceDues)}
                                    buttonClassName="w-full h-[40px] bg-white text-black font-bold border border-gray-300 rounded-md px-4 text-xs text-left flex items-center justify-between cursor-pointer focus:outline-none focus:border-yellow-400"
                                />
                            </div>

                            {/* Reset Button */}
                            <div>
                                <button
                                    onClick={handleReset}
                                    className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white font-black h-[40px] px-6 md:px-8 rounded-md text-xs uppercase tracking-widest transition-all shadow-md active:scale-95"
                                >
                                    RESET
                                </button>
                            </div>
                        </div>

                        {/* Table Section */}
                        {error ? (
                            <div className="bg-red-50 border border-red-100 text-red-600 p-4 md:p-8 rounded-md text-center">
                                <p className="font-black text-xs uppercase mb-2">Error Loading Attachments</p>
                                <p className="text-xs">{error.message}</p>
                                <button
                                    onClick={() => mutate()}
                                    className="mt-6 px-10 py-3 bg-red-600 text-white rounded-md font-black text-xs uppercase tracking-widest shadow-md active:scale-95"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : isLoading ? (
                            <div className="bg-white p-16 flex flex-col items-center justify-center border border-[#ebebeb] rounded-md shadow-sm">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400 mb-4"></div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading...</span>
                            </div>
                        ) : attachments.length > 0 ? (
                            <>
                                {/* Desktop Table */}
                                <div className="hidden md:block overflow-x-auto w-full border border-[#ebebeb] rounded-md shadow-sm">
                                    <table className="w-full text-left border-collapse bg-white">
                                        <thead className="bg-gray-50 border-b border-[#ebebeb]">
                                            <tr className="h-[50px]">
                                                <th className="px-6 py-3 font-black text-xs text-black uppercase tracking-wider text-center"># Order</th>
                                                <th className="px-6 py-3 font-black text-xs text-black uppercase tracking-wider">File Name</th>
                                                <th className="px-6 py-3 font-black text-xs text-black uppercase tracking-wider text-center">Document Type</th>
                                                <th className="px-6 py-3 font-black text-xs text-black uppercase tracking-wider">Created On</th>
                                                <th className="px-6 py-3 font-black text-xs text-black uppercase tracking-wider">Invoice Due</th>
                                                <th className="px-6 py-3 font-black text-xs text-black uppercase tracking-wider">Payment</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attachments.map((attachment: any, idx: number) => {
                                                const attId = attachment.id || attachment.attachment_id || String(idx);
                                                const isOpening = openingFileId === String(attId);
                                                const orderDisplay = attachment.order_increment_id || attachment.order_id || "-";
                                                const fileName = attachment.file_name || attachment.label || "Download File";
                                                const docTypeLabel = getDocTypeLabel(fileName, attachment.comment || attachment.document_type || attachment.attachment_type);
                                                const createdAt = formatDate(attachment.created_at || attachment.upload_date);
                                                const invoiceDueVal = attachment.invoice_due ? formatDate(attachment.invoice_due) : "";
                                                const paymentStatus = attachment.payment || attachment.payment_status || "";

                                                return (
                                                    <tr key={attId} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-[#ebebeb] hover:bg-yellow-50/30 transition-colors text-xs`}>
                                                        <td className="px-6 py-4 text-center font-black">
                                                            <button onClick={() => handleViewOrder(attachment.order_id)} className="text-black hover:text-yellow-600 hover:underline transition-all cursor-pointer focus:outline-none">{orderDisplay}</button>
                                                        </td>
                                                        <td className="px-6 py-4 text-left font-medium">
                                                            <div className="flex items-center gap-3">
                                                                <button onClick={() => { const useUrl = attachment.file_url || attachment.file_path; handleViewFile({ ...attachment, file_url: useUrl, attachment_id: attId }); }} disabled={isOpening} className={`text-black hover:underline inline-block break-all text-left focus:outline-none font-bold ${isOpening ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>{fileName}</button>
                                                                {isOpening && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-400"></div>}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center font-bold text-gray-600 uppercase">{docTypeLabel}</td>
                                                        <td className="px-6 py-4 text-left font-bold text-gray-500">{createdAt}</td>
                                                        <td className="px-6 py-4 text-left font-bold text-gray-500">{invoiceDueVal}</td>
                                                        <td className="px-6 py-4 text-left">
                                                            <span className={`px-2 py-1 rounded-md font-black uppercase text-[10px] ${paymentStatus.toLowerCase().includes('paid') ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{paymentStatus || "-"}</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card List */}
                                <div className="md:hidden space-y-3">
                                    {attachments.map((attachment: any, idx: number) => {
                                        const attId = attachment.id || attachment.attachment_id || String(idx);
                                        const isOpening = openingFileId === String(attId);
                                        const orderDisplay = attachment.order_increment_id || attachment.order_id || "-";
                                        const fileName = attachment.file_name || attachment.label || "Download File";
                                        const docTypeLabel = getDocTypeLabel(fileName, attachment.comment || attachment.document_type || attachment.attachment_type);
                                        const createdAt = formatDate(attachment.created_at || attachment.upload_date);
                                        const invoiceDueVal = attachment.invoice_due ? formatDate(attachment.invoice_due) : "";
                                        const paymentStatus = attachment.payment || attachment.payment_status || "";

                                        return (
                                            <div key={attId} className="bg-white border border-[#ebebeb] rounded-md p-4 shadow-sm">
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div className="min-w-0 flex-1">
                                                        <button
                                                            onClick={() => { const useUrl = attachment.file_url || attachment.file_path; handleViewFile({ ...attachment, file_url: useUrl, attachment_id: attId }); }}
                                                            disabled={isOpening}
                                                            className={`text-[13px] font-bold text-black hover:text-yellow-600 text-left break-all ${isOpening ? 'opacity-50' : ''}`}
                                                        >
                                                            {fileName}
                                                            {isOpening && <span className="inline-block ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-400 align-middle"></span>}
                                                        </button>
                                                        <p className="text-[11px] text-gray-500 font-medium mt-1">{docTypeLabel}</p>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-md font-black uppercase text-[10px] flex-shrink-0 ${paymentStatus.toLowerCase().includes('paid') ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {paymentStatus || "-"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium border-t border-gray-100 pt-2.5">
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-black text-black">Order:</span>
                                                        <button onClick={() => handleViewOrder(attachment.order_id)} className="text-black hover:text-yellow-600 font-bold">{orderDisplay}</button>
                                                    </div>
                                                    <span>{createdAt}</span>
                                                    {invoiceDueVal && <span>Due: {invoiceDueVal}</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Pagination */}
                                {totalItems > 0 && (
                                    <div className="mt-8 flex justify-center">
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            totalItems={totalItems}
                                            pageSize={pageSize}
                                            onPageChange={handlePageChange}
                                            onPageSizeChange={handlePageSizeChange}
                                        />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="border border-[#ebebeb] p-8 md:p-24 text-center rounded-md bg-white shadow-sm">
                                <p className="text-gray-400 italic text-xs uppercase tracking-widest">No order attachments found.</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>

        </>
    );
}
