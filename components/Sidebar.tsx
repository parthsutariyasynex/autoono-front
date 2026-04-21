"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { accountSidebarMenu } from "./account-sidebar-menu";
import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocalePath } from "@/hooks/useLocalePath";

const Sidebar = () => {
    const pathname = usePathname();
    const { t } = useTranslation();
    const lp = useLocalePath();
    const { data: session } = useSession();
    const { data: customerData } = useSelector((state: RootState) => state.customer);
    const [isSubAccountLocal, setIsSubAccountLocal] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setIsSubAccountLocal(localStorage.getItem("isSubAccount") === "true");
        }
    }, [pathname]);

    const isSubAccount = isSubAccountLocal ||
        (customerData as any)?.custom_attributes?.find((a: any) => a.attribute_code === "is_sub_account")?.value === "1" ||
        (customerData as any)?.extension_attributes?.is_sub_account ||
        (session as any)?.user?.is_sub_account;

    return (
        <aside className="w-full lg:w-64 flex-shrink-0 bg-[#f8f8f8] border-b lg:border-b-0 ltr:lg:border-r rtl:lg:border-l border-[#ebebeb] z-30 sticky top-[56px] sm:top-[64px] lg:top-[108px] h-auto lg:h-[calc(100vh-108px)] overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto custom-scrollbar">
            <nav className="p-0 lg:p-4">

                <ul className="flex flex-row lg:flex-col space-y-0 lg:space-y-1">
                    {accountSidebarMenu
                        .map((item, idx) => {
                            // Redirect "My Account" to sub-account page when logged in as sub-account
                            const href = lp((item.name === "My Account" && isSubAccount)
                                ? "/subaccount/my-account"
                                : item.href);
                            const isActive = pathname === href || (href !== lp("/") && pathname.startsWith(href));
                            return (
                                <li key={idx} className="flex-shrink-0">
                                    <Link
                                        href={href}
                                        className={`block py-3 px-6 lg:px-4 transition-all duration-200 whitespace-nowrap ltr:text-left rtl:text-right ${isActive
                                            ? "font-bold text-black border-b-[3px] lg:border-b-0 ltr:lg:border-l-4 rtl:lg:border-r-4 border-primary bg-white shadow-sm"
                                            : "text-gray-600 hover:text-black hover:bg-gray-100 border-b-[3px] lg:border-b-0 ltr:lg:border-l-4 rtl:lg:border-r-4 border-transparent"
                                            }`}
                                    >
                                        {t(item.nameKey)}
                                    </Link>
                                </li>
                            );
                        })}
                    <li className="flex-shrink-0">
                        <button
                            onClick={() => signOut({ callbackUrl: `${window.location.origin}${lp("/login")}` })}
                            className="block w-full ltr:text-left rtl:text-right py-3 px-6 lg:px-4 text-gray-600 hover:text-black hover:bg-gray-100 transition-all duration-200 border-b-[3px] lg:border-b-0 ltr:lg:border-l-4 rtl:lg:border-r-4 border-transparent whitespace-nowrap"
                        >
                            {t("nav.signOut")}
                        </button>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;
