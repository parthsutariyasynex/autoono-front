"use client";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocalePath } from "@/hooks/useLocalePath";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { fetchCustomerInfo } from "@/store/actions/customerActions";
import Sidebar from "@/components/Sidebar";
import { useSession } from "next-auth/react";
import Link from "next/link";
import BusinessOverviewEditModal from "@/components/BusinessOverviewEditModal";
import { redirectToLogin } from "@/utils/helpers";

type CustomAttribute = {
    attribute_code: string;
    value: string;
};

type Address = {
    default_billing?: boolean;
    default_shipping?: boolean;
    street?: string[];
    city?: string;
    postcode?: string;
    country_id?: string;
    telephone?: string;
    company?: string;
};

export default function MyAccountPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const lp = useLocalePath();
    const dispatch = useDispatch<AppDispatch>();
    const { data: session, status } = useSession();
    const { data: customer, loading } = useSelector((state: RootState) => state.customer);
    const token = useSelector((state: RootState) => state.auth.token);

    const [businessOverview, setBusinessOverview] = useState<any>(null);
    const [targets, setTargets] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchTargets = async () => {
        try {
            const currentYear = new Date().getFullYear();
            const response = await fetch(`/api/kleverapi/targets-achievements?year=${currentYear}`);
            const data = await response.json();
            // The API might return an array or a single object
            setTargets(Array.isArray(data) ? data[0] : data);
        } catch (err) {
            console.error("Targets Fetch Error:", err);
        }
    };

    const fetchOverview = async () => {
        try {
            const response = await fetch("/api/kleverapi/business-overview");
            const data = await response.json();
            setBusinessOverview(Array.isArray(data) ? data[0] : data);
        } catch (err) {
            console.error("Overview Fetch Error:", err);
        }
    };

    useEffect(() => {
        if (status === "unauthenticated") {
            redirectToLogin(router);
            return;
        }

        if (status === "authenticated" && token) {
            dispatch(fetchCustomerInfo());
            fetchOverview();
            fetchTargets();
        }
    }, [status, token, dispatch, router]);

    const getOverviewAttr = (key: string, fallback: string = "N/A") => {
        return businessOverview?.[key] || fallback;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">

                <div className="flex items-center justify-center h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5B21B]"></div>
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

    const cardBase = "bg-white border border-gray-100 rounded-sm shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.1)]";
    const sectionHeader = "bg-[#fcfcfc] px-4 md:px-6 py-3 md:py-4 border-b border-gray-50 text-black font-black tracking-wider uppercase text-[13px] md:text-[14px]";

    const addresses = (customer as any).addresses as Address[] | undefined;
    const defaultBilling = addresses?.find((a: Address) => a.default_billing);
    const defaultShipping = addresses?.find((a: Address) => a.default_shipping);

    return (
        <>


            return (
            <div className="flex-1 flex flex-col lg:flex-row min-h-0">
                <Sidebar />

                {/* Right Content Area */}
                <main className="flex-1 p-4 md:p-8 lg:p-10 bg-[#fcfcfc] min-h-0 font-rubik">
                    <div className="max-w-[1240px] mx-auto space-y-12">

                        <div className="flex items-center gap-4 mb-2">
                            <h1 className="text-2xl font-black text-black uppercase tracking-tight">
                                {t("nav.accountDashboard")}
                            </h1>
                            <div className="h-[2px] flex-1 bg-gradient-to-r from-yellow-400 to-transparent"></div>
                        </div>

                        <div className="space-y-10">
                            {/* CONTACT & COMPANY INFORMATION */}
                            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Contact Information */}
                                <div className="bg-white border border-[#ebebeb] rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                                    <div className="bg-gray-50/80 px-6 py-4 border-b border-[#ebebeb] flex justify-between items-center h-[60px]">
                                        <span className="text-black font-black tracking-widest uppercase text-[11px]">Contact Information</span>
                                    </div>
                                    <div className="p-8 text-[13px] text-gray-700 space-y-4 font-medium leading-relaxed">
                                        <div className="flex items-center gap-4 group">
                                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                                            <p className="flex-1">Name: <span className="font-black text-black">{(customer as any).firstname} {(customer as any).lastname}</span></p>
                                        </div>
                                        <div className="flex items-center gap-4 group">
                                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                                            <p className="flex-1">Email: <span className="font-black text-black">{(customer as any).email}</span></p>
                                        </div>
                                        <div className="flex items-center gap-4 group">
                                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                                            <p className="flex-1">Mobile: <span className="font-black text-black">{getAttr("mobile") !== "N/A" ? getAttr("mobile") : getAttr("mobile_number")}</span></p>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-8 pt-8">
                                            <Link href={lp("/customer/account/edit")} className="text-[#f5a623] text-[11px] font-black uppercase tracking-widest hover:text-black transition-colors flex items-center gap-2 group">
                                                Edit Information
                                                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                                            </Link>
                                            <Link href={lp("/customer/account/edit?change=password")} className="text-[#f5a623] text-[11px] font-black uppercase tracking-widest hover:text-black transition-colors flex items-center gap-2 group">
                                                Change Password
                                                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Company Information */}
                                <div className="bg-white border border-[#ebebeb] rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                                    <div className="bg-gray-50/80 px-6 py-4 border-b border-[#ebebeb] flex justify-between items-center h-[60px]">
                                        <span className="text-black font-black tracking-widest uppercase text-[11px]">Company Information</span>
                                    </div>
                                    <div className="p-8 text-[13px] text-gray-700 space-y-4 font-medium leading-relaxed">
                                        <div className="flex items-center gap-4 group">
                                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                                            <p className="flex-1">Company: <span className="font-black text-black">{getAttr("company_name") || addresses?.[0]?.company || "—"}</span></p>
                                        </div>
                                        <div className="flex items-center gap-4 group">
                                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                                            <p className="flex-1">Contact: <span className="font-black text-black">{getAttr("company_contact_name") || "—"}</span></p>
                                        </div>
                                        <div className="flex items-center gap-4 group">
                                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                                            <p className="flex-1">Email: <span className="font-black text-black">{getAttr("company_email") || "—"}</span></p>
                                        </div>
                                        <div className="flex items-center gap-4 group">
                                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                                            <p className="flex-1">Customer Code: <span className="font-black text-black">{getAttr("customer_code")}</span></p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* BUSINESS OVERVIEW & SALES DATA */}
                            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white border border-[#ebebeb] rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                                    <div className="bg-gray-50/80 px-6 py-4 border-b border-[#ebebeb] flex justify-between items-center h-[60px]">
                                        <span className="text-black font-black tracking-widest uppercase text-[11px]">Business Overview</span>
                                        <button
                                            onClick={() => setIsEditModalOpen(true)}
                                            className="bg-white border border-[#ebebeb] hover:border-[#f5a623] hover:text-[#f5a623] text-black text-[9px] font-black px-4 py-1.5 uppercase transition-all rounded-lg shadow-sm tracking-widest active:scale-95"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                    <div className="p-8 text-[13px] text-gray-700 space-y-4 font-medium leading-relaxed">
                                        <p className="italic text-gray-500 mb-2">Detailed business statistics and organizational size.</p>
                                        <p>Company Size: <span className="font-black text-black">{getOverviewAttr("total_employees")} employees</span>, <span className="font-black text-black">{getOverviewAttr("trucks")} Trucks</span></p>
                                        <p>Annual Revenue: <span className="font-black text-black">{getOverviewAttr("annual_revenue")}</span></p>
                                        <p>Business Model: <span className="font-black text-black">{getOverviewAttr("business_model")}</span></p>
                                    </div>
                                </div>

                                <div className="bg-white border border-[#ebebeb] rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                                    <div className="bg-gray-50/80 px-6 py-4 border-b border-[#ebebeb] flex justify-between items-center h-[60px]">
                                        <span className="text-black font-black tracking-widest uppercase text-[11px]">Sales Performance</span>
                                    </div>
                                    <div className="p-8 text-[13px] text-gray-700 space-y-4 font-medium leading-relaxed">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 uppercase text-[11px] font-black tracking-widest">Total Sales Qty</span>
                                            <span className="text-2xl font-black text-black">{getAttr("total_sales_qty") !== "N/A" ? getAttr("total_sales_qty") : "0"}</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-2">
                                            <span className="text-gray-500 uppercase text-[11px] font-black tracking-widest">Order Frequency</span>
                                            <span className="text-lg font-black text-black">{getAttr("order_frequency") !== "N/A" ? getAttr("order_frequency") : "0"} <span className="text-[10px] text-gray-400">mo</span></span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* ADDRESS BOOK */}
                            <section>
                                <div className="bg-white border border-[#ebebeb] rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                                    <div className="bg-gray-50/80 px-6 py-4 border-b border-[#ebebeb] flex justify-between items-center h-[60px]">
                                        <span className="text-black font-black tracking-widest uppercase text-[11px]">Address Book</span>
                                        <Link href={lp("/customer/address-book")} className="bg-white border border-[#ebebeb] hover:border-[#f5a623] hover:text-[#f5a623] text-black text-[9px] font-black px-4 py-1.5 uppercase transition-all rounded-lg shadow-sm tracking-widest active:scale-95">
                                            Manage
                                        </Link>
                                    </div>
                                    <div className="p-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                            <div>
                                                <h4 className="text-[11px] font-black text-gray-400 mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <div className="w-8 h-px bg-gray-200"></div>
                                                    Default Billing
                                                </h4>
                                                {defaultBilling ? (
                                                    <div className="text-[13px] text-gray-700 leading-relaxed font-medium space-y-1">
                                                        <p className="font-black text-black text-sm mb-2">{(customer as any).firstname} {(customer as any).lastname}</p>
                                                        {defaultBilling.street?.map((s: string, i: number) => <p key={i}>{s}</p>)}
                                                        <p>{defaultBilling.city}, {defaultBilling.postcode}</p>
                                                        <p className="uppercase text-[11px] text-gray-400">{defaultBilling.country_id}</p>
                                                        <p className="pt-4 text-gray-500 font-mono text-xs">T: {defaultBilling.telephone}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-[13px] text-gray-400 italic">No default billing address set.</p>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-[11px] font-black text-gray-400 mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <div className="w-8 h-px bg-gray-200"></div>
                                                    Default Shipping
                                                </h4>
                                                {defaultShipping ? (
                                                    <div className="text-[13px] text-gray-700 leading-relaxed font-medium space-y-1">
                                                        <p className="font-black text-black text-sm mb-2">{(customer as any).firstname} {(customer as any).lastname}</p>
                                                        {defaultShipping.street?.map((s: string, i: number) => <p key={i}>{s}</p>)}
                                                        <p>{defaultShipping.city}, {defaultShipping.postcode}</p>
                                                        <p className="uppercase text-[11px] text-gray-400">{defaultShipping.country_id}</p>
                                                        <p className="pt-4 text-gray-500 font-mono text-xs">T: {defaultShipping.telephone}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-[13px] text-gray-400 italic">No default shipping address set.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </main>
            </div>

            <BusinessOverviewEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                initialData={businessOverview}
                onSuccess={fetchOverview}
            />
        </>
    );
}
