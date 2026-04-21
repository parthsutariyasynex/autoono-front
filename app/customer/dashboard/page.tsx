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
import { api } from "@/lib/api/api-client";

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

            const data = await api.get(`/kleverapi/dashboard?${params.toString()}`);
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
            <main className="flex-1 p-4 md:p-8 lg:p-10 bg-[#fcfcfc] min-h-0 font-rubik" dir={isRtl ? "rtl" : "ltr"}>
                <div className="w-full space-y-12">

                    {/* Sub-account Identity Banner */}
                    {isSubAccountSession && (
                        <div className={`bg-green-50/80 ${isRtl ? 'border-r-4' : 'border-l-4'} border-green-500 text-green-800 p-4 mb-8 ${isRtl ? 'rounded-l-lg' : 'rounded-r-lg'} flex items-center gap-3 animate-in fade-in slide-in-from-top duration-500 shadow-sm border border-gray-100`} role="alert">
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-caption font-bold">&#10004;</div>
                            <p className="text-body-lg font-bold tracking-tight uppercase">{t("dashboard.subAccountBanner")}</p>
                        </div>
                    )}

                    <div className="flex items-center gap-4 mb-2">
                        <h1 className="text-2xl font-black text-black uppercase tracking-tight">
                            {t("dashboard.title")}
                        </h1>
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-primary to-transparent"></div>
                    </div>

                    {/* COMPARE SECTION */}
                    <section className="bg-white border border-[#ebebeb] rounded-xl shadow-sm mb-12 overflow-hidden transition-all duration-300 hover:shadow-md">
                        {/* Header Section */}
                        <div className="bg-gray-50/80 p-4 px-6 border-b border-[#ebebeb] flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="compare-toggle"
                                    checked={isCompare}
                                    onChange={(e) => {
                                        setIsCompare(e.target.checked);
                                        if (!e.target.checked) {
                                            setSearchYear(new Date().getFullYear());
                                        }
                                    }}
                                    className="w-[18px] h-[18px] accent-primary cursor-pointer"
                                />
                                <label htmlFor="compare-toggle" className="text-label font-black uppercase text-black tracking-widest cursor-pointer select-none">{t("dashboard.compare")}</label>
                            </div>
                        </div>

                        {/* Body Section */}
                        <div className="p-8 px-8 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12">
                            {/* First Selector */}
                            <div className="flex-1 w-full bg-white border border-[#ebebeb] rounded-lg shadow-sm hover:border-primary transition-all">
                                <PortalDropdown
                                    value={searchYear}
                                    onChange={(val) => {
                                        setSearchYear(Number(val));
                                        setIsCompare(true);
                                    }}
                                    options={availableYears.map(y => ({ label: String(y), value: String(y) }))}
                                    buttonClassName="w-full h-11 px-5 flex items-center justify-between gap-2 cursor-pointer bg-transparent outline-none ltr:text-left rtl:text-right font-black text-body uppercase tracking-wider text-black"
                                    className="w-full h-full"
                                />
                            </div>

                            {/* Constant "vs." label */}
                            <div className="flex items-center justify-center">
                                <span className="bg-gray-100/80 px-4 py-1 rounded-full text-label font-black text-black uppercase tracking-tighter italic border border-gray-200">
                                    {isRtl ? "مقابل" : "vs."}
                                </span>
                            </div>

                            {/* Second Selector */}
                            <div className="flex-1 w-full bg-white border border-[#ebebeb] rounded-lg shadow-sm hover:border-primary transition-all">
                                <PortalDropdown
                                    value={compareYear}
                                    onChange={(val) => {
                                        setCompareYear(Number(val));
                                        setIsCompare(true);
                                    }}
                                    options={availableYears.map(y => ({ label: String(y), value: String(y) }))}
                                    buttonClassName="w-full h-11 px-5 flex items-center justify-between gap-2 cursor-pointer bg-transparent outline-none ltr:text-left rtl:text-right font-black text-body uppercase tracking-wider text-black"
                                    className="w-full h-full"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Summary Sections - Hide when comparing */}
                    {!isCompare && (
                        <div className="space-y-12 animate-in fade-in duration-700">
                            {/* TOTAL ORDER QTY SECTION */}
                            <section>
                                <div className="flex items-center gap-4 mb-6">
                                    <h2 className="text-lg font-black text-black uppercase tracking-tight">{t("m.total-order-qty")}</h2>
                                    <div className="h-[2px] w-12 bg-primary"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <QtyCard
                                        label={`${t("dashboard.year")} - ${searchYear}`}
                                        value={dashboardData?.yearly_summary?.[0]?.qty || "0"}
                                        isRtl={isRtl}
                                    />
                                    <QtyCard
                                        label={t("m.quarter")}
                                        value={dashboardData?.quarterly_summary?.[0]?.qty || "0"}
                                        isRtl={isRtl}
                                    />
                                    <QtyCard
                                        label={t("m.months")}
                                        value={dashboardData?.monthly_summary?.[0]?.qty || "0"}
                                        isRtl={isRtl}
                                    />
                                </div>
                            </section>

                            {/* TOTAL ORDER VALUE SECTION */}
                            <section>
                                <div className="flex items-center gap-4 mb-6">
                                    <h2 className="text-lg font-black text-black uppercase tracking-tight">{t("m.total-order-value")}</h2>
                                    <div className="h-[2px] w-12 bg-primary"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <ValueCard
                                        label={`${t("dashboard.year")} - ${searchYear}`}
                                        value={formatValue(dashboardData?.yearly_summary?.[0]?.amount)}
                                        isRtl={isRtl}
                                    />
                                    <ValueCard
                                        label={t("m.quarter")}
                                        value={formatValue(dashboardData?.quarterly_summary?.[0]?.amount)}
                                        isRtl={isRtl}
                                    />
                                    <ValueCard
                                        label={t("m.months")}
                                        value={formatValue(dashboardData?.monthly_summary?.[0]?.amount)}
                                        isRtl={isRtl}
                                    />
                                </div>
                            </section>

                            {/* BOTTOM FILTERS */}
                            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                {/* Product Group Filter */}
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-body font-black text-black uppercase tracking-widest ltr:text-left rtl:text-right opacity-60">{t("dashboard.productGroupLabel")}</h3>
                                    <div className="bg-white border border-[#ebebeb] rounded-xl shadow-sm overflow-hidden group hover:shadow-md transition-all">
                                        <div className="bg-gray-50 border-b border-[#ebebeb] h-12 px-5 flex items-center relative">
                                            <PortalDropdown
                                                value={selectedProductGroup}
                                                onChange={(val) => setSelectedProductGroup(val)}
                                                options={
                                                    (!dashboardData?.product_groups || dashboardData.product_groups.length === 0)
                                                        ? [{ label: t("common.noDataFound"), value: "" }]
                                                        : dashboardData.product_groups.map((pg: any) => ({ label: translateData(pg.product_group), value: pg.product_group }))
                                                }
                                                placeholder={t("m.select")}
                                                buttonClassName="w-full h-full flex items-center justify-between gap-2 cursor-pointer bg-transparent outline-none ltr:text-left rtl:text-right font-black text-body-sm uppercase tracking-wider text-black"
                                                className="w-full h-full"
                                            />
                                        </div>
                                        <div className="py-8 px-6 text-center">
                                            <p className="text-3xl font-black text-black font-rubik tracking-tight">
                                                {dashboardData?.product_groups?.find((pg: any) => pg.product_group === selectedProductGroup)?.qty || "0"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Tyre Size Filter */}
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-body font-black text-black uppercase tracking-widest ltr:text-left rtl:text-right opacity-60">{t("dashboard.tyreSizeLabel")}</h3>
                                    <div className="bg-white border border-[#ebebeb] rounded-xl shadow-sm overflow-hidden group hover:shadow-md transition-all">
                                        <div className="bg-gray-50 border-b border-[#ebebeb] h-12 px-5 flex items-center relative">
                                            <PortalDropdown
                                                value={selectedTyreSize}
                                                onChange={(val) => setSelectedTyreSize(val)}
                                                options={
                                                    (!dashboardData?.tyre_sizes || dashboardData.tyre_sizes.length === 0)
                                                        ? [{ label: t("common.noDataFound"), value: "" }]
                                                        : dashboardData.tyre_sizes.map((ts: any) => ({ label: translateData(ts.size_pattern), value: ts.size_pattern }))
                                                }
                                                placeholder={t("m.select")}
                                                buttonClassName="w-full h-full flex items-center justify-between gap-2 cursor-pointer bg-transparent outline-none ltr:text-left rtl:text-right font-black text-body-sm uppercase tracking-wider text-black"
                                                className="w-full h-full"
                                            />
                                        </div>
                                        <div className="py-8 px-6 text-center">
                                            <p className="text-3xl font-black text-black font-rubik tracking-tight">
                                                {dashboardData?.tyre_sizes?.find((ts: any) => ts.size_pattern === selectedTyreSize)?.qty || "0"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* COMPARISON DETAILS SECTION (Chart & Table) */}
                    {isCompare && (
                        <section className="bg-white border border-[#ebebeb] rounded-xl shadow-lg p-0 mb-16 overflow-hidden animate-in fade-in slide-in-from-bottom duration-500">
                            <div className="p-6 md:p-10 border-b border-[#fcfcfc] bg-gray-50/50">
                                <h2 className="text-lg md:text-xl font-black text-black uppercase tracking-tight ltr:text-left rtl:text-right">
                                    {isRtl ? `مقارنة ${searchYear} مع ${compareYear}` : `COMPARE ${searchYear} WITH ${compareYear}`}
                                </h2>
                            </div>

                            {/* Tabs */}
                            <div className="flex px-4 pt-4 gap-2 bg-gray-50/50">
                                <button
                                    onClick={() => setActiveTab('quarterly')}
                                    className={`px-6 md:px-10 py-3 md:py-4 text-label font-black uppercase tracking-widest cursor-pointer transition-all rounded-t-lg
                                        ${activeTab === 'quarterly' ? 'bg-white text-black border-x border-t border-[#ebebeb]' : 'bg-transparent text-gray-400 hover:text-gray-600'}`}
                                >
                                    {t("dashboard.quarterlySalesData")}
                                </button>
                                <button
                                    onClick={() => setActiveTab('monthly')}
                                    className={`px-6 md:px-10 py-3 md:py-4 text-label font-black uppercase tracking-widest cursor-pointer transition-all rounded-t-lg
                                        ${activeTab === 'monthly' ? 'bg-white text-black border-x border-t border-[#ebebeb]' : 'bg-transparent text-gray-400 hover:text-gray-600'}`}
                                >
                                    {t("dashboard.monthlySalesData")}
                                </button>
                            </div>

                            <div className="p-6 md:p-10">
                                {/* Chart Implementation */}
                                <div className="h-[250px] md:h-[450px] w-full mb-16 px-4">
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
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 900 }}
                                                dy={15}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase' }}
                                                cursor={{ fill: '#f9fafb' }}
                                            />
                                            <Legend
                                                verticalAlign="top"
                                                align="right"
                                                iconType="circle"
                                                wrapperStyle={{ paddingBottom: '40px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                            />
                                            <Bar dataKey={searchYear} fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={32} name={searchYear.toString()} />
                                            <Bar dataKey={compareYear} fill="#111827" radius={[4, 4, 0, 0]} barSize={32} name={compareYear.toString()} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Data Table */}
                                <div className="overflow-x-auto border border-[#ebebeb] rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50/80 border-b border-[#ebebeb] h-[55px]">
                                                <th className="py-4 px-6 text-label font-black text-black uppercase tracking-widest text-left">{activeTab === 'quarterly' ? t("dashboard.quarter") : t("dashboard.month")}</th>
                                                <th className="py-4 px-6 text-label font-black text-black uppercase tracking-widest text-center">{searchYear} QTY</th>
                                                <th className="py-4 px-6 text-label font-black text-black uppercase tracking-widest text-center">{compareYear} QTY</th>
                                                <th className="py-4 px-6 text-label font-black text-black uppercase tracking-widest text-right">{isRtl ? 'التغيير' : 'CHANGE'}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 bg-white">
                                            {(activeTab === 'quarterly' ? [1, 2, 3, 4] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).map((p, idx) => {
                                                const val1 = (activeTab === 'quarterly' ? dashboardData?.compare_quarterly : dashboardData?.compare_monthly)
                                                    ?.find((d: any) => d.year === searchYear && d.period === p)?.qty || 0;
                                                const val2 = (activeTab === 'quarterly' ? dashboardData?.compare_quarterly : dashboardData?.compare_monthly)
                                                    ?.find((d: any) => d.year === compareYear && d.period === p)?.qty || 0;

                                                const label = activeTab === 'quarterly'
                                                    ? (isRtl ? `ر${p}` : `Q${p}`)
                                                    : (isRtl ? monthNames[p - 1] : p.toString());

                                                const change = val2 > 0 ? ((val1 - val2) / val2 * 100).toFixed(1) : (val1 > 0 ? "100" : "0");

                                                return (
                                                    <tr key={p} className="hover:bg-primary/10 transition-colors h-[60px]">
                                                        <td className="py-4 px-6 font-black text-black text-body uppercase">{label}</td>
                                                        <td className="py-4 px-6 text-body-lg font-black text-gray-800 text-center">{val1}</td>
                                                        <td className="py-4 px-6 text-body-lg font-bold text-gray-400 text-center">{val2}</td>
                                                        <td className="py-4 px-6 text-right">
                                                            <span className={`text-label font-black px-2 py-1 rounded ${Number(change) >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                                                {Number(change) >= 0 ? '+' : ''}{change}%
                                                            </span>
                                                        </td>
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
function QtyCard({ label, value, isRtl }: { label: string; value: string; isRtl: boolean }) {
    return (
        <div className="bg-white border border-[#ebebeb] rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-1 group">
            <div className="bg-gray-50 h-10 px-5 flex justify-between items-center text-black border-b border-[#ebebeb] group-hover:bg-primary transition-colors">
                <span className="text-caption font-black uppercase tracking-widest text-gray-500 group-hover:text-primary">{label}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
            </div>
            <div className="py-10 px-4 text-center">
                <p className="text-4xl font-black text-black tracking-tighter">{value}</p>
            </div>
        </div>
    );
}

function ValueCard({ label, value, isRtl }: { label: string; value: string; isRtl: boolean }) {
    return (
        <div className="bg-white border border-[#ebebeb] rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-1 group">
            <div className="bg-gray-50 h-10 px-5 flex justify-between items-center text-black border-b border-[#ebebeb] group-hover:bg-primary transition-colors">
                <span className="text-caption font-black uppercase tracking-widest text-gray-500 group-hover:text-primary">{label}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
            </div>
            <div className="py-10 px-4 text-center">
                <p className="text-2xl font-black text-black tracking-tight">{value} <span className="text-label font-black text-gray-400 uppercase ml-1">SAR</span></p>
            </div>
        </div>
    );
}
