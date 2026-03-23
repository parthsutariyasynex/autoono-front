"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { fetchCustomerInfo } from "@/store/actions/customerActions";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { useSession } from "next-auth/react";
import Link from "next/link";

type CustomAttribute = {
    attribute_code: string;
    value: string;
};

type Address = {
    id?: number | string;
    default_billing?: boolean;
    default_shipping?: boolean;
    firstname?: string;
    lastname?: string;
    street?: string[];
    city?: string;
    postcode?: string;
    country_id?: string;
    telephone?: string;
    company?: string;
};

export default function MyAccountPage() {
    const router = useRouter();
    const pathname = usePathname();
    const dispatch = useDispatch<AppDispatch>();
    const { data: session, status } = useSession();
    const { data: customer, loading } = useSelector((state: RootState) => state.customer);
    const token = useSelector((state: RootState) => state.auth.token);

    const [isSubAccountSession, setIsSubAccountSession] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const isSub = localStorage.getItem("isSubAccount") === "true";
            setIsSubAccountSession(isSub);

            // Redirect sub-account users to their dedicated page
            if (isSub) {
                router.replace("/subaccount/my-account");
                return;
            }
        }
    }, [pathname, router]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/login");
            return;
        }

        if (status === "authenticated" && token) {
            dispatch(fetchCustomerInfo());
        }
    }, [status, token, dispatch, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5B21B]"></div>
                </div>
            </div>
        );
    }

    if (!customer) return null;

    const getAttr = (code: string, fallback: string = "N/A") => {
        if ((customer as any)[code] !== undefined) return (customer as any)[code];
        if ((customer as any).extension_attributes && (customer as any).extension_attributes[code] !== undefined) {
            return (customer as any).extension_attributes[code];
        }
        const attr = (customer as any).custom_attributes?.find(
            (a: CustomAttribute) => a.attribute_code === code
        )?.value;
        return attr ? attr : fallback;
    }

    const formatCurrency = (val: string) => {
        if (!val || val === "N/A") return "0.00";
        const num = parseFloat(val);
        if (isNaN(num)) return val;
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const cardBase = "border border-gray-300 bg-white shadow-sm rounded-none";
    const sectionHeader = "bg-[#f5f5f5] px-4 py-3 border-b border-gray-300 text-black font-bold uppercase text-[13px]";

    const addresses = (customer as any).addresses as Address[] | undefined;
    const defaultBilling = addresses?.find((a: Address) => a.default_billing);
    const defaultShipping = addresses?.find((a: Address) => a.default_shipping);

    const customerMobile = getAttr("mobile") !== "N/A"
        ? getAttr("mobile")
        : getAttr("mobile_number") !== "N/A"
            ? getAttr("mobile_number")
            : defaultBilling?.telephone || defaultShipping?.telephone || addresses?.[0]?.telephone || "N/A";

    const customerCompany = getAttr("company_name") !== "N/A"
        ? getAttr("company_name")
        : defaultBilling?.company || defaultShipping?.company || addresses?.[0]?.company || "N/A";

    const customerLocation = getAttr("location") !== "N/A"
        ? getAttr("location")
        : getAttr("customer_location") !== "N/A"
            ? getAttr("customer_location")
            : defaultBilling?.city
                ? `${defaultBilling.city} ,${defaultBilling.country_id || "SA"}`
                : defaultShipping?.city
                    ? `${defaultShipping.city} ,${defaultShipping.country_id || "SA"}`
                    : "N/A";

    return (
        <div className="min-h-screen bg-white font-['Rubik',sans-serif]">
            <Navbar />

            <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)]">
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

                    <h1 className="text-2xl font-bold text-black mb-6 uppercase tracking-wide">
                        MY ACCOUNT
                    </h1>

                    <div className="space-y-8">
                        {/* ACCOUNT INFORMATION */}
                        <div>
                            <h2 className="text-[16px] font-bold text-black uppercase mb-3">ACCOUNT INFORMATION</h2>
                            <hr className="border-gray-200 mb-6" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Contact Information */}
                                <div className={cardBase}>
                                    <div className={sectionHeader}>
                                        CONTACT INFORMATION
                                    </div>
                                    <div className="p-5 text-[13px] text-gray-800 space-y-2 font-normal leading-relaxed">
                                        <p><span className="text-black font-bold">Contact Name:</span> {(customer as any).firstname} {(customer as any).lastname}</p>
                                        <p><span className="text-black font-bold">Email:</span> {(customer as any).email}</p>
                                        <p><span className="text-black font-bold">Customer Mobile:</span> {customerMobile}</p>
                                        <p><span className="text-black font-bold">Company Name:</span> {customerCompany}</p>
                                        <p><span className="text-black font-bold">Customer Code:</span> {getAttr("customer_code")}</p>
                                        <p><span className="text-black font-bold">Industry:</span> {getAttr("industry") !== "N/A" ? getAttr("industry") : "N/A"}</p>
                                        <p><span className="text-black font-bold">Location:</span> {customerLocation}</p>
                                        <p><span className="text-black font-bold">Contact Information:</span> {(customer as any).email} ,{customerMobile}</p>

                                        <div className="flex gap-3 pt-6">
                                            <Link href="/customer/account/edit" className="bg-[#F5B21B] hover:bg-[#e0a116] text-black text-[12px] font-bold px-6 py-2 uppercase transition-all rounded-sm">
                                                EDIT
                                            </Link>
                                            <Link href="/customer/account/edit?change=password" className="bg-[#F5B21B] hover:bg-[#e0a116] text-black text-[12px] font-bold px-6 py-2 uppercase transition-all rounded-sm whitespace-nowrap">
                                                CHANGE PASSWORD
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* BUSINESS OVERVIEW & SALES DATA */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className={cardBase}>
                                <div className={sectionHeader + " flex justify-between items-center"}>
                                    <span>BUSINESS OVERVIEW</span>
                                    <button className="bg-[#F5B21B] hover:bg-[#e0a116] text-black text-[10px] font-bold px-4 py-1.5 uppercase transition-all rounded-sm">EDIT</button>
                                </div>
                                <div className="p-5 text-[13px] text-gray-800 space-y-2 font-normal">
                                    <p>Company Size: {getAttr("total_employees", "0")} employees, {getAttr("trucks", "0")} Trucks, {getAttr("annual_revenue", "0")} annual revenue</p>
                                    <p>Business Model: {getAttr("business_model")}</p>
                                    <p>Products/Services Offered: {getAttr("products_offered")}</p>
                                </div>
                            </div>

                            <div className={cardBase}>
                                <div className={sectionHeader}>
                                    SALES DATA (QTY)
                                </div>
                                <div className="p-5 text-[13px] text-gray-800 space-y-2 font-normal">
                                    <p>Total Sales Qty: {getAttr("total_sales_qty", "0")}</p>
                                    <p>Order Frequency: {getAttr("order_frequency", "0")} orders/month</p>
                                </div>
                            </div>
                        </div>

                        {/* TARGETS & BEHAVIOR */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className={cardBase}>
                                <div className={sectionHeader + " flex justify-between items-center"}>
                                    <span>TARGETS AND ACHIEVEMENTS</span>
                                    <select className="border border-gray-300 rounded-sm text-[12px] px-2 py-1 bg-white outline-none">
                                        <option>2023</option>
                                        <option>2024</option>
                                    </select>
                                </div>
                                <div className="p-5 text-[13px] text-gray-800 space-y-2 font-normal">
                                    <p>Sales Targets: {getAttr("sales_targets")}</p>
                                    <p>Achievements: {getAttr("achievements")}</p>
                                    <p>Incentive: SAR {formatCurrency(getAttr("incentive"))}</p>
                                </div>
                            </div>

                            <div className={cardBase}>
                                <div className={sectionHeader}>
                                    CUSTOMER BEHAVIOR
                                </div>
                                <div className="p-5 text-[13px] text-gray-800 space-y-2 font-normal">
                                    <p>Payment History(DSO): {getAttr("payment_history")}</p>
                                    <p>Credit Limit: SAR {formatCurrency(getAttr("total_credit_limit"))}</p>
                                    <p>Credit Period: {getAttr("credit_period")} days</p>
                                </div>
                            </div>
                        </div>

                        {/* ADDRESS BOOK */}
                        <div>
                            <h2 className="text-[16px] font-bold text-black uppercase mb-3">ADDRESS BOOK</h2>
                            <hr className="border-gray-200 mb-6" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Default Billing Address Card */}
                                <div className={cardBase + " flex flex-col"}>
                                    <div className={sectionHeader}>
                                        DEFAULT BILLING ADDRESS
                                    </div>
                                    <div className="p-5 flex flex-col flex-1">
                                        {defaultBilling ? (
                                            <div className="text-[13px] text-gray-800 leading-relaxed space-y-1 font-normal flex-1">
                                                <p>{defaultBilling.firstname} {defaultBilling.lastname}</p>
                                                <p>{defaultBilling.company}</p>
                                                {defaultBilling.street?.map((s: string, i: number) => <p key={i}>{s}</p>)}
                                                <p>{defaultBilling.city}, {defaultBilling.postcode}</p>
                                                <p>{defaultBilling.country_id === 'SA' ? 'Saudi Arabia' : defaultBilling.country_id}</p>
                                                <p>T: {defaultBilling.telephone}</p>
                                            </div>
                                        ) : (
                                            <p className="text-[13px] text-gray-500 italic flex-1">No default billing address set.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Default Shipping Address Card */}
                                <div className={cardBase + " flex flex-col"}>
                                    <div className={sectionHeader}>
                                        DEFAULT SHIPPING ADDRESS
                                    </div>
                                    <div className="p-5 flex flex-col flex-1">
                                        {defaultShipping ? (
                                            <div className="text-[13px] text-gray-800 leading-relaxed space-y-1 font-normal flex-1">
                                                <p>{defaultShipping.firstname} {defaultShipping.lastname}</p>
                                                <p>{defaultShipping.company}</p>
                                                {defaultShipping.street?.map((s: string, i: number) => <p key={i}>{s}</p>)}
                                                <p>{defaultShipping.city}, {defaultShipping.postcode}</p>
                                                <p>{defaultShipping.country_id === 'SA' ? 'Saudi Arabia' : defaultShipping.country_id}</p>
                                                <p>T: {defaultShipping.telephone}</p>
                                            </div>
                                        ) : (
                                            <p className="text-[13px] text-gray-500 italic flex-1">No default shipping address set.</p>
                                        )}

                                        <div className="pt-8">
                                            {defaultShipping?.id ? (
                                                <Link href={`/customer/address-book/edit/${defaultShipping.id}`} className="bg-[#F5B21B] hover:bg-[#e0a116] text-black text-[13px] font-bold px-8 py-2.5 uppercase transition-all rounded-none inline-block">
                                                    EDIT ADDRESS
                                                </Link>
                                            ) : (
                                                <Link href="/customer/address-book" className="bg-[#F5B21B] hover:bg-[#e0a116] text-black text-[13px] font-bold px-8 py-2.5 uppercase transition-all rounded-none inline-block">
                                                    ADD ADDRESS
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>


        </div>
    );
}
