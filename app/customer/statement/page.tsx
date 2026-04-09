"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import PortalDropdown from "@/components/PortalDropdown";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { redirectToLogin } from "@/utils/helpers";
import { useTranslation } from "@/hooks/useTranslation";

export default function MyStatementPage() {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();
    const { t } = useTranslation();

    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();
    const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
    const [endDate, setEndDate] = useState(today);
    const [statementType, setStatementType] = useState("account_statement");
    const [statementTypes, setStatementTypes] = useState<{ value: string; label: string }[]>([]);

    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch Statement Types
    React.useEffect(() => {
        const fetchTypes = async () => {
            const token = (session as any)?.accessToken;
            if (!token) return;

            try {
                const res = await fetch("/api/kleverapi/my-statement/types", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();

                    // Standardize response structure: handle [ {k:v}, ... ] or { types: [...] }
                    const rawTypes = Array.isArray(data) ? data : (data.types || []);
                    const mapped = rawTypes.map((t: any) => ({
                        value: t.value || t.code || t.id || t,
                        label: t.label || t.name || t.type_name || t.value || t
                    }));

                    if (mapped.length > 0) {
                        setStatementTypes(mapped);
                        // Optional: select first by default if not already set or current is invalid
                        if (!mapped.find((m: { value: string; label: string }) => m.value === statementType)) {
                            setStatementType(mapped[0].value);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch statement types:", err);
            }
        };

        if (authStatus === "authenticated") {
            fetchTypes();
        }
    }, [authStatus, session]);

    // Auth Guard
    if (authStatus === "unauthenticated") {
        redirectToLogin(router);
        return null;
    }

    if (authStatus === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f5a623]"></div>
            </div>
        );
    }

    const handleGetStatement = async () => {
        const token = (session as any)?.accessToken;
        if (!token) {
            toast.error("You must be logged in to download statements.");
            return;
        }

        setIsDownloading(true);
        setError(null);
        // toast.loading("Download Started...", { id: "statement-download" });

        try {
            const queryParams = new URLSearchParams({
                fromDate: startDate,
                toDate: endDate,
                type: statementType,
            });

            const response = await fetch(`/api/kleverapi/my-statement?${queryParams.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({ message: "Failed to download statement" }));
                throw new Error(data.message || "Something went wrong. Please try again.");
            }

            const contentType = response.headers.get("content-type");

            if (contentType && contentType.includes("application/pdf")) {
                const blob = await response.blob();

                // --- Proper Download Solve ---
                const fileUrl = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.style.display = "none";
                a.href = fileUrl;
                a.download = `Statement_${startDate}_to_${endDate}.pdf`;

                document.body.appendChild(a);
                a.click();

                // Cleanup
                setTimeout(() => {
                    window.URL.revokeObjectURL(fileUrl);
                    document.body.removeChild(a);
                }, 100);

                toast.success("Statement Downloaded Successfully!", { id: "statement-download" });
            } else {
                // Handle JSON fallback (if backend didn't follow the URL)
                const data = await response.json();
                if (data.pdf_url) {
                    const link = document.createElement("a");
                    link.href = data.pdf_url;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success("Download link opened in new tab.", { id: "statement-download" });
                } else {
                    throw new Error("Invalid response format received from server.");
                }
            }
        } catch (err: any) {
            setError(err.message || "Failed to fetch statement");
            toast.error(err.message || "Download failed", { id: "statement-download" });
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">


            <div className="flex flex-col lg:flex-row flex-1 min-h-0 w-full">
                {/* Left Sidebar */}
                <Sidebar />

                {/* Right Content */}
                <main className="flex-1 p-4 md:p-6 lg:p-8 bg-[#fcfcfc] min-h-0">
                    <h1 className="text-[18px] sm:text-[20px] md:text-[24px] font-black text-black tracking-tight uppercase mb-4 md:mb-8">
                        MY STATEMENT
                    </h1>

                    <div className="max-w-[700px] bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                        {/* Card Header */}
                        <div className="bg-[#f8f8f8] px-6 py-3 border-b border-gray-200">
                            <h2 className="text-[14px] font-bold text-black uppercase tracking-wide">
                                GET YOUR STATEMENT
                            </h2>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 md:p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-4 md:mb-8">
                                {/* Start Date */}
                                <div>
                                    <label className="block text-[13px] font-bold text-gray-800 mb-2">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full h-[45px] px-4 border border-gray-300 text-[14px] text-gray-700 focus:outline-none focus:border-[#f5a623] transition-colors"
                                    />
                                </div>

                                {/* End Date */}
                                <div>
                                    <label className="block text-[13px] font-bold text-gray-800 mb-2">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full h-[45px] px-4 border border-gray-300 text-[14px] text-gray-700 focus:outline-none focus:border-[#f5a623] transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Statement Type */}
                            <div className="mb-6 md:mb-10">
                                <label className="block text-[13px] font-bold text-gray-800 mb-2">
                                    Statement Type
                                </label>
                                <PortalDropdown
                                    value={statementType}
                                    onChange={(val) => setStatementType(val)}
                                    options={statementTypes}
                                    placeholder={statementTypes.length > 0 ? "Select" : "Loading statement types..."}
                                    buttonClassName="w-full h-[45px] px-4 border border-gray-300 text-[14px] text-gray-700 focus:outline-none focus:border-[#f5a623] transition-colors bg-white font-medium shadow-sm flex items-center justify-between cursor-pointer"
                                />
                            </div>

                            {/* Download Button */}
                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={handleGetStatement}
                                    disabled={isDownloading}
                                    className={`w-full sm:w-auto bg-[#f5a623] text-black px-6 sm:px-10 py-3 md:py-3.5 font-bold text-[14px] uppercase tracking-widest hover:bg-[#e6950f] transition-all shadow-md flex items-center justify-center gap-3 active:scale-[0.98] ${isDownloading ? 'opacity-70 cursor-not-allowed grayscale' : ''}`}
                                >
                                    {isDownloading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                                            Downloading...
                                        </>
                                    ) : (
                                        "Get Statement"
                                    )}
                                </button>

                                {error && (
                                    <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                                        <p className="text-[13px] font-bold mb-1">Download Error</p>
                                        <p className="text-[12px]">{error}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
