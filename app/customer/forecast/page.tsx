"use client";
import { useTranslation } from "@/hooks/useTranslation";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { fetchCustomerInfo } from "@/store/actions/customerActions";
import Sidebar from "@/components/Sidebar";
import { useSession } from "next-auth/react";
import { redirectToLogin } from "@/utils/helpers";
import PortalDropdown from "@/components/PortalDropdown";

/**
 * Proper data structures for the Forecast API
 */
interface ForecastFile {
    forecast_id?: string | number;
    file_name?: string;
    filename?: string;
    name?: string;
    file_url?: string;
    uploaded_date?: string;
    created_at?: string;
    updated_at?: string;
    uploaded_at?: string;
    date?: string;
    entity_id?: string | number;
    file_id?: string | number;
    id?: string | number;
}

interface ForecastResponse {
    items: ForecastFile[];
    total_count: number;
    page_size: number;
    current_page: number;
    total_pages: number;
}

export default function MyForecastPage() {
    const router = useRouter();
    const { t, isRtl } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const { data: session, status } = useSession();
    const { data: customer, loading } = useSelector((state: RootState) => state.customer);
    const token = useSelector((state: RootState) => state.auth.token);

    const [isSubAccountSession, setIsSubAccountSession] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [forecasts, setForecasts] = useState<ForecastFile[]>([]);
    const [loadingForecasts, setLoadingForecasts] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setIsSubAccountSession(localStorage.getItem("isSubAccount") === "true");
        }
    }, []);

    useEffect(() => {
        if (status === "unauthenticated") {
            redirectToLogin(router);
            return;
        }

        if (status === "authenticated" && token) {
            dispatch(fetchCustomerInfo());
            pullForecasts(currentPage, pageSize);
        }
    }, [status, token, dispatch, router, currentPage, pageSize]);

    /**
     * Proper data fetching from the proxy API
     */
    const [downloadingId, setDownloadingId] = useState<string | number | null>(null);

    const pullForecasts = async (page: number, size: number) => {
        try {
            setLoadingForecasts(true);
            const response = await fetch(`/api/kleverapi/forecast?pageSize=${size}&currentPage=${page}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data: ForecastResponse = await response.json();

                // Set the items, handling both direct array responses or collection objects
                const items = data.items || (Array.isArray(data) ? data : []);
                const total = data.total_count || items.length;

                setForecasts(items);
                setTotalItems(total);
            }
        } catch (err) {
            console.error("[Forecast List Error]:", err);
        } finally {
            setLoadingForecasts(false);
        }
    };

    /**
     * File download handler
     */
    const handleDownload = async (file: ForecastFile) => {
        const id = file.forecast_id || file.entity_id || file.id || file.file_id;
        const name = file.file_name || "forecast_file";
        const fileUrl = file.file_url;

        if (!id) {
            console.warn("[Forecast] Missing ID in file object:", file);
            alert(t("forecast.missingId"));
            return;
        }

        try {
            setDownloadingId(id);
            let proxyUrl = `/api/kleverapi/forecast/file/${id}?file_name=${encodeURIComponent(name)}`;

            if (fileUrl) {
                proxyUrl += `&url=${encodeURIComponent(fileUrl)}`;
            }

            const response = await fetch(proxyUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || t("forecast.downloadFailed"));
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = name;
            document.body.appendChild(a);
            a.click();

            // Cleanup
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error("[Forecast Download Error]:", err);
            alert(err.message || t("forecast.downloadError"));
        } finally {
            setDownloadingId(null);
        }
    };

    /**
     * File upload handler
     */
    const handleUpload = async () => {
        if (!selectedFile) {
            alert(t("forecast.selectFile"));
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await fetch('/api/kleverapi/forecast', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                alert(t("forecast.uploadSuccess"));
                setSelectedFile(null);
                pullForecasts(currentPage, pageSize);
            } else {
                alert(t("forecast.uploadFailed"));
            }
        } catch (err) {
            console.error("[Forecast Upload Error]:", err);
            alert(t("forecast.uploadError"));
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    /**
     * Finds and formats the 'proper' date from the API object.
     * Converts "2026-03-24 13:14:49" to "March 24, 2026"
     */
    const getProperDate = (file: any) => {
        const rawDate = file.uploaded_date || file.created_at || file.uploaded_at ||
            file.date || file.upload_date || file.updated_at ||
            file.creation_time || file.createdDate;

        const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };

        if (rawDate) {
            try {
                const parsedDate = new Date(rawDate.replace(' ', 'T')); // Handle space between date and time
                if (!isNaN(parsedDate.getTime())) {
                    return parsedDate.toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', options);
                }
                return rawDate; // Fallback to raw if parsing fails but exists
            } catch (e) {
                return rawDate;
            }
        }

        // Final fallback to today
        return new Date().toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', options);
    };

    if (loading || loadingForecasts) {
        return (
            <div className="min-h-screen bg-white">
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f5b21a]"></div>
                </div>
            </div>
        );
    }

    if (!customer) return null;

    return (
        <div className="flex flex-col lg:flex-row min-h-screen">
            <Sidebar />

            <main dir={isRtl ? "rtl" : "ltr"} className="flex-1 p-4 md:p-8 bg-[#f9f9f9] min-h-screen">
                {/* Header with Refresh */}
                <div className="flex justify-between items-center mb-6 md:mb-8">
                    <h1 className="text-[18px] md:text-[22px] font-black text-black uppercase tracking-tight">
                        {t("forecast.title")}
                    </h1>
                    <button
                        onClick={() => pullForecasts(currentPage, pageSize)}
                        className="bg-white border border-gray-300 text-[11px] md:text-[12px] font-black px-3 md:px-4 py-1.5 uppercase hover:bg-gray-100 transition-all shadow-sm flex items-center gap-2"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                        {t("forecast.refresh")}
                    </button>
                </div>

                {/* Section: Upload */}
                <h2 className="text-[13px] md:text-[15px] font-black text-black mb-3 md:mb-4 uppercase tracking-tighter">
                    {t("forecast.uploadForecast")}
                </h2>

                <div className="bg-white border border-gray-200 rounded-sm mb-8 md:mb-12 shadow-sm overflow-hidden">
                    <div className="p-4 md:p-8">
                        <div className="border-2 border-dashed border-gray-300 rounded-sm bg-[#eeeeee] px-4 md:px-6 py-6 md:py-8 flex flex-col items-center gap-4 md:gap-6">
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                <span className="text-[13px] md:text-[14px] font-medium text-black">{t("forecast.dropFiles")}</span>
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    accept=".jpg,.jpeg,.png,.zip,.rar,.docx,.doc,.pdf,.xls,.xlsx,.csv,.msg"
                                    onChange={handleFileChange}
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="bg-[#f0f0f0] border border-gray-400 px-4 py-1.5 text-[12px] md:text-[13px] font-medium text-black cursor-pointer hover:bg-gray-200 transition-colors rounded-[2px]"
                                >
                                    {t("forecast.chooseFile")}
                                </label>
                            </div>
                            {selectedFile && (
                                <span className="text-[12px] md:text-[13px] text-gray-800 font-medium truncate max-w-full">
                                    {selectedFile.name}
                                </span>
                            )}
                            <div className="text-center">
                                <span className="text-[11px] md:text-[14px] font-medium text-gray-600 leading-relaxed">
                                    {t("forecast.allowedFiles")}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white px-4 md:px-8 pb-4 md:pb-8 flex justify-center md:justify-end">
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="w-full sm:w-auto bg-[#f4b400] text-black text-[12px] md:text-[13px] font-black px-8 md:px-12 py-2.5 md:py-2.5 uppercase tracking-wider hover:bg-black hover:text-white transition-all shadow-sm disabled:opacity-50"
                        >
                            {uploading ? t("forecast.uploading") : t("forecast.submit")}
                        </button>
                    </div>
                </div>

                {/* Desktop Table Header */}
                <div className="hidden sm:grid grid-cols-2 bg-[#fcfcfc] border border-gray-100 py-3 md:py-4 mb-2">
                    <span className="text-[12px] md:text-[13px] font-black text-black px-4 md:px-6">{t("forecast.fileName")}</span>
                    <span className="text-[12px] md:text-[13px] font-black text-black text-center border-l border-gray-100">{t("forecast.uploadedDate")}</span>
                </div>

                {/* Mobile Header */}
                <div className="sm:hidden bg-[#fcfcfc] border border-gray-100 py-3 mb-2 px-4">
                    <span className="text-[12px] font-black text-black">{t("forecast.files")}</span>
                </div>

                {/* Files List */}
                <div className="bg-white border border-gray-100 border-t-0 rounded-sm overflow-hidden">
                    {forecasts.length > 0 ? forecasts.map((file, idx) => {
                        const fileId = file.forecast_id || file.entity_id || file.id || file.file_id;
                        return (
                            <div key={fileId || idx} className="border-b border-gray-50 hover:bg-[#fff7e6] transition-colors group">
                                {/* Mobile layout */}
                                <div className="sm:hidden px-4 py-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <button
                                            onClick={() => handleDownload(file)}
                                            disabled={downloadingId !== null && downloadingId === fileId}
                                            className="text-[13px] text-gray-700 font-medium group-hover:text-[#f4b400] hover:underline ltr:text-left rtl:text-right disabled:opacity-50 break-all"
                                        >
                                            {file.file_name || file.filename || file.name || t("forecast.noName")}
                                        </button>
                                        {downloadingId !== null && downloadingId === fileId && (
                                            <div className="animate-spin h-3 w-3 border-b-2 border-[#f4b400] rounded-full flex-shrink-0 mt-1"></div>
                                        )}
                                    </div>
                                    <span className="text-[11px] text-gray-400 font-medium mt-1 block">
                                        {getProperDate(file)}
                                    </span>
                                </div>
                                {/* Desktop layout */}
                                <div className="hidden sm:grid grid-cols-2 py-3 md:py-4">
                                    <div className="flex items-center gap-3 px-4 md:px-6">
                                        <button
                                            onClick={() => handleDownload(file)}
                                            disabled={downloadingId !== null && downloadingId === fileId}
                                            className="text-[13px] text-gray-700 font-medium group-hover:text-[#f4b400] hover:underline ltr:text-left rtl:text-right disabled:opacity-50"
                                        >
                                            {file.file_name || file.filename || file.name || t("forecast.noName")}
                                        </button>
                                        {downloadingId !== null && downloadingId === fileId && (
                                            <div className="animate-spin h-3 w-3 border-b-2 border-[#f4b400] rounded-full"></div>
                                        )}
                                    </div>
                                    <span className="text-[13px] text-gray-700 font-medium text-center border-l border-gray-50">
                                        {getProperDate(file)}
                                    </span>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="py-16 md:py-20 text-center text-gray-400 text-[13px] md:text-[14px] bg-white">
                            {t("forecast.noRecords")}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div className="bg-[#f2f2f2] mt-6 md:mt-10 py-3 md:py-3.5 px-3 md:px-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-[#555] rounded-sm">
                    <div className="flex items-center gap-4 sm:gap-6">
                        <span className="text-[11px] md:text-[12px] font-medium">{totalItems} {t("forecast.items")}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] md:text-[12px] font-medium">{t("forecast.show")}</span>
                            <PortalDropdown
                                value={String(pageSize)}
                                onChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }}
                                options={[{ label: "10", value: "10" }, { label: "20", value: "20" }, { label: "50", value: "50" }]}
                                minWidth={55}
                            />
                            <span className="text-[11px] md:text-[12px] font-medium">{t("forecast.perPage")}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-3 sm:px-4 py-1.5 bg-white border border-gray-300 text-[11px] md:text-[12px] font-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all rounded-sm shadow-sm"
                        >
                            {t("forecast.prev")}
                        </button>
                        <span className="text-[11px] md:text-[12px] font-black text-black text-center uppercase tracking-tight">
                            {t("forecast.page")} {currentPage}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            disabled={forecasts.length < pageSize}
                            className="px-3 sm:px-4 py-1.5 bg-white border border-gray-300 text-[11px] md:text-[12px] font-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all rounded-sm shadow-sm"
                        >
                            {t("forecast.next")}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
