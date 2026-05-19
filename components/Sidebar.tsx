"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocalePath } from "@/hooks/useLocalePath";
import { api } from "@/lib/api/api-client";
import { Loader2 } from "lucide-react";

interface SidebarItem {
    label: string;
    url: string;
    code: string;
    is_visible: boolean;
    sort_order: number;
}

interface SidebarResponse {
    user_type: string;
    items: SidebarItem[];
}

const Sidebar = () => {
    const pathname = usePathname();
    const { t } = useTranslation();
    const lp = useLocalePath();

    const [sidebarData, setSidebarData] = useState<SidebarResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubAccountSession, setIsSubAccountSession] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setIsSubAccountSession(localStorage.getItem("isSubAccount") === "true");
        }
    }, [pathname]);

    useEffect(() => {
        let isMounted = true;
        const fetchSidebar = async () => {
            try {
                setLoading(true);
                const data = await api.get("/kleverapi/account-sidebar");
                if (isMounted) {
                    setSidebarData(data);
                    setError(null);
                }
            } catch (err: any) {
                console.error("[Sidebar] Fetch error:", err);
                if (isMounted) setError(err.message || "Failed to load sidebar");
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchSidebar();
        return () => { isMounted = false; };
    }, []);

    // Build a locale-prefixed internal path from a raw Magento sidebar URL.
    // We strip the store-code/locale prefix and .html suffix so the path passes
    // cleanly through the middleware (CMS_SLUG_TO_ROUTE + APP_ROUTES handle routing).
    const getInternalPath = (rawUrl: string) => {
        let href = rawUrl || "#";
        try {
            if (href.startsWith("http")) {
                const u = new URL(href);
                href = u.pathname + u.search;
            }
        } catch { }

        // Strip store-code prefix (e.g. /V101_en/) or locale prefix (e.g. /en/)
        href = href
            .replace(/^\/[A-Za-z0-9_]+_(en|ar)\//, "/")
            .replace(/^\/(en|ar)\//, "/");

        // Strip Magento .html SEO suffix — sidebar links are always internal routes
        href = href.replace(/\.html$/, "");
        href = href.replace(/\/$/, "");

        // Map Magento native routes to Next.js frontend routes
        if (href === "/customer/address") href = "/customer/address-book";
        if (href === "/sales/order/history") href = "/my-orders";
        if (href === "/wishlist") href = "/wishlist";
        if (href === "/customer/account") href = "/my-account";

        return lp(href);
    };

    const getTranslatedLabel = (item: SidebarItem) => {
        const code = (item.code || "").toLowerCase();
        const label = (item.label || "").toLowerCase();

        if (code === "my_account" || code === "account" || label.includes("account")) {
            return t("sidebar.myAccount") || item.label;
        }
        if (code === "my_statement" || code === "statement" || code === "mystatement" || label.includes("statement")) {
            return t("sidebar.myStatement") || item.label;
        }
        if (code === "manage_accounts" || label.includes("manage accounts") || label.includes("manage_accounts")) {
            return t("sidebar.manageAccounts") || item.label;
        }
        if (code === "my_orders" || code === "orders" || code === "history" || label.includes("orders")) {
            return t("sidebar.myOrders") || item.label;
        }
        if (code === "my_order_attachments" || code === "order_attachments" || code === "orderupload" || label.includes("attachment")) {
            return t("sidebar.myOrderAttachments") || item.label;
        }
        if (code === "favourite_products" || code === "favorite_products" || code === "favorites" || code === "wishlist" || label.includes("favorite") || label.includes("favourite")) {
            return t("sidebar.favoriteProducts") || item.label;
        }
        if (code === "address_book" || code === "address" || label.includes("address")) {
            return t("sidebar.addressBook") || item.label;
        }
        if (code === "dashboard" || label.includes("dashboard")) {
            return t("sidebar.dashboard") || item.label;
        }
        if (code === "my_forecast" || code === "forecast" || code === "viewforcast" || label.includes("forecast") || label.includes("forcast")) {
            return t("sidebar.myForecast") || item.label;
        }
        if (code === "notifications" || code === "usernotifications" || label.includes("notification")) {
            return t("sidebar.notifications") || item.label;
        }
        if (code === "sign_out" || code === "logout" || code === "customer_logout" || label.includes("sign out") || label.includes("logout")) {
            return t("nav.signOut") || item.label;
        }

        const key = `sidebar.${item.code}`;
        const translated = t(key);
        if (translated !== key) return translated;

        return item.label;
    };

    const visibleItems = useMemo(() => {
        if (!sidebarData?.items) return [];

        return sidebarData.items
            .filter((item) => {
                // 1. Check Magento's visibility flag
                if (!item.is_visible) return false;

                // 2. Custom permission checks based on session or user type
                const itemCode = item.code.toLowerCase();

                // If logged in AS a sub-account, hide Management tools
                if (isSubAccountSession || sidebarData.user_type === "subaccount") {
                    if (itemCode === "manage_accounts" || itemCode === "subaccounts" || itemCode === "manage_subaccounts") {
                        return false;
                    }
                }

                return true;
            })
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            .map(item => ({
                ...item,
                internalUrl: getInternalPath(item.url)
            }));
    }, [sidebarData, lp, isSubAccountSession]);

    // Active item detection
    const activeCode = useMemo(() => {
        const normalizedPathname = pathname.replace(/\/$/, "");

        // 1. Direct code overrides for common sections to guarantee 100% perfect matching
        if (normalizedPathname.includes("/address")) return "address_book";

        // Match "My Orders" but prevent it from matching "My Order Attachments" (/orderupload or /order-attachments)
        if (
            (normalizedPathname.includes("/order") || normalizedPathname.includes("/my-orders") || normalizedPathname.includes("/sales/order")) &&
            !normalizedPathname.includes("orderupload") &&
            !normalizedPathname.includes("order-attachment")
        ) {
            return "my_orders";
        }

        if (normalizedPathname.includes("/statement")) return "statement";
        if (normalizedPathname.includes("/favorite") || normalizedPathname.includes("/favourite") || normalizedPathname.includes("/wishlist")) return "favourite_products";
        if (normalizedPathname.includes("/dashboard")) return "dashboard";
        if (normalizedPathname.includes("/notification")) return "notifications";
        if (normalizedPathname.includes("/my-account") || normalizedPathname.includes("/customer/account")) return "my_account";

        let bestCode = "";
        let bestMatchLength = -1;

        visibleItems.forEach((item) => {
            const isSignOut = item.code === "sign_out" || item.code === "logout" || item.code === "customer_logout";
            if (isSignOut) return;

            const itemPath = item.internalUrl.split("?")[0].replace(/\/$/, "");

            if (normalizedPathname === itemPath) {
                bestCode = item.code;
                bestMatchLength = 9999;
            } else if (
                itemPath !== "" &&
                normalizedPathname.startsWith(itemPath + "/") &&
                bestMatchLength < 9999 &&
                itemPath.length > bestMatchLength
            ) {
                bestCode = item.code;
                bestMatchLength = itemPath.length;
            }
        });
        return bestCode;
    }, [pathname, visibleItems]);

    if (loading) {
        return (
            <aside className="w-full lg:w-64 flex-shrink-0 bg-surfaceMuted border-b lg:border-b-0 ltr:lg:border-r rtl:lg:border-l border-gray-200 z-30 sticky top-[56px] sm:top-[64px] lg:top-[108px] h-auto lg:h-[calc(100vh-108px)] flex flex-col items-center justify-center p-10">
                {/* <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" /> */}
                <span className="text-micro text-black/40 font-bold uppercase tracking-widest">{t("common.loading") || "Loading..."}</span>
            </aside>
        );
    }

    if (error || !visibleItems.length) {
        return (
            <aside className="w-full lg:w-64 flex-shrink-0 bg-surfaceMuted border-b lg:border-b-0 ltr:lg:border-r rtl:lg:border-l border-gray-200 z-30 sticky top-[56px] sm:top-[64px] lg:top-[108px] h-auto lg:h-[calc(100vh-108px)] p-4">
                <p className="text-body text-black/50 italic text-center py-10">
                    {t("sidebar.error") || "Account menu currently unavailable."}
                </p>
            </aside>
        );
    }

    return (
        <aside className="w-full lg:w-64 flex-shrink-0 bg-surfaceMuted border-b lg:border-b-0 ltr:lg:border-r rtl:lg:border-l border-gray-200 z-30 sticky top-[56px] sm:top-[64px] lg:top-[108px] h-auto lg:h-[calc(100vh-108px)] overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto custom-scrollbar">
            <nav className="p-0 lg:p-4">
                <ul className="flex flex-row lg:flex-col space-y-0 lg:space-y-1">
                    {visibleItems.map((item) => {
                        const isSignOut =
                            item.code === "sign_out" ||
                            item.code === "logout" ||
                            item.code === "customer_logout";

                        const isActive = item.code === activeCode;

                        if (isSignOut) {
                            return (
                                <li key={item.code} className="flex-shrink-0">
                                    <button
                                        onClick={() =>
                                            signOut({ callbackUrl: `${window.location.origin}${lp("/login")}` })
                                        }
                                        className="block w-full ltr:text-left rtl:text-right py-3 px-6 lg:px-4 text-black/70 hover:text-black hover:bg-gray-100 transition-all duration-200 border-b-[3px] lg:border-b-0 ltr:lg:border-l-4 rtl:lg:border-r-4 border-transparent whitespace-nowrap font-bold uppercase text-body-sm"
                                    >
                                        {getTranslatedLabel(item)}
                                    </button>
                                </li>
                            );
                        }

                        return (
                            <li key={item.code} className="flex-shrink-0">
                                <Link
                                    href={item.internalUrl}
                                    className={`block py-3 px-6 lg:px-4 transition-all duration-200 whitespace-nowrap ltr:text-left rtl:text-right font-bold uppercase text-body-sm ${isActive
                                        ? "text-black border-b-[3px] lg:border-b-0 ltr:lg:border-l-4 rtl:lg:border-r-4 border-primary bg-white shadow-sm"
                                        : "text-black/70 hover:text-black hover:bg-gray-100 border-b-[3px] lg:border-b-0 ltr:lg:border-l-4 rtl:lg:border-r-4 border-transparent"
                                        }`}
                                >
                                    {getTranslatedLabel(item)}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;
