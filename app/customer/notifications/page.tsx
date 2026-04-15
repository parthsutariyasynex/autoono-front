"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useNotifications } from "@/modules/notifications/hooks/useNotifications";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { accountSidebarMenu } from "@/components/account-sidebar-menu";
import { redirectToLogin } from "@/utils/helpers";
import PortalDropdown from "@/components/PortalDropdown";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocalePath } from "@/hooks/useLocalePath";
import { useLocale } from "@/lib/i18n/client";
import Sidebar from "@/components/Sidebar";

/**
 * Translate notification text from English to Arabic.
 * Handles patterns like:
 *   "New Order# BT00028701" → "طلب جديد رقم BT00028701"
 *   "New Order# BT00028701 placed successfully" → "تم عمل الطلب رقم BT00028701 بنجاح"
 */
function translateNotificationText(text: string, locale: string): string {
    if (locale !== "ar" || !text) return text;

    // "New Order# XXXXX placed successfully"
    const placedMatch = text.match(/^New Order#?\s*(BT\d+)\s*placed successfully$/i);
    if (placedMatch) return `تم عمل الطلب رقم ${placedMatch[1]} بنجاح`;

    // "New Order# XXXXX"
    const orderMatch = text.match(/^New Order#?\s*(BT\d+)$/i);
    if (orderMatch) return `طلب جديد رقم ${orderMatch[1]}`;

    // "Order# XXXXX has been shipped"
    const shippedMatch = text.match(/^Order#?\s*(BT\d+)\s*has been shipped$/i);
    if (shippedMatch) return `تم شحن الطلب رقم ${shippedMatch[1]}`;

    // "Order# XXXXX has been invoiced"
    const invoicedMatch = text.match(/^Order#?\s*(BT\d+)\s*has been invoiced$/i);
    if (invoicedMatch) return `تمت فوترة الطلب رقم ${invoicedMatch[1]}`;

    // "Order# XXXXX has been canceled"
    const canceledMatch = text.match(/^Order#?\s*(BT\d+)\s*has been cancel/i);
    if (canceledMatch) return `تم إلغاء الطلب رقم ${canceledMatch[1]}`;

    return text;
}

function formatDate(dateStr: string, locale: string): string {
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return new Intl.DateTimeFormat("en-US", {
            year: "numeric", month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit", hour12: true,
        }).format(date);
    } catch {
        return dateStr;
    }
}

export default function NotificationsPage() {
    const router = useRouter();
    const { t, isRtl } = useTranslation();
    const lp = useLocalePath();
    const locale = useLocale();
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
            redirectToLogin(router);
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
    };

    const handleLogout = async () => {
        await signOut({ callbackUrl: lp("/login") });
    };

    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const pageNumbers = Array.from({ length: Math.min(6, totalPages) }, (_, i) => i + 1);

    return (
        <>


            <div className="w-full px-3 md:px-8 lg:px-12 py-4 md:py-10">
                <div className="flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-10">
                    {/* SIDEBAR */}
                    <Sidebar />

                    {/* MAIN CONTENT */}
                    <main className="flex-1 min-w-0">
                        <h1 className="text-[20px] md:text-[26px] font-black text-black mb-6 md:mb-10 uppercase tracking-wide">
                            {t('notifications.title')}
                        </h1>

                        <div className="border border-[#ebebeb] rounded-sm overflow-hidden shadow-sm">
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse table-fixed min-w-[600px]">
                                    <thead>
                                        <tr className="border-b border-[#ebebeb]">
                                            <th className="px-6 py-4 text-[13px] font-black text-black uppercase text-center w-[15%] border-r border-[#ebebeb]">{t('common.date')}</th>
                                            <th className="px-6 py-4 text-[13px] font-black text-black uppercase text-center w-[20%] border-r border-[#ebebeb]">{t('m.title')}</th>
                                            <th className="px-6 py-4 text-[13px] font-black text-black uppercase text-center w-[45%] border-r border-[#ebebeb]">{t('m.message')}</th>
                                            <th className="px-6 py-4 text-[13px] font-black text-black uppercase text-center w-[20%]">{t('common.action')}</th>
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
                                                    className={`border-b border-[#ebebeb] last:border-0 transition-colors ${!item.is_read ? "bg-[#fcf8ec]" : "bg-white"}`}
                                                >
                                                    <td className="px-6 py-6 text-[14px] text-[#333333] text-center border-r border-[#ebebeb] align-middle relative">
                                                        {!item.is_read && (
                                                            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#f5af02] rounded-full shadow-sm"></div>
                                                        )}
                                                        {formatDate(item.date_added_formatted, locale)}
                                                    </td>
                                                    <td className={`px-6 py-6 text-[14px] text-center border-r border-[#ebebeb] align-middle ${!item.is_read ? "font-bold text-black" : "font-normal text-[#666666]"}`}>
                                                        {translateNotificationText(item.title, locale)}
                                                    </td>
                                                    <td className={`px-6 py-6 text-[14px] text-center border-r border-[#ebebeb] leading-relaxed align-middle ${!item.is_read ? "font-medium text-black" : "text-[#666666]"}`}>
                                                        {translateNotificationText(item.description, locale)}
                                                    </td>
                                                    <td className="px-6 py-6 text-[13px] text-center align-middle">
                                                        <div className="flex items-center justify-center gap-2 whitespace-nowrap text-[#333333]">
                                                            {!item.is_read && (
                                                                <>
                                                                    <button onClick={(e) => { e.stopPropagation(); markAsRead(item.notification_id); }} className="hover:text-[#f5af02] transition-colors font-bold">{t('m.mark-as-read')}</button>
                                                                    <span className="text-[#cccccc]">|</span>
                                                                </>
                                                            )}
                                                            <button onClick={(e) => { e.stopPropagation(); removeNotification(item.notification_id, item.is_read); }} disabled={deletingIds.includes(item.notification_id)} className="hover:text-[#f5af02] cursor-pointer transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                                                                {deletingIds.includes(item.notification_id) ? t('common.loading') : t('m.remove')}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="py-24 text-center text-gray-500 text-[14px]">{t('notifications.empty')}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card List */}
                            <div className="md:hidden">
                                {isLoading ? (
                                    <div className="py-16 text-center">
                                        <div className="inline-block w-8 h-8 border-3 border-[#f5b21a] border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : notifications && notifications.length > 0 ? (
                                    notifications.map((item, index) => (
                                        <div
                                            key={`mobile-${item.notification_id || index}-${index}`}
                                            className={`p-4 border-b border-[#ebebeb] last:border-0 transition-colors ${!item.is_read ? "bg-[#fcf8ec]" : "bg-white"}`}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    {!item.is_read && <div className="w-2 h-2 bg-[#f5af02] rounded-full flex-shrink-0 mt-1"></div>}
                                                    <span className={`text-[13px] ${!item.is_read ? "font-bold text-black" : "font-normal text-[#666666]"}`}>{translateNotificationText(item.title, locale)}</span>
                                                </div>
                                                <span className="text-[11px] text-gray-400 flex-shrink-0">{formatDate(item.date_added_formatted, locale)}</span>
                                            </div>
                                            <p className={`text-[12px] leading-relaxed mb-3 ${!item.is_read ? "font-medium text-black" : "text-[#666666]"}`}>
                                                {translateNotificationText(item.description, locale)}
                                            </p>
                                            <div className="flex items-center gap-3 text-[11px] font-bold text-[#333333]">
                                                {!item.is_read && (
                                                    <>
                                                        <button onClick={(e) => { e.stopPropagation(); markAsRead(item.notification_id); }} className="hover:text-[#f5af02] transition-colors">{t('m.mark-as-read')}</button>
                                                        <span className="text-[#cccccc]">|</span>
                                                    </>
                                                )}
                                                <button onClick={(e) => { e.stopPropagation(); removeNotification(item.notification_id, item.is_read); }} disabled={deletingIds.includes(item.notification_id)} className="hover:text-[#f5af02] transition-colors disabled:opacity-50">
                                                    {deletingIds.includes(item.notification_id) ? t('common.loading') : t('m.remove')}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-16 text-center text-gray-500 text-[13px]">{t('notifications.empty')}</div>
                                )}
                            </div>

                            {/* PAGINATION PANEL */}
                            <div className="bg-[#e8e8e8] px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6 border-t border-[#dddddd]">
                                <div className="text-[13px] text-[#333333] font-medium order-2 lg:order-1">
                                    {t('favorites.items')} {((currentPage - 1) * pageSize) + 1} {t('m.to')} {Math.min(currentPage * pageSize, totalCount)} {t('favorites.of')} {totalCount} {t('favorites.total')}
                                </div>

                                <div className="flex items-center gap-3 order-1 lg:order-2">
                                    {currentPage > 1 && (
                                        <button
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            className="w-10 h-10 flex items-center justify-center text-[#666666] hover:text-black hover:bg-white/50 rounded-full transition-all border border-transparent hover:border-[#cccccc]"
                                        >
                                            {isRtl ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
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
                                            {isRtl ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 text-[13px] text-[#333333] font-medium order-3">
                                    <span>{t('favorites.show')}</span>
                                    <PortalDropdown
                                        value={String(pageSize)}
                                        onChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }}
                                        options={[{ label: "15", value: "15" }, { label: "30", value: "30" }, { label: "50", value: "50" }]}
                                    />
                                    <span>{t('common.perPage')}</span>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

        </>
    );
}
