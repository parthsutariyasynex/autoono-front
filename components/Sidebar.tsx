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
        <aside className="w-full lg:w-64 flex-shrink-0 bg-[#f8f8f8] p-0 lg:p-4 border-b lg:border-b-0 lg:border-r border-[#ebebeb] z-30 lg:sticky lg:top-[108px] lg:h-[calc(100vh-108px)] self-start overflow-y-auto custom-scrollbar">
            <nav className="overflow-x-auto lg:overflow-x-visible custom-scrollbar">


                <ul className="flex flex-row lg:flex-col space-y-0 lg:space-y-1">
                    {accountSidebarMenu
                        .filter(item => {
                            // Hide "Manage Accounts" for sub-account users
                            if (item.name === "Manage Accounts" && isSubAccount) {
                                return false;
                            }
                            return true;
                        })
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
                                        className={`block py-3 px-6 lg:px-4 transition-all duration-200 whitespace-nowrap ${isActive
                                            ? "font-bold text-black border-b-[3px] lg:border-b-0 lg:border-l-4 border-[#f5a623] bg-white shadow-sm"
                                            : "text-gray-600 hover:text-black hover:bg-gray-100 border-b-[3px] lg:border-b-0 lg:border-l-4 border-transparent"
                                            }`}
                                    >
                                        {t(item.nameKey)}
                                    </Link>
                                </li>
                            );
                        })}
                    <li className="flex-shrink-0">
                        <button
                            onClick={() => signOut({ callbackUrl: lp("/login") })}
                            className="block w-full text-left py-3 px-6 lg:px-4 text-gray-600 hover:text-black hover:bg-gray-100 transition-all duration-200 border-b-[3px] lg:border-b-0 lg:border-l-4 border-transparent whitespace-nowrap"
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
