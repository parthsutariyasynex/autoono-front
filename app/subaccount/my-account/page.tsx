"use client";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocalePath } from "@/hooks/useLocalePath";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { fetchCustomerInfo } from "@/store/actions/customerActions";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { redirectToLogin } from "@/utils/helpers";

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
    vat_id?: string;
    custom_attributes?: { attribute_code: string; value: string }[];
};

export default function SubAccountMyAccountPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const lp = useLocalePath();
    const pathname = usePathname();
    const dispatch = useDispatch<AppDispatch>();
    const { status } = useSession();
    // Parent account data from Redux (for company info)
    const { data: parentCustomer, loading: parentLoading } = useSelector((state: RootState) => state.customer);
    const token = useSelector((state: RootState) => state.auth.token);

    const [isSubAccountSession, setIsSubAccountSession] = useState(false);
    // Sub-account's own customer data (from login response)
    const [subCustomer, setSubCustomer] = useState<any>(null);

    // Check sub-account session & load sub-account customer from localStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            const isSub = localStorage.getItem("isSubAccount") === "true";
            setIsSubAccountSession(isSub);

            if (!isSub) {
                router.replace(lp("/my-account"));
                return;
            }

            // Login response is stored as {token, customer: {...}}
            const storedData = localStorage.getItem("subAccountData");
            if (storedData) {
                try {
                    const parsed = JSON.parse(storedData);
                    // Extract the customer object from login response
                    const customerData = parsed.customer || parsed;
                    setSubCustomer(customerData);
                } catch { }
            }
        }
    }, [pathname, router]);

    // Fetch parent account data (for company info)
    useEffect(() => {
        if (status === "unauthenticated") {
            redirectToLogin(router);
            return;
        }

        if (status === "authenticated" && token) {
            dispatch(fetchCustomerInfo());
        }
    }, [status, token, dispatch, router]);

    if (parentLoading) {
        return (
            <div className="min-h-screen bg-white">

                <div className="flex items-center justify-center h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5B21B]"></div>
                </div>
            </div>
        );
    }

    if (!parentCustomer) return null;

    // Helper: get attribute from PARENT account data (for company info)
    const getParentAttr = (code: string, fallback: string = "N/A") => {
        if ((parentCustomer as any)[code] !== undefined) return (parentCustomer as any)[code];
        if ((parentCustomer as any).extension_attributes?.[code] !== undefined) {
            return (parentCustomer as any).extension_attributes[code];
        }
        const attr = (parentCustomer as any).custom_attributes?.find(
            (a: CustomAttribute) => a.attribute_code === code
        )?.value;
        return attr || fallback;
    };

    // ===== CONTACT INFORMATION (from sub-account login customer) =====
    const contactName = subCustomer
        ? `${subCustomer.firstname || ""} ${subCustomer.lastname || ""}`.trim()
        : localStorage.getItem("subAccountName") || "N/A";
    const contactEmail = subCustomer?.email || "N/A";

    // ===== COMPANY INFORMATION (from parent account) =====
    const companyName = getParentAttr("company_name");
    const companyContactName = `${(parentCustomer as any).firstname || ""} ${(parentCustomer as any).lastname || ""}`.trim() || "N/A";
    const companyEmail = (parentCustomer as any).email || "N/A";

    // Parent addresses for mobile fallback
    const parentAddresses = (parentCustomer as any).addresses as Address[] | undefined;
    const parentDefaultBilling = parentAddresses?.find((a: Address) => a.default_billing);
    const parentDefaultShipping = parentAddresses?.find((a: Address) => a.default_shipping);

    const customerMobile = getParentAttr("mobile") !== "N/A"
        ? getParentAttr("mobile")
        : getParentAttr("mobile_number") !== "N/A"
            ? getParentAttr("mobile_number")
            : getParentAttr("customer_mobile") !== "N/A"
                ? getParentAttr("customer_mobile")
                : parentDefaultBilling?.telephone || parentDefaultShipping?.telephone || parentAddresses?.[0]?.telephone || "N/A";

    const customerCode = getParentAttr("customer_code");

    // ===== ADDRESSES (from sub-account login customer - has vat_id) =====
    const subAddresses = subCustomer?.addresses as Address[] | undefined;
    const defaultBilling = subAddresses?.find((a: Address) => a.default_billing);
    const defaultShipping = subAddresses?.find((a: Address) => a.default_shipping);

    const cardBase = "border border-gray-300 bg-white shadow-sm rounded-none";
    const sectionHeader = "bg-[#f5f5f5] px-3 md:px-4 py-2.5 md:py-3 border-b border-gray-300 text-black font-bold uppercase text-[12px] md:text-[13px]";

    return (
        <>


            <div className="flex flex-col lg:flex-row flex-1 min-h-0 w-full">
                <Sidebar />

                {/* Right Content */}
                <main className="flex-1 p-4 md:p-8 bg-white min-h-0">

                    {/* Green Alert Banner */}
                    {isSubAccountSession && (
                        <div className="bg-[#e7f6e7] border-l-4 border-[#2d8a2d] text-[#1b5e20] p-3 md:p-4 mb-6 md:mb-8 flex items-center gap-3 animate-in fade-in slide-in-from-top duration-500 shadow-sm" role="alert">
                            <span className="text-[#2d8a2d] font-bold text-lg">✔</span>
                            <p className="text-[14px] font-medium tracking-tight">You are logged as subaccount now.</p>
                        </div>
                    )}

                    <h1 className="text-xl md:text-2xl font-bold text-black mb-4 md:mb-6 uppercase tracking-wide">
                        MY ACCOUNT
                    </h1>

                    <div className="space-y-6 md:space-y-8">
                        {/* ACCOUNT INFORMATION */}
                        <div>
                            <h2 className="text-[14px] md:text-[16px] font-bold text-black uppercase mb-2 md:mb-3">ACCOUNT INFORMATION</h2>
                            <hr className="border-gray-200 mb-4 md:mb-6" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                {/* Contact Information - from SUB-ACCOUNT login customer */}
                                <div className={cardBase}>
                                    <div className={sectionHeader}>
                                        CONTACT INFORMATION
                                    </div>
                                    <div className="p-3 md:p-5 text-[13px] text-gray-800 space-y-2 font-normal leading-relaxed">
                                        <p><span className="text-black font-bold">Contact Name:</span> {contactName}</p>
                                        <p><span className="text-black font-bold">Email:</span> {contactEmail}</p>
                                        <p><span className="text-black font-bold">Contact Information:</span> {contactEmail} ,</p>
                                    </div>
                                </div>

                                {/* Company Information - from PARENT account */}
                                <div className={cardBase}>
                                    <div className={sectionHeader}>
                                        COMPANY INFORMATION
                                    </div>
                                    <div className="p-3 md:p-5 text-[13px] text-gray-800 space-y-2 font-normal leading-relaxed">
                                        <p><span className="text-black font-bold">Company Name:</span> {companyName}</p>
                                        <p><span className="text-black font-bold">Company Contact Name:</span> {companyContactName}</p>
                                        <p><span className="text-black font-bold">Company Email:</span> {companyEmail}</p>
                                        <p><span className="text-black font-bold">Customer Mobile:</span> {customerMobile}</p>
                                        <p><span className="text-black font-bold">Customer Code:</span> {customerCode}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ADDRESS BOOK - from SUB-ACCOUNT login customer (has vat_id) */}
                        <div>
                            <h2 className="text-[14px] md:text-[16px] font-bold text-black uppercase mb-2 md:mb-3">ADDRESS BOOK</h2>
                            <hr className="border-gray-200 mb-4 md:mb-6" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                {/* Default Billing Address */}
                                <div className={cardBase + " flex flex-col"}>
                                    <div className={sectionHeader}>
                                        DEFAULT BILLING ADDRESS
                                    </div>
                                    <div className="p-3 md:p-5 flex flex-col flex-1">
                                        {defaultBilling ? (
                                            <div className="text-[13px] text-gray-800 leading-relaxed space-y-1 font-normal flex-1">
                                                <p>{defaultBilling.firstname} {defaultBilling.lastname}</p>
                                                <p>{defaultBilling.company}</p>
                                                {defaultBilling.street?.map((s: string, i: number) => <p key={i}>{s}</p>)}
                                                <p>{defaultBilling.city}, {defaultBilling.postcode}</p>
                                                <p>{defaultBilling.country_id === 'SA' ? 'Saudi Arabia' : defaultBilling.country_id}</p>
                                                <p>T: {defaultBilling.telephone}</p>
                                                {defaultBilling.vat_id && <p>VAT: {defaultBilling.vat_id}</p>}
                                            </div>
                                        ) : (
                                            <p className="text-[13px] text-gray-500 italic flex-1">No default billing address set.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Default Shipping Address */}
                                <div className={cardBase + " flex flex-col"}>
                                    <div className={sectionHeader}>
                                        DEFAULT SHIPPING ADDRESS
                                    </div>
                                    <div className="p-3 md:p-5 flex flex-col flex-1">
                                        {defaultShipping ? (
                                            <div className="text-[13px] text-gray-800 leading-relaxed space-y-1 font-normal flex-1">
                                                <p>{defaultShipping.firstname} {defaultShipping.lastname}</p>
                                                <p>{defaultShipping.company}</p>
                                                {defaultShipping.street?.map((s: string, i: number) => <p key={i}>{s}</p>)}
                                                <p>{defaultShipping.city}, {defaultShipping.postcode}</p>
                                                <p>{defaultShipping.country_id === 'SA' ? 'Saudi Arabia' : defaultShipping.country_id}</p>
                                                <p>T: {defaultShipping.telephone}</p>
                                                {defaultShipping.vat_id && <p>VAT: {defaultShipping.vat_id}</p>}
                                            </div>
                                        ) : (
                                            <p className="text-[13px] text-gray-500 italic flex-1">No default shipping address set.</p>
                                        )}

                                        <div className="pt-8">
                                            {defaultShipping?.id ? (
                                                <Link
                                                    href={lp(`/customer/address-book/edit/${defaultShipping.id}`)}
                                                    className="bg-[#F5B21B] hover:bg-[#e0a116] text-black text-[12px] md:text-[13px] font-bold px-6 md:px-8 py-2 md:py-2.5 uppercase transition-all rounded-none inline-block w-full sm:w-auto text-center"
                                                >
                                                    EDIT ADDRESS
                                                </Link>
                                            ) : (
                                                <Link
                                                    href={lp("/customer/address-book")}
                                                    className="bg-[#F5B21B] hover:bg-[#e0a116] text-black text-[12px] md:text-[13px] font-bold px-6 md:px-8 py-2 md:py-2.5 uppercase transition-all rounded-none inline-block w-full sm:w-auto text-center"
                                                >
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

        </>
    );
}
