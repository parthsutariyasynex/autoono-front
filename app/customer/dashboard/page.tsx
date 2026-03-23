"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { fetchCustomerInfo } from "@/store/actions/customerActions";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { useSession } from "next-auth/react";

type CustomAttribute = {
    attribute_code: string;
    value: string;
};

export default function DashboardPage() {
    const router = useRouter();
    const pathname = usePathname();
    const dispatch = useDispatch<AppDispatch>();
    const { data: session, status } = useSession();
    const { data: customer, loading } = useSelector((state: RootState) => state.customer);
    const token = useSelector((state: RootState) => state.auth.token);

    const [isSubAccountSession, setIsSubAccountSession] = useState(false);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loadingDashboard, setLoadingDashboard] = useState(true);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setIsSubAccountSession(localStorage.getItem("isSubAccount") === "true");
        }
    }, [pathname]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/login");
            return;
        }

        if (status === "authenticated" && token) {
            dispatch(fetchCustomerInfo());
            pullDashboardData();
        }
    }, [status, token, dispatch, router]);

    const pullDashboardData = async () => {
        try {
            setLoadingDashboard(true);
            const response = await fetch('/api/kleverapi/dashboard', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Resolve 'Unexpected token <' error by checking if response is OK and is JSON
            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }

            const data = await response.json();
            setDashboardData(data);
        } catch (err) {
            console.error("Dashboard data fetch error:", err);
            // Set some dummy data if the API fails just to keep the UI proper
            setDashboardData(null);
        } finally {
            setLoadingDashboard(false);
        }
    };

    if (loading || loadingDashboard) {
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

    const getAttr = (code: string) => {
        return (customer as any).custom_attributes?.find(
            (a: CustomAttribute) => a.attribute_code === code
        )?.value || "N/A";
    }

    const qty = dashboardData?.total_order_qty || { year: '0', quarter: '0', months: '0' };
    const value = dashboardData?.total_order_value || { year: '0.00', quarter: '0.00', months: '0.00' };

    return (
        <div className="min-h-screen bg-white font-['Rubik',sans-serif]">
            <Navbar />

            <div className="flex flex-col md:flex-row min-h-screen">
                <Sidebar />

                {/* Right Content */}
                <main className="flex-1 p-8 bg-white max-w-[1200px]">

                    {/* Sub-account Identity Banner */}
                    {isSubAccountSession && (
                        <div className="bg-[#e7f6e7] border-l-4 border-[#2d8a2d] text-[#1b5e20] p-4 mb-8 flex items-center gap-3 animate-in fade-in slide-in-from-top duration-500 shadow-sm" role="alert">
                            <span className="text-[#2d8a2d] font-bold text-lg">✔</span>
                            <p className="text-[14px] font-medium tracking-tight">You are logged as subaccount now.</p>
                        </div>
                    )}

                    <h1 className="text-[20px] font-black text-black mb-6 uppercase tracking-tight font-['Rubik']">
                        DASHBOARD
                    </h1>

                    {/* Compare Section */}
                    <div className="bg-[#f2f2f2] p-6 mb-10 border border-gray-200">
                        <div className="flex items-center gap-3 mb-5">
                            <span className="text-[13px] font-black uppercase text-black">Compare?</span>
                            <input
                                type="checkbox"
                                className="w-4 h-4 accent-[#f5b21a] cursor-pointer"
                            />
                        </div>
                        <div className="flex items-center gap-6">
                            <select className="flex-1 bg-[#f5b21a] text-black font-bold h-10 px-4 text-[13px] outline-none cursor-pointer appearance-none">
                                <option>2026</option>
                                <option>2025</option>
                                <option>2024</option>
                            </select>
                            <span className="text-[12px] font-bold text-gray-500 lowercase italic">vs.</span>
                            <select className="flex-1 bg-[#f5b21a] text-black font-bold h-10 px-4 text-[13px] outline-none cursor-pointer appearance-none">
                                <option>2025</option>
                                <option>2026</option>
                                <option>2024</option>
                            </select>
                        </div>
                    </div>

                    {/* 1. Total Order Qty Section */}
                    <div className="mb-10">
                        <h2 className="text-[16px] font-black text-black mb-5 uppercase">Total Order Qty</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="border border-yellow-500/30 overflow-hidden shadow-sm">
                                <div className="bg-[#f5b21a] py-2 px-4 flex justify-between items-center text-black">
                                    <span className="text-[11px] font-black uppercase tracking-wide">Year - 2026</span>
                                    <span className="text-[10px]">▼</span>
                                </div>
                                <div className="bg-white py-4 px-4 text-center">
                                    <span className="text-[18px] font-bold text-black">{qty.year}</span>
                                </div>
                            </div>

                            <div className="border border-yellow-500/30 overflow-hidden shadow-sm">
                                <div className="bg-[#f5b21a] py-2 px-4 flex justify-between items-center text-black">
                                    <span className="text-[11px] font-black uppercase tracking-wide">Quarter</span>
                                    <span className="text-[10px]">▼</span>
                                </div>
                                <div className="bg-white py-4 px-4 text-center">
                                    <span className="text-[18px] font-bold text-black">{qty.quarter}</span>
                                </div>
                            </div>

                            <div className="border border-yellow-500/30 overflow-hidden shadow-sm">
                                <div className="bg-[#f5b21a] py-2 px-4 flex justify-between items-center text-black">
                                    <span className="text-[11px] font-black uppercase tracking-wide">Months</span>
                                    <span className="text-[10px]">▼</span>
                                </div>
                                <div className="bg-white py-4 px-4 text-center">
                                    <span className="text-[18px] font-bold text-black">{qty.months}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Total Order Value Section */}
                    <div className="mb-10">
                        <h2 className="text-[16px] font-black text-black mb-5 uppercase text-nowrap">Total Order Value</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="border border-yellow-500/30 overflow-hidden shadow-sm">
                                <div className="bg-[#f5b21a] py-2 px-4 flex justify-between items-center text-black">
                                    <span className="text-[11px] font-black uppercase tracking-wide">Year - 2026</span>
                                    <span className="text-[10px]">▼</span>
                                </div>
                                <div className="bg-white py-4 px-4 text-center">
                                    <span className="text-[16px] font-bold text-black">{value.year}</span>
                                </div>
                            </div>

                            <div className="border border-yellow-500/30 overflow-hidden shadow-sm">
                                <div className="bg-[#f5b21a] py-2 px-4 flex justify-between items-center text-black">
                                    <span className="text-[11px] font-black uppercase tracking-wide">Quarter</span>
                                    <span className="text-[10px]">▼</span>
                                </div>
                                <div className="bg-white py-4 px-4 text-center">
                                    <span className="text-[16px] font-bold text-black">{value.quarter}</span>
                                </div>
                            </div>

                            <div className="border border-yellow-500/30 overflow-hidden shadow-sm">
                                <div className="bg-[#f5b21a] py-2 px-4 flex justify-between items-center text-black">
                                    <span className="text-[11px] font-black uppercase tracking-wide">Months</span>
                                    <span className="text-[10px]">▼</span>
                                </div>
                                <div className="bg-white py-4 px-4 text-center">
                                    <span className="text-[16px] font-bold text-black">{value.months}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Dropdowns with Value Cards */}
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1">
                            <h3 className="text-[15px] font-black text-black mb-4 uppercase tracking-tight">Product Group</h3>
                            <div className="border border-yellow-500/30 overflow-hidden shadow-sm">
                                <div className="bg-[#f5b21a] py-1 px-4 flex justify-between items-center text-black">
                                    <select className="bg-transparent border-none text-[11px] font-black uppercase tracking-wide outline-none cursor-pointer appearance-none w-full py-1">
                                        {dashboardData?.product_groups?.map((pg: any) => (
                                            <option key={pg.name} value={pg.name}>{pg.name}</option>
                                        )) || <option>Cars</option>}
                                    </select>
                                    <span className="text-[10px] pointer-events-none ml-2">▼</span>
                                </div>
                                <div className="bg-white py-4 px-4 text-center">
                                    <span className="text-[18px] font-bold text-black">
                                        {dashboardData?.selected_product_group_value || "38"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1">
                            <h3 className="text-[15px] font-black text-black mb-4 uppercase tracking-tight">Tyre Size</h3>
                            <div className="border border-yellow-500/30 overflow-hidden shadow-sm">
                                <div className="bg-[#f5b21a] py-1 px-4 flex justify-between items-center text-black">
                                    <select className="bg-transparent border-none text-[11px] font-black uppercase tracking-wide outline-none cursor-pointer appearance-none w-full py-1">
                                        {dashboardData?.tyre_sizes?.map((ts: any) => (
                                            <option key={ts.name} value={ts.name}>{ts.name}</option>
                                        )) || <option>265/40 R21 Turanza T005</option>}
                                    </select>
                                    <span className="text-[10px] pointer-events-none ml-2">▼</span>
                                </div>
                                <div className="bg-white py-4 px-4 text-center">
                                    <span className="text-[18px] font-bold text-black">
                                        {dashboardData?.selected_tyre_size_value || "10"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Footer Section */}
            <footer className="bg-black text-white py-14 mt-auto border-t border-gray-800">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-center items-center gap-16 md:gap-32">
                    {/* Email Item */}
                    <div className="flex flex-col items-center gap-4 cursor-pointer group">
                        <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:bg-[#f5b21a] group-hover:border-[#f5b21a] transition-all duration-300">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                            </svg>
                        </div>
                        <span className="text-[14px] font-bold uppercase tracking-[1.5px] font-['Rubik'] group-hover:text-[#f5b21a] transition-colors">
                            Send us an email
                        </span>
                    </div>

                    {/* Connect Item */}
                    <div className="flex flex-col items-center gap-4 cursor-pointer group relative">
                        <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:bg-[#f5b21a] group-hover:border-[#f5b21a] transition-all duration-300">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
                            </svg>
                        </div>
                        <span className="text-[14px] font-bold uppercase tracking-[1.5px] font-['Rubik'] group-hover:text-[#f5b21a] transition-colors">
                            Connect with Us
                        </span>

                        {/* Back to top button as seen in image */}
                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="fixed bottom-8 right-8 w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#f5b21a] transition-all group/btn z-50 border border-gray-100"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-gray-800 group-hover/btn:text-white">
                                <path d="m18 15-6-6-6 6" />
                            </svg>
                        </button>
                    </div>
                </div>
            </footer>


        </div>
    );
}
