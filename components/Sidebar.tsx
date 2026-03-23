"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { accountSidebarMenu } from "./account-sidebar-menu";
import { useState, useEffect } from "react";

const Sidebar = () => {
    const pathname = usePathname();
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
        <aside className="w-full md:w-64 flex-shrink-0 bg-[#f8f8f8] p-4 min-h-screen">
            <nav>
                <ul className="space-y-1">
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
                            const href = (item.name === "My Account" && isSubAccount)
                                ? "/subaccount/my-account"
                                : item.href;
                            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                            return (
                                <li key={idx}>
                                    <Link
                                        href={href}
                                        className={`block py-3 px-4 transition-all duration-200 ${isActive
                                            ? "font-bold text-black border-l-4 border-[#f5a623] bg-white shadow-sm"
                                            : "text-gray-600 hover:text-black hover:bg-gray-100"
                                            }`}
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            );
                        })}
                    <li>
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="block w-full text-left py-3 px-4 text-gray-600 hover:text-black hover:bg-gray-100 transition-all duration-200"
                        >
                            Sign Out
                        </button>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;
