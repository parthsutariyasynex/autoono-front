"use client";
import { useTranslation } from "@/hooks/useTranslation";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { fetchCustomerInfo } from "@/store/actions/customerActions";
import Sidebar from "@/components/Sidebar";
import PortalDropdown from "@/components/PortalDropdown";
import { useSession } from "next-auth/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { redirectToLogin } from "@/utils/helpers";

type CustomAttribute = {
    attribute_code: string;
    value: string;
};

const MONTH_KEYS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_KEYS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const QUARTER_KEYS_EN = ['Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'];
const QUARTER_KEYS_AR = ['الربع الأول', 'الربع الثاني', 'الربع الثالث', 'الربع الرابع'];

export default function DashboardPage() {
    const router = useRouter();
    const { t, isRtl } = useTranslation();
    const pathname = usePathname();
    const dispatch = useDispatch<AppDispatch>();
    const { data: session, status } = useSession();
    const { data: customer, loading } = useSelector((state: RootState) => state.customer);
    const token = useSelector((state: RootState) => state.auth.token);

    const [isSubAccountSession, setIsSubAccountSession] = useState(false);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loadingDashboard, setLoadingDashboard] = useState(true);

    // Year selection state
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const [searchYear, setSearchYear] = useState<number>(currentYear);
    const [compareYear, setCompareYear] = useState<number>(currentYear - 1);
    const [isCompare, setIsCompare] = useState(false);

    // Selected items for display cards
    const [selectedProductGroup, setSelectedProductGroup] = useState("");
    const [selectedTyreSize, setSelectedTyreSize] = useState("");
    const [availableYears, setAvailableYears] = useState<number[]>([2026, 2025, 2024]);
    const [activeTab, setActiveTab] = useState<'quarterly' | 'monthly'>('quarterly');

    const monthNames = isRtl ? MONTH_KEYS_AR : MONTH_KEYS_EN;
    const quarterNames = isRtl ? QUARTER_KEYS_AR : QUARTER_KEYS_EN;

    useEffect(() => {
        if (typeof window !== "undefined") {
            setIsSubAccountSession(localStorage.getItem("isSubAccount") === "true");
        }
    }, [pathname]);

    useEffect(() => {
        if (status === "unauthenticated") {
            redirectToLogin(router);
            return;
        }

        if (status === "authenticated" && token) {
            dispatch(fetchCustomerInfo());
        }
    }, [status, token, dispatch, router]);

    // Fetch dashboard data whenever year or compare settings change
    useEffect(() => {
        if (status === "authenticated" && token) {
            fetchDashboard();
        }
    }, [status, token, searchYear, compareYear, isCompare]);

    // Proper financial formatter (comas + 2 decimal places)
    const formatValue = (val: any) => {
        const num = Number(val || 0);
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const fetchDashboard = async () => {
        try {
            setLoadingDashboard(true);

            const params = new URLSearchParams();
            params.append('searchYear', String(searchYear));
            if (isCompare) {
                params.append('compareYear', String(compareYear));
            }

            const response = await fetch(`/api/kleverapi/dashboard?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-locale': window.location.pathname.startsWith("/ar") ? "ar" : "en"
                }
            });

            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }

            const data = await response.json();
            if (data) {
                setDashboardData(data);
                if (data.available_years) setAvailableYears(data.available_years);

                // Dynamically set defaults from the API response using correct keys
                if (data.product_groups?.length > 0 && !selectedProductGroup) {
                    setSelectedProductGroup(data.product_groups[0].product_group);
                }
                if (data.tyre_sizes?.length > 0 && !selectedTyreSize) {
                    setSelectedTyreSize(data.tyre_sizes[0].size_pattern);
                }
            }
        } catch (err) {
            console.error("Dashboard data fetch error:", err);
            setDashboardData(null);
        } finally {
            setLoadingDashboard(false);
        }
    };

    if (loading || loadingDashboard) {
        return (
            <div className="min-h-screen bg-white">
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

    // Translate API data values using data.* keys
    const translateData = (val: string) => {
        if (!val) return val;
        const translated = t(`data.${val}`);
        return translated !== `data.${val}` ? translated : val;
    };

    return (
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
            <Sidebar />

            {/* Right Content Area */}
            <main className="flex-1 p-4 md:p-6 lg:p-8 bg-[#f9f9f9] min-h-0 font-['Rubik',sans-serif]" dir={isRtl ? "rtl" : "ltr"}>
                <div className="max-w-[1240px] mx-auto">

                    {/* Sub-account Identity Banner */}
                    {isSubAccountSession && (
                        <div className={`bg-[#e7f6e7] ${isRtl ? 'border-r-4' : 'border-l-4'} border-[#2d8a2d] text-[#1b5e20] p-3 md:p-4 mb-4 md:mb-8 ${isRtl ? 'rounded-l-md' : 'rounded-r-md'} flex items-center gap-3 animate-in fade-in slide-in-from-top duration-500 shadow-sm`} role="alert">
                            <span className="text-[#2d8a2d] font-bold text-lg">&#10004;</span>
                            <p className="text-[14px] font-medium tracking-tight">{t("dashboard.subAccountBanner")}</p>
                        </div>
                    )}

                    <h1 className="text-[18px] md:text-[22px] font-black text-black mb-8 uppercase tracking-tight ltr:text-left rtl:text-right">
                        {t("dashboard.title")}
                    </h1>

                    {/* COMPARE SECTION */}
                    <section className="bg-white border border-gray-200 rounded-sm shadow-sm mb-12 overflow-hidden">
                        {/* Header Section */}
                        <div className="bg-[#f8f8f8] p-3 md:p-4 px-4 md:px-8 border-b border-gray-200 flex items-center gap-6">
                            <span className="text-[13px] font-black uppercase text-black tracking-wider">{t("dashboard.compare")}</span>
                            <input
                                type="checkbox"
                                checked={isCompare}
                                onChange={(e) => {
                                    setIsCompare(e.target.checked);
                                    if (!e.target.checked) {
                                        setSearchYear(new Date().getFullYear());
                                    }
                                }}
                                className="w-[18px] h-[18px] accent-[#f4b400] cursor-pointer border-gray-300"
                            />
                        </div>

                        {/* Body Section */}
                        <div className="p-4 md:p-10 px-4 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
                            {/* First Selector */}
                            <div className="flex-1 w-full bg-[#f4b400] h-11 px-5 relative flex items-center shadow-sm rounded-sm group hover:brightness-105 transition-all">
                                <PortalDropdown
                                    value={searchYear}
                                    onChange={(val) => {
                                        setSearchYear(Number(val));
                                        setIsCompare(true);
                                    }}
                                    options={availableYears.map(y => ({ label: String(y), value: String(y) }))}
                                    buttonClassName="w-full h-full flex items-center justify-between gap-2 cursor-pointer bg-transparent outline-none ltr:text-left rtl:text-right font-black text-[12px] md:text-[14px] uppercase tracking-wide text-black"
                                    className="w-full h-full"
                                />
                            </div>

                            {/* Constant "vs." label */}
                            <span className="text-[12px] md:text-[14px] font-bold text-black px-4 lowercase italic">{isRtl ? "مقابل" : "vs."}</span>

                            {/* Second Selector */}
                            <div className="flex-1 w-full bg-[#f4b400] h-11 px-5 relative flex items-center shadow-sm rounded-sm group hover:brightness-105 transition-all">
                                <PortalDropdown
                                    value={compareYear}
                                    onChange={(val) => {
                                        setCompareYear(Number(val));
                                        setIsCompare(true);
                                    }}
                                    options={availableYears.map(y => ({ label: String(y), value: String(y) }))}
                                    buttonClassName="w-full h-full flex items-center justify-between gap-2 cursor-pointer bg-transparent outline-none ltr:text-left rtl:text-right font-black text-[12px] md:text-[14px] uppercase tracking-wide text-black"
                                    className="w-full h-full"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Summary Sections - Hide when comparing */}
                    {!isCompare && (
                        <>
                            {/* TOTAL ORDER QTY SECTION */}
                            <section className="mb-12">
                                <h2 className="text-[18px] font-black text-black mb-4 md:mb-6 uppercase tracking-tight border-b-2 border-[#f4b400] inline-block pb-1">{t("m.total-order-qty")}</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-4">
                                    <QtyCard
                                        label={`${t("dashboard.year")} - ${searchYear}`}
                                        value={dashboardData?.yearly_summary?.[0]?.qty || "0"}
                                        compareValue={isCompare ? (dashboardData?.compare_yearly?.[0]?.qty || "0") : undefined}
                                        isRtl={isRtl}
                                    />
                                    <QtyCard
                                        label={t("m.quarter")}
                                        value={dashboardData?.quarterly_summary?.[0]?.qty || "0"}
                                        compareValue={isCompare ? (dashboardData?.compare_quarterly?.find((q: any) => q.year === compareYear && q.period === (dashboardData?.quarterly_summary?.[0]?.period || 1))?.qty || "0") : undefined}
                                        isRtl={isRtl}
                                    />
                                    <QtyCard
                                        label={t("m.months")}
                                        value={dashboardData?.monthly_summary?.[0]?.qty || "0"}
                                        compareValue={isCompare ? (dashboardData?.compare_monthly?.find((m: any) => m.year === compareYear && m.period === (dashboardData?.monthly_summary?.[0]?.period || 1))?.qty || "0") : undefined}
                                        isRtl={isRtl}
                                    />
                                </div>
                            </section>

                            {/* TOTAL ORDER VALUE SECTION */}
                            <section className="mb-14">
                                <h2 className="text-[18px] font-black text-black mb-4 md:mb-6 uppercase tracking-tight border-b-2 border-[#f4b400] inline-block pb-1">{t("m.total-order-value")}</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-4">
                                    <ValueCard
                                        label={`${t("dashboard.year")} - ${searchYear}`}
                                        value={formatValue(dashboardData?.yearly_summary?.[0]?.amount)}
                                        compareValue={isCompare ? formatValue(dashboardData?.compare_yearly?.[0]?.amount) : undefined}
                                        isRtl={isRtl}
                                    />
                                    <ValueCard
                                        label={t("m.quarter")}
                                        value={formatValue(dashboardData?.quarterly_summary?.[0]?.amount)}
                                        compareValue={isCompare ? formatValue(dashboardData?.compare_quarterly?.find((q: any) => q.year === compareYear && q.period === (dashboardData?.quarterly_summary?.[0]?.period || 1))?.amount) : undefined}
                                        isRtl={isRtl}
                                    />
                                    <ValueCard
                                        label={t("m.months")}
                                        value={formatValue(dashboardData?.monthly_summary?.[0]?.amount)}
                                        compareValue={isCompare ? formatValue(dashboardData?.compare_monthly?.find((m: any) => m.year === compareYear && m.period === (dashboardData?.monthly_summary?.[0]?.period || 1))?.amount) : undefined}
                                        isRtl={isRtl}
                                    />
                                </div>
                            </section>
                        </>
                    )}

                    {/* BOTTOM FILTERS - Hide when comparing */}
                    {!isCompare && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 mt-12 mb-16 px-1">
                            {/* Product Group Filter */}
                            <div className="flex-1">
                                <h3 className="text-[13px] md:text-[15px] font-black text-black mb-3 md:mb-5 uppercase tracking-tight ltr:text-left rtl:text-right">{t("dashboard.productGroupLabel")}</h3>
                                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                    <div className="bg-[#f4b400] h-12 px-5 flex items-center text-black relative">
                                        <PortalDropdown
                                            value={selectedProductGroup}
                                            onChange={(val) => setSelectedProductGroup(val)}
                                            options={
                                                (!dashboardData?.product_groups || dashboardData.product_groups.length === 0)
                                                    ? [{ label: t("common.noDataFound"), value: "" }]
                                                    : dashboardData.product_groups.map((pg: any) => ({ label: translateData(pg.product_group), value: pg.product_group }))
                                            }
                                            placeholder={t("m.select")}
                                            buttonClassName="w-full h-full flex items-center justify-between gap-2 cursor-pointer bg-transparent outline-none ltr:text-left rtl:text-right font-black text-[12px] md:text-[14px] uppercase tracking-wide text-black"
                                            className="w-full h-full"
                                        />
                                    </div>
                                    <div className="py-6 px-4 text-center">
                                        <p className="text-[18px] md:text-[22px] font-bold text-black font-['Rubik']">
                                            {dashboardData?.product_groups?.find((pg: any) => pg.product_group === selectedProductGroup)?.qty || "-"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Tyre Size Filter */}
                            <div className="flex-1">
                                <h3 className="text-[13px] md:text-[15px] font-black text-black mb-3 md:mb-5 uppercase tracking-tight ltr:text-left rtl:text-right">{t("dashboard.tyreSizeLabel")}</h3>
                                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                    <div className="bg-[#f4b400] h-12 px-5 flex items-center text-black relative">
                                        <PortalDropdown
                                            value={selectedTyreSize}
                                            onChange={(val) => setSelectedTyreSize(val)}
                                            options={
                                                (!dashboardData?.tyre_sizes || dashboardData.tyre_sizes.length === 0)
                                                    ? [{ label: t("common.noDataFound"), value: "" }]
                                                    : dashboardData.tyre_sizes.map((ts: any) => ({ label: translateData(ts.size_pattern), value: ts.size_pattern }))
                                            }
                                            placeholder={t("m.select")}
                                            buttonClassName="w-full h-full flex items-center justify-between gap-2 cursor-pointer bg-transparent outline-none ltr:text-left rtl:text-right font-black text-[12px] md:text-[14px] uppercase tracking-wide text-black"
                                            className="w-full h-full"
                                        />
                                    </div>
                                    <div className="py-6 px-4 text-center">
                                        <p className="text-[18px] md:text-[22px] font-bold text-black font-['Rubik']">
                                            {dashboardData?.tyre_sizes?.find((ts: any) => ts.size_pattern === selectedTyreSize)?.qty || "-"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* COMPARISON DETAILS SECTION (Chart & Table) */}
                    {isCompare && (
                        <section className="bg-white border border-[#f4b400] rounded-sm shadow-sm p-0 mb-16 overflow-hidden animate-in fade-in slide-in-from-bottom duration-500">
                            <div className="p-4 md:p-8 pb-2 md:pb-4">
                                <h2 className="text-[16px] md:text-[20px] font-black text-black uppercase tracking-tight ltr:text-left rtl:text-right">
                                    {isRtl ? `مقارنة ${searchYear} مع ${compareYear}` : `COMPARE ${searchYear} WITH ${compareYear}`}
                                </h2>
                            </div>

                            {/* Tabs */}
                            <div className="flex px-1 mt-4">
                                <button
                                    onClick={() => setActiveTab('quarterly')}
                                    className={`px-4 md:px-8 py-2 md:py-3 text-[11px] md:text-[13px] font-black uppercase tracking-wide cursor-pointer transition-all ${isRtl ? 'border-l border-white' : 'border-r border-white'}
                                        ${activeTab === 'quarterly' ? 'bg-[#f4b400] text-black shadow-inner' : 'bg-[#e5e7eb] text-gray-600 hover:bg-[#d1d5db]'}`}
                                >
                                    {t("dashboard.quarterlySalesData")}
                                </button>
                                <button
                                    onClick={() => setActiveTab('monthly')}
                                    className={`px-4 md:px-8 py-2 md:py-3 text-[11px] md:text-[13px] font-black uppercase tracking-wide cursor-pointer transition-all
                                        ${activeTab === 'monthly' ? 'bg-[#f4b400] text-black shadow-inner' : 'bg-[#e5e7eb] text-gray-600 hover:bg-[#d1d5db]'}`}
                                >
                                    {t("dashboard.monthlySalesData")}
                                </button>
                            </div>

                            <div className="p-8 pt-10" dir="ltr">
                                {/* Chart Implementation - always LTR for proper rendering */}
                                <div className="h-[250px] md:h-[400px] w-full mb-12">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={activeTab === 'quarterly' ?
                                                [1, 2, 3, 4].map(q => ({
                                                    name: quarterNames[q - 1],
                                                    [searchYear]: dashboardData?.compare_quarterly?.find((d: any) => d.year === searchYear && d.period === q)?.qty || 0,
                                                    [compareYear]: dashboardData?.compare_quarterly?.find((d: any) => d.year === compareYear && d.period === q)?.qty || 0
                                                })) :
                                                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => ({
                                                    name: monthNames[m - 1],
                                                    [searchYear]: dashboardData?.compare_monthly?.find((d: any) => d.year === searchYear && d.period === m)?.qty || 0,
                                                    [compareYear]: dashboardData?.compare_monthly?.find((d: any) => d.year === compareYear && d.period === m)?.qty || 0
                                                }))
                                            }
                                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#666', fontSize: 12, fontWeight: 700 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#666', fontSize: 11 }}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #ddd', fontWeight: 700 }}
                                                cursor={{ fill: '#f8f8f8' }}
                                            />
                                            <Legend
                                                verticalAlign="top"
                                                align="center"
                                                iconType="rect"
                                                wrapperStyle={{ paddingBottom: '30px', fontSize: '13px', fontWeight: 900 }}
                                            />
                                            <Bar dataKey={searchYear} fill="#f4b400" radius={[2, 2, 0, 0]} barSize={40} name={searchYear.toString()} />
                                            <Bar dataKey={compareYear} fill="#000000" radius={[2, 2, 0, 0]} barSize={40} name={compareYear.toString()} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Data Table */}
                                <div className="overflow-x-auto border border-gray-100 rounded-sm" dir={isRtl ? "rtl" : "ltr"}>
                                    <table className="w-full text-center border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-100">
                                                <th className="bg-[#fff] py-3 md:py-4 px-3 md:px-6"></th>
                                                <th className="bg-[#fff] py-3 md:py-4 px-3 md:px-6 text-[12px] md:text-[15px] font-black text-black uppercase ltr:border-l rtl:border-r border-gray-100">{searchYear}</th>
                                                <th className="bg-[#fff] py-3 md:py-4 px-3 md:px-6 text-[12px] md:text-[15px] font-black text-black uppercase ltr:border-l rtl:border-r border-gray-100">{compareYear}</th>
                                            </tr>
                                            <tr className="bg-[#fff] border-b border-gray-100">
                                                <th className="py-3 md:py-4 px-3 md:px-6 text-[12px] font-black text-black uppercase tracking-wider">{activeTab === 'quarterly' ? t("dashboard.quarter") : t("dashboard.month")}</th>
                                                <th className="py-3 md:py-4 px-3 md:px-6 text-[12px] font-black text-black uppercase tracking-wider ltr:border-l rtl:border-r border-gray-100">{t("dashboard.qty")}</th>
                                                <th className="py-3 md:py-4 px-3 md:px-6 text-[12px] font-black text-black uppercase tracking-wider ltr:border-l rtl:border-r border-gray-100">{t("dashboard.qty")}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(activeTab === 'quarterly' ? [1, 2, 3, 4] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).map((p, idx) => {
                                                const val1 = (activeTab === 'quarterly' ? dashboardData?.compare_quarterly : dashboardData?.compare_monthly)
                                                    ?.find((d: any) => d.year === searchYear && d.period === p)?.qty || 0;
                                                const val2 = (activeTab === 'quarterly' ? dashboardData?.compare_quarterly : dashboardData?.compare_monthly)
                                                    ?.find((d: any) => d.year === compareYear && d.period === p)?.qty || 0;

                                                const label = activeTab === 'quarterly'
                                                    ? (isRtl ? `ر${p}` : `Q${p}`)
                                                    : (isRtl ? monthNames[p - 1] : p.toString());

                                                return (
                                                    <tr key={p} className={`${idx % 2 === 0 ? 'bg-[#f8f8f8]' : 'bg-[#fff]'} border-b border-gray-50 transition-colors hover:bg-[#fff7e6]`}>
                                                        <td className="py-3 md:py-4 px-3 md:px-6 font-bold text-gray-800 text-[12px] md:text-[14px]">{label}</td>
                                                        <td className="py-3 md:py-4 px-3 md:px-6 text-[12px] md:text-[14px] font-bold ltr:border-l rtl:border-r border-gray-100">{val1}</td>
                                                        <td className="py-3 md:py-4 px-3 md:px-6 text-[12px] md:text-[14px] font-bold ltr:border-l rtl:border-r border-gray-100">{val2}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}

/**
 * Reusable Card Components
 */
function QtyCard({ label, value, compareValue, isRtl }: { label: string; value: string; compareValue?: string; isRtl: boolean }) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-1">
            <div className="bg-[#f4b400] h-10 px-5 flex justify-between items-center text-black">
                <span className="text-[11px] font-black uppercase tracking-wider">{label}</span>
                <span className="text-[10px]">&#9660;</span>
            </div>
            <div className="py-6 px-4 text-center">
                <div className="flex flex-col items-center justify-center">
                    <p className="text-[26px] font-black text-black">{value}</p>
                    {compareValue !== undefined && (
                        <p className="text-[12px] font-bold text-gray-400 mt-1">
                            {isRtl ? "مقابل" : "vs."} <span className="text-gray-600">{compareValue}</span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function ValueCard({ label, value, compareValue, isRtl }: { label: string; value: string; compareValue?: string; isRtl: boolean }) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-1">
            <div className="bg-[#f4b400] h-10 px-5 flex justify-between items-center text-black">
                <span className="text-[11px] font-black uppercase tracking-wider">{label}</span>
                <span className="text-[10px]">&#9660;</span>
            </div>
            <div className="py-6 px-4 text-center">
                <div className="flex flex-col items-center justify-center">
                    <p className="text-[20px] font-bold text-black tracking-tight">{value}</p>
                    {compareValue !== undefined && (
                        <p className="text-[12px] font-bold text-gray-400 mt-1">
                            {isRtl ? "مقابل" : "vs."} <span className="text-gray-600">{compareValue}</span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
