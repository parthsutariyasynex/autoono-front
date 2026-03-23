"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function MyStatementPage() {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();

    const [startDate, setStartDate] = useState("2026-01-01"); // Start of year
    const [endDate, setEndDate] = useState("2026-03-18");     // Today
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
    }, [authStatus, session, statementType]);

    // Auth Guard
    if (authStatus === "unauthenticated") {
        router.replace("/login");
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
                    window.open(data.pdf_url, "_blank");
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
            <Navbar />

            <div className="flex max-w-[1440px] mx-auto mt-[100px]">
                {/* Left Sidebar */}
                <Sidebar />

                {/* Right Content */}
                <main className="flex-1 p-8 bg-[#fcfcfc] min-h-screen">
                    <h1 className="text-[24px] font-black text-black tracking-tight uppercase mb-8">
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
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
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
                            <div className="mb-10">
                                <label className="block text-[13px] font-bold text-gray-800 mb-2">
                                    Statement Type
                                </label>
                                <select
                                    value={statementType}
                                    onChange={(e) => setStatementType(e.target.value)}
                                    className="w-full h-[45px] px-4 border border-gray-300 text-[14px] text-gray-700 focus:outline-none focus:border-[#f5a623] transition-colors appearance-none bg-white font-medium shadow-sm"
                                >
                                    {statementTypes.length > 0 ? (
                                        statementTypes.map((t) => (
                                            <option key={t.value} value={t.value}>
                                                {t.label}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="" disabled>Loading statement types...</option>
                                    )}
                                </select>
                            </div>

                            {/* Download Button */}
                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={handleGetStatement}
                                    disabled={isDownloading}
                                    className={`bg-[#f5a623] text-black px-10 py-3.5 font-bold text-[14px] uppercase tracking-widest hover:bg-[#e6950f] transition-all shadow-md flex items-center justify-center gap-3 active:scale-[0.98] ${isDownloading ? 'opacity-70 cursor-not-allowed grayscale' : ''}`}
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
