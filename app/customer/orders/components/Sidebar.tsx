"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { accountSidebarMenu } from "@/components/account-sidebar-menu";
import { useLocalePath } from "@/hooks/useLocalePath";

const Sidebar = () => {
    const pathname = usePathname();
    const lp = useLocalePath();

    return (
        <aside className="w-full md:w-[260px] flex-shrink-0 bg-[#f8f9fa] p-6 rounded-sm min-h-[600px]">
            <nav>
                <ul className="text-body-lg flex flex-col gap-1">
                    {accountSidebarMenu.map((item, idx) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                            <li key={idx}>
                                <Link
                                    href={lp(item.href)}
                                    className={`block py-3 px-3 transition-all duration-200 border-l-[3px] ${isActive
                                        ? "font-bold text-black border-primary bg-white shadow-sm"
                                        : "text-black/70 border-transparent hover:text-black hover:border-gray-200"
                                        }`}
                                >
                                    {item.name}
                                </Link>
                            </li>
                        );
                    })}
                    <li>
                        <button
                            onClick={() => signOut({ callbackUrl: `${window.location.origin}${lp("/login")}` })}
                            className="block w-full text-left py-3 px-3 text-black/70 border-l-[3px] border-transparent hover:text-black hover:border-gray-200 transition-all duration-200"
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
