"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { fetchCustomerInfo } from "@/store/actions/customerActions";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { useSession } from "next-auth/react";
import { Upload, FileText, ChevronDown } from "lucide-react";

export default function MyForecastPage() {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { data: session, status } = useSession();
    const { data: customer, loading } = useSelector((state: RootState) => state.customer);
    const token = useSelector((state: RootState) => state.auth.token);

    const [isSubAccountSession, setIsSubAccountSession] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [forecasts, setForecasts] = useState<any[]>([]);
    const [loadingForecasts, setLoadingForecasts] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setIsSubAccountSession(localStorage.getItem("isSubAccount") === "true");
        }
    }, []);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/login");
            return;
        }

        if (status === "authenticated" && token) {
            dispatch(fetchCustomerInfo());
            pullForecasts();
        }
    }, [status, token, dispatch, router]);

    const pullForecasts = async () => {
        try {
            setLoadingForecasts(true);
            const response = await fetch('/api/kleverapi/forecast', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setForecasts(data);
            }
        } catch (err) {
            console.error("Fetch forecasts error:", err);
        } finally {
            setLoadingForecasts(false);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            alert("Please select a file first");
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
                alert("Forecast uploaded successfully!");
                setSelectedFile(null);
                pullForecasts(); // Refresh list
            } else {
                alert("Upload failed.");
            }
        } catch (err) {
            console.error("Upload error:", err);
            alert("An error occurred during upload.");
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    if (loading || loadingForecasts) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f5b21a]"></div>
                </div>
            </div>
        );
    }

    if (!customer) return null;

    return (
        <div className="min-h-screen bg-white font-['Rubik',sans-serif]">
            <Navbar />

            <div className="flex flex-col md:flex-row min-h-screen">
                <Sidebar />

                <main className="flex-1 p-8 bg-white max-w-[1240px]">
                    {/* Header */}
                    <h1 className="text-[20px] font-black text-black mb-8 uppercase tracking-tight">
                        MY FORECAST
                    </h1>

                    {/* Section Label */}
                    <h2 className="text-[14px] font-black text-black mb-4 uppercase tracking-tighter">
                        UPLOAD FORECAST
                    </h2>

                    {/* Upload Container */}
                    <div className="border border-gray-100 rounded-sm mb-12 shadow-sm overflow-hidden bg-[#fafafa]">
                        <div className="p-10">
                            <div className="border-2 border-dashed border-gray-300 rounded-md bg-transparent px-10 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <span className="text-[15px] font-medium text-gray-800">Drop files here</span>
                                    <label className="bg-white border border-gray-300 px-4 py-1 text-[13px] font-medium text-black cursor-pointer hover:bg-gray-50 transition-colors">
                                        Choose File
                                        <input type="file" className="hidden" onChange={handleFileChange} />
                                    </label>
                                    <span className="text-[13px] text-gray-500 italic">
                                        {selectedFile ? selectedFile.name : "No file chosen"}
                                    </span>
                                </div>
                                <div className="text-right max-w-[400px]">
                                    <span className="text-[11px] font-black text-gray-500 uppercase leading-relaxed text-wrap">
                                        Allowed file types : jpg,jpeg,png,zip,rar,docx,doc,pdf,xls,xlsx,csv,msg
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Submit Row */}
                        <div className="bg-white px-10 pb-10 flex justify-end">
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="bg-[#f5b21a] text-black text-[13px] font-black px-12 py-2.5 uppercase tracking-wider hover:bg-black hover:text-white transition-all shadow-sm disabled:opacity-50"
                            >
                                {uploading ? "UPLOADING..." : "SUBMIT"}
                            </button>
                        </div>
                    </div>

                    {/* Table Header Row */}
                    <div className="grid grid-cols-2 bg-[#fcfcfc] border-b border-gray-200 py-4 px-6 mb-2">
                        <span className="text-[13px] font-black text-black">File Name</span>
                        <span className="text-[13px] font-black text-black text-right">Uploaded Date</span>
                    </div>

                    {/* Files List */}
                    <div className="space-y-0.5">
                        {forecasts.map((file: any, idx: number) => (
                            <div key={idx} className="grid grid-cols-2 border-b border-gray-50 py-4 px-6 hover:bg-gray-50 transition-colors group">
                                <span className="text-[13px] text-gray-700 font-medium group-hover:text-black">{file.name}</span>
                                <span className="text-[13px] text-gray-700 font-medium text-right">{file.date}</span>
                            </div>
                        ))}
                    </div>

                    {/* Pagination / Info Row */}
                    <div className="bg-[#f2f2f2] mt-10 py-3.5 px-6 flex justify-between items-center text-[#555]">
                        <span className="text-[12px] font-medium">{forecasts.length} Item(s)</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[12px] font-medium">Show</span>
                            <div className="relative inline-block">
                                <select className="bg-white border border-gray-300 rounded-sm pl-3 pr-8 py-1.5 text-[12px] font-medium appearance-none outline-none cursor-pointer">
                                    <option>10</option>
                                    <option>20</option>
                                    <option>50</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                            <span className="text-[12px] font-medium">per page</span>
                        </div>
                    </div>
                </main>
            </div>

            {/* Footer and Style Tags */}
            <footer className="bg-black text-white py-14 mt-auto">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-center items-center gap-16 md:gap-32">
                    <div className="flex flex-col items-center gap-4 cursor-pointer group">
                        <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:bg-[#f5b21a] group-hover:border-[#f5b21a] transition-all duration-300">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                            </svg>
                        </div>
                        <span className="text-[14px] font-bold uppercase tracking-[1.5px] group-hover:text-[#f5b21a] transition-colors">
                            Send us an email
                        </span>
                    </div>
                    <div className="flex flex-col items-center gap-4 cursor-pointer group">
                        <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:bg-[#f5b21a] group-hover:border-[#f5b21a] transition-all duration-300">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
                            </svg>
                        </div>
                        <span className="text-[14px] font-bold uppercase tracking-[1.5px] group-hover:text-[#f5b21a] transition-colors">
                            Connect with Us
                        </span>
                    </div>
                </div>
            </footer>

        </div>
    );
}
