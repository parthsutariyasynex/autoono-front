"use client";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocalePath } from "@/hooks/useLocalePath";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { fetchCustomerInfo } from "@/store/actions/customerActions";
import Sidebar from "@/components/Sidebar";
import { useSession } from "next-auth/react";
import Link from "next/link";
import BusinessOverviewEditModal from "@/components/BusinessOverviewEditModal";
import { redirectToLogin } from "@/utils/helpers";
import PortalDropdown from "@/components/PortalDropdown";

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
    const { t } = useTranslation();
    const lp = useLocalePath();
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
                router.replace(lp("/subaccount/my-account"));
                return;
            }
        }
    }, [pathname, router]);

    const [businessOverview, setBusinessOverview] = useState<any>(null);
    const [targets, setTargets] = useState<any>(null);
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchTargets = async (year: string) => {
        try {
            const response = await fetch(`/api/kleverapi/targets-achievements?year=${year}`);
            const data = await response.json();

            if (data.available_years) setAvailableYears(data.available_years);

            // Extract targets for the current year from data.years array or use first matching object
            const yearData = data.years?.[0] || {};
            setTargets(yearData);
        } catch (err) {
            console.error("Targets Fetch Error:", err);
            setTargets({});
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
            fetchTargets(selectedYear);
        }
    }, [status, token, dispatch, router, selectedYear]);

    const getOverviewAttr = (key: string, fallback: string = "N/A") => {
        return businessOverview?.[key] || fallback;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">

                <div className="flex items-center justify-center h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
    const sectionHeader = "bg-[#f5f5f5] px-4 py-3 border-b border-gray-300 text-black font-bold uppercase text-body";

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
        <>


            <div className="min-h-screen flex flex-col w-full bg-[#fcfcfc] font-rubik">
                <div className="flex flex-col lg:flex-row flex-1 w-full">
                    <Sidebar />

                    {/* Right Content */}
                    <main className="flex-1 w-full px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-10">

                        {/* Sub-account Identity Banner */}
                        {isSubAccountSession && (
                            <div className="bg-[#e7f6e7] border-l-4 border-[#2d8a2d] text-[#1b5e20] p-4 mb-8 flex items-center gap-3 animate-in fade-in slide-in-from-top duration-500 shadow-sm" role="alert">
                                <span className="text-[#2d8a2d] font-bold text-lg">✔</span>
                                <p className="text-body-lg font-medium tracking-tight">{t("account.youAreLoggedAs")}</p>
                            </div>
                        )}

                        <h1 className="text-h3 sm:text-h3 md:text-[26px] font-black text-black mb-6 md:mb-10 uppercase tracking-wide">
                            {t("account.title")}
                        </h1>

                        <div className="space-y-8">
                            {/* ACCOUNT INFORMATION */}
                            <div>
                                <h2 className="text-body-lg md:text-h3-sm font-bold text-black uppercase mb-3">{t("account.accountInformation")}</h2>
                                <hr className="border-gray-200 mb-6" />

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                                    {/* Contact Information */}
                                    <div className={cardBase}>
                                        <div className={sectionHeader}>
                                            {t("account.contactInformation")}
                                        </div>
                                        <div className="p-3 md:p-5 text-body text-gray-700 space-y-2.5 font-medium leading-relaxed">
                                            <p>{t("account.contactName")}: {(customer as any).firstname} {(customer as any).lastname}</p>
                                            <p>{t("account.email")}: {(customer as any).email}</p>
                                            <p>{t("account.customerMobile")}: {customerMobile}</p>
                                            <p>{t("account.companyName")}: {customerCompany}</p>
                                            <p>{t("account.customerCode")}: {getAttr("customer_code")}</p>
                                            <p>{t("m.industry")}: {getAttr("industry") !== "N/A" ? getAttr("industry") : "N/A"}</p>
                                            <p>{t("m.location")}: {customerLocation}</p>
                                            <p>{t("account.contactInformation")}: {(customer as any).email} ,{customerMobile}</p>

                                            <div className="flex flex-col md:flex-row gap-3 pt-4 md:pt-6">
                                                <Link href={lp("/customer/account/edit")} className="w-full md:w-auto text-center bg-primary hover:bg-primaryHover text-black text-body-sm font-bold px-6 py-2 uppercase transition-all rounded-sm">
                                                    {t("m.edit")}
                                                </Link>
                                                <Link href={lp("/customer/account/edit?change=password")} className="w-full md:w-auto text-center bg-primary hover:bg-primaryHover text-black text-body-sm font-bold px-6 py-2 uppercase transition-all rounded-sm whitespace-nowrap">
                                                    {t("changePassword.title")}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BUSINESS OVERVIEW & SALES DATA */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                                <div className={cardBase}>
                                    <div className={sectionHeader + " flex justify-between items-center"}>
                                        <span>{t("dashboard.businessOverview")}</span>
                                        <button
                                            onClick={() => setIsEditModalOpen(true)}
                                            className="bg-primary hover:bg-black hover:text-white text-black text-caption font-bold px-4 py-1.5 uppercase transition-all rounded-sm shadow-sm"
                                        >
                                            {t("m.edit")}
                                        </button>
                                    </div>
                                    <div className="p-3 md:p-5 text-body text-gray-700 space-y-2.5 font-medium leading-relaxed">
                                        <p>{t("m.company-size")}: {getOverviewAttr("total_employees")} {t("account.employees")}, {getOverviewAttr("trucks")} {t("account.trucks")}, {getOverviewAttr("annual_revenue")} {t("account.annualRevenue")}</p>
                                        <p>{t("m.business-model")}: {getOverviewAttr("business_model")}</p>
                                        <p>{t("m.products-services-offered")}: {getOverviewAttr("products_offered")}</p>
                                    </div>
                                </div>

                                <div className={cardBase}>
                                    <div className={sectionHeader}>
                                        {t("m.sales-data-qty")}
                                    </div>
                                    <div className="p-3 md:p-5 text-body text-gray-700 space-y-2.5 font-medium leading-relaxed">
                                        <p>{t("m.total-sales-qty")}: {getAttr("total_sales_qty", "0")}</p>
                                        <p>{t("m.order-frequency")}: {getAttr("order_frequency", "0")} {t("account.ordersPerMonth")}</p>
                                    </div>
                                </div>
                            </div>

                            {/* TARGETS & BEHAVIOR */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                                <div className={cardBase}>
                                    <div className={sectionHeader + " flex justify-between items-center"}>
                                        <span>{t("m.targets-and-achievements")}</span>
                                        <PortalDropdown
                                            value={selectedYear}
                                            onChange={setSelectedYear}
                                            options={(availableYears.length > 0 ? availableYears : [2023, 2024, 2025]).map(y => ({ label: String(y), value: String(y) }))}
                                            minWidth={70}
                                        />
                                    </div>
                                    <div className="p-3 md:p-5 text-body text-gray-700 space-y-2.5 font-medium leading-relaxed">
                                        {targets ? (
                                            <>
                                                <p>{t("m.sales-targets")}: {targets.sales_target || "0"}</p>
                                                <p>{t("m.achievements")}: {targets.achievement || "0"}</p>
                                                <p>{t("m.incentive")}: SAR {formatCurrency(targets.incentive)}</p>
                                                {targets.remarks && <p className="text-primary font-bold">{t("m.comment")}: {targets.remarks}</p>}
                                            </>
                                        ) : (
                                            <>
                                                <p>{t("m.sales-targets")}: {getAttr("sales_targets")}</p>
                                                <p>{t("m.achievements")}: {getAttr("achievements")}</p>
                                                <p>{t("m.incentive")}: SAR {formatCurrency(getAttr("incentive"))}</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className={cardBase}>
                                    <div className={sectionHeader}>
                                        {t("m.customer-behavior")}
                                    </div>
                                    <div className="p-3 md:p-5 text-body text-gray-700 space-y-2.5 font-medium leading-relaxed">
                                        <p>{t("m.payment-historydso")}: {getAttr("payment_history")}</p>
                                        <p>{t("m.credit-limit")}: SAR {formatCurrency(getAttr("total_credit_limit"))}</p>
                                        <p>{t("m.credit-period")}: {getAttr("credit_period")} {t("account.days")}</p>
                                    </div>
                                </div>
                            </div>

                            {/* ADDRESS BOOK */}
                            <div>
                                <h2 className="text-body-lg md:text-h3-sm font-bold text-black uppercase mb-3">{t("addressBook.title")}</h2>
                                <hr className="border-gray-200 mb-6" />

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                                    {/* Default Billing Address Card */}
                                    <div className={cardBase + " flex flex-col"}>
                                        <div className={sectionHeader}>
                                            {t("addressBook.defaultBillingAddress")}
                                        </div>
                                        <div className="p-3 md:p-5 flex flex-col flex-1">
                                            {defaultBilling ? (
                                                <div className="text-body text-gray-800 leading-relaxed space-y-1 font-normal flex-1">
                                                    <p>{defaultBilling.firstname} {defaultBilling.lastname}</p>
                                                    <p>{defaultBilling.company}</p>
                                                    {defaultBilling.street?.map((s: string, i: number) => <p key={i}>{s}</p>)}
                                                    <p>{defaultBilling.city}, {defaultBilling.postcode}</p>
                                                    <p>{defaultBilling.country_id === 'SA' ? t("data.Saudi Arabia") : defaultBilling.country_id}</p>
                                                    <p>T: {defaultBilling.telephone}</p>
                                                </div>
                                            ) : (
                                                <p className="text-body text-gray-500 italic flex-1">{t("addressBook.noBillingAddress")}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Default Shipping Address Card */}
                                    <div className={cardBase + " flex flex-col"}>
                                        <div className={sectionHeader}>
                                            {t("addressBook.defaultShippingAddress")}
                                        </div>
                                        <div className="p-3 md:p-5 flex flex-col flex-1">
                                            {defaultShipping ? (
                                                <div className="text-body text-gray-800 leading-relaxed space-y-1 font-normal flex-1">
                                                    <p>{defaultShipping.firstname} {defaultShipping.lastname}</p>
                                                    <p>{defaultShipping.company}</p>
                                                    {defaultShipping.street?.map((s: string, i: number) => <p key={i}>{s}</p>)}
                                                    <p>{defaultShipping.city}, {defaultShipping.postcode}</p>
                                                    <p>{defaultShipping.country_id === 'SA' ? t("data.Saudi Arabia") : defaultShipping.country_id}</p>
                                                    <p>T: {defaultShipping.telephone}</p>
                                                </div>
                                            ) : (
                                                <p className="text-body text-gray-500 italic flex-1">{t("addressBook.noShippingAddress")}</p>
                                            )}

                                            <div className="pt-4 md:pt-8">
                                                {defaultShipping?.id ? (
                                                    <Link href={lp(`/customer/address-book/edit/${defaultShipping.id}`)} className="w-full md:w-auto text-center bg-primary hover:bg-primaryHover text-black text-body font-bold px-4 md:px-8 py-2.5 uppercase transition-all rounded-none inline-block">
                                                        {t("addressBook.editAddress")}
                                                    </Link>
                                                ) : (
                                                    <Link href={lp("/customer/address-book")} className="w-full md:w-auto text-center bg-primary hover:bg-primaryHover text-black text-body font-bold px-4 md:px-8 py-2.5 uppercase transition-all rounded-none inline-block">
                                                        {t("addressBook.addAddress")}
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

            <BusinessOverviewEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                initialData={businessOverview}
                onSuccess={fetchOverview}
            />
        </>
    );
}
