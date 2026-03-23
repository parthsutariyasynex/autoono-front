"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Navbar from "@/app/components/Navbar";
import { useNotifications } from "@/modules/notifications/hooks/useNotifications";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { accountSidebarMenu } from "@/components/account-sidebar-menu";

export default function NotificationsPage() {
    const router = useRouter();
    const { status } = useSession();
    const {
        notifications,
        isLoading,
        fetchNotifications,
        markAsRead,
        removeNotification,
        totalCount,
        deletingIds
    } = useNotifications();

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/login");
            return;
        }
        if (status === "authenticated") {
            fetchNotifications(pageSize, currentPage);
        }
    }, [status, router, fetchNotifications, pageSize, currentPage]);

    const handleNotificationClick = async (item: any) => {
        if (!item.is_read) {
            await markAsRead(item.notification_id);
        }
        if (item.url) {
            router.push(item.url);
        }
    };

    const handleLogout = async () => {
        await signOut({ callbackUrl: "/login" });
    };

    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const pageNumbers = Array.from({ length: Math.min(6, totalPages) }, (_, i) => i + 1);

    return (
        <div className="min-h-screen bg-white font-['Rubik',sans-serif]">
            <Navbar />

            <div className="w-full px-4 md:px-8 lg:px-12 py-10">
                <div className="flex flex-col md:flex-row gap-6 lg:gap-10">
                    {/* SIDEBAR */}
                    <aside className="w-full md:w-[280px] flex-shrink-0">
                        <nav className="bg-[#f0f0f0] border border-[#dddddd] rounded-sm">
                            <ul className="text-[14px] text-[#333333]">
                                {accountSidebarMenu.map((item, idx) => (
                                    <li key={idx}>
                                        <Link
                                            href={item.href}
                                            className={`block px-6 py-4 transition-colors ${item.href === "/customer/notifications"
                                                ? "bg-white font-bold border-l-4 border-[#f5af02]"
                                                : "hover:bg-[#e8e8e8] border-l-4 border-transparent"
                                                }`}
                                        >
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                                <li>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-6 py-4 text-[#333333] hover:bg-[#e8e8e8] transition-colors font-medium border-l-4 border-transparent"
                                    >
                                        Sign Out
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </aside>

                    {/* MAIN CONTENT */}
                    <main className="flex-1 min-w-0">
                        <h1 className="text-[26px] font-black text-black mb-10 uppercase tracking-wide">
                            NOTIFICATIONS
                        </h1>

                        <div className="border border-[#ebebeb] rounded-sm overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse table-fixed">
                                    <thead>
                                        <tr className="border-b border-[#ebebeb]">
                                            <th className="px-6 py-4 text-[13px] font-black text-black uppercase text-center w-[15%] border-r border-[#ebebeb]">Date</th>
                                            <th className="px-6 py-4 text-[13px] font-black text-black uppercase text-center w-[20%] border-r border-[#ebebeb]">Title</th>
                                            <th className="px-6 py-4 text-[13px] font-black text-black uppercase text-center w-[45%] border-r border-[#ebebeb]">Message</th>
                                            <th className="px-6 py-4 text-[13px] font-black text-black uppercase text-center w-[20%]">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan={4} className="py-24 text-center">
                                                    <div className="inline-block w-8 h-8 border-3 border-[#f5b21a] border-t-transparent rounded-full animate-spin"></div>
                                                </td>
                                            </tr>
                                        ) : notifications && notifications.length > 0 ? (
                                            notifications.map((item, index) => (
                                                <tr
                                                    key={`${item.notification_id || index}-${index}`}
                                                    onClick={() => handleNotificationClick(item)}
                                                    className={`border-b border-[#ebebeb] last:border-0 transition-colors cursor-pointer ${!item.is_read ? "bg-[#fcf8ec]" : "bg-white"
                                                        }`}
                                                >
                                                    <td className="px-6 py-6 text-[14px] text-[#333333] text-center border-r border-[#ebebeb] align-middle relative">
                                                        {!item.is_read && (
                                                            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#f5af02] rounded-full shadow-sm"></div>
                                                        )}
                                                        {item.date_added_formatted}
                                                    </td>
                                                    <td className={`px-6 py-6 text-[14px] text-center border-r border-[#ebebeb] hover:text-[#f5af02] transition-colors align-middle ${!item.is_read ? "font-bold text-black" : "font-normal text-[#666666]"
                                                        }`}>
                                                        {item.title}
                                                    </td>
                                                    <td className={`px-6 py-6 text-[14px] text-center border-r border-[#ebebeb] leading-relaxed align-middle ${!item.is_read ? "font-medium text-black" : "text-[#666666]"
                                                        }`}>
                                                        {item.description}
                                                    </td>
                                                    <td className="px-6 py-6 text-[13px] text-center align-middle">
                                                        <div className="flex items-center justify-center gap-2 whitespace-nowrap text-[#333333]">
                                                            {!item.is_read && (
                                                                <>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            markAsRead(item.notification_id);
                                                                        }}
                                                                        className="hover:text-[#f5af02] cursor-pointer transition-colors font-bold"
                                                                    >
                                                                        Mark as Read
                                                                    </button>
                                                                    <span className="text-[#cccccc]">|</span>
                                                                </>
                                                            )}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeNotification(item.notification_id, item.is_read);
                                                                }}
                                                                disabled={deletingIds.includes(item.notification_id)}
                                                                className="hover:text-[#f5af02] cursor-pointer transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                {deletingIds.includes(item.notification_id) ? "Deleting..." : "Remove"}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="py-24 text-center text-gray-500 text-[14px]">
                                                    You have no notifications.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* PAGINATION PANEL */}
                            <div className="bg-[#e8e8e8] px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-6 border-t border-[#dddddd]">
                                <div className="text-[13px] text-[#333333] font-medium order-2 lg:order-1">
                                    Items {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} total
                                </div>

                                <div className="flex items-center gap-3 order-1 lg:order-2">
                                    {currentPage > 1 && (
                                        <button
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            className="w-10 h-10 flex items-center justify-center text-[#666666] hover:text-black hover:bg-white/50 rounded-full transition-all border border-transparent hover:border-[#cccccc]"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                    )}
                                    <div className="flex gap-2">
                                        {pageNumbers.map((num) => (
                                            <button
                                                key={num}
                                                onClick={() => setCurrentPage(num)}
                                                className={`w-10 h-10 flex items-center justify-center text-[14px] font-bold rounded-full border transition-all ${currentPage === num
                                                    ? "bg-[#f5af02] border-[#f5af02] text-white shadow-md transform scale-105"
                                                    : "bg-white border-[#cccccc] text-[#333333] hover:border-[#f5af02] hover:text-[#f5af02]"
                                                    }`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                    {currentPage < totalPages && (
                                        <button
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            className="w-10 h-10 flex items-center justify-center text-[#666666] hover:text-black hover:bg-white/50 rounded-full transition-all border border-transparent hover:border-[#cccccc]"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 text-[13px] text-[#333333] font-medium order-3">
                                    <span>Show</span>
                                    <div className="relative">
                                        <select
                                            value={pageSize}
                                            onChange={(e) => {
                                                setPageSize(Number(e.target.value));
                                                setCurrentPage(1);
                                            }}
                                            className="appearance-none bg-white border border-[#cccccc] rounded-sm pl-4 pr-10 py-2 focus:outline-none focus:border-[#999999] hover:border-[#999999] transition-colors cursor-pointer"
                                        >
                                            <option value={15}>15</option>
                                            <option value={30}>30</option>
                                            <option value={50}>50</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#666666]">
                                            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                                                <path d="M5 7.5L0 2.5H10L5 7.5Z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <span>per page</span>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            <style jsx>{`
                @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700;900&display=swap');
                
                table { border-spacing: 0; }
                tr:last-child td { border-bottom: 0; }
                
                aside nav {
                    min-height: 400px;
                }
            `}</style>
        </div>
    );
}
