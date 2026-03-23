"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNotifications } from "@/modules/notifications/hooks/useNotifications";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface NotificationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
    const {
        notifications,
        unreadCount,
        isLoading,
        deletingIds,
        fetchNotifications,
        markAsRead,
        removeNotification
    } = useNotifications();

    const [isAnimating, setIsAnimating] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            fetchNotifications();
        } else {
            const timer = setTimeout(() => setIsAnimating(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, fetchNotifications]);

    if (!isOpen && !isAnimating) return null;

    const handleNotificationClick = async (notification: any) => {
        if (!notification.is_read) {
            await markAsRead(notification.notification_id);
        }
        onClose();
        if (notification.url) {
            router.push(notification.url);
        }
    };

    return (
        <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            {/* Overlay - allows clicking outside to close */}
            <div
                className="absolute inset-0 bg-black/10 backdrop-blur-[1px]"
                onClick={onClose}
            />

            {/* Popup Panel - Smaller Dropdown Style */}
            <div
                className={`absolute right-4 top-20 w-[330px] bg-white rounded-lg shadow-2xl flex flex-col transition-all duration-300 ease-in-out transform ${isOpen
                    ? "translate-y-0 opacity-100 scale-100"
                    : "-translate-y-4 opacity-0 scale-95 pointer-events-none"
                    } overflow-hidden max-h-[500px] border border-gray-100`}
            >
                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                    {isLoading && notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-3">
                            <div className="w-8 h-8 border-3 border-[#f5b21a] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-xs text-gray-400 font-medium tracking-wide">Fetching updates...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-12 px-6">
                            <p className="text-gray-500 font-bold text-sm">No new notifications</p>
                            <p className="text-[11px] text-gray-400 mt-1 uppercase font-bold tracking-widest">Everything is up to date</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications.map((item, index) => (
                                <div
                                    key={`${item.notification_id || index}-${index}`}
                                    className={`p-4 flex flex-col gap-0.5 transition-colors relative ${!item.is_read ? "bg-[#fcf8ec]" : "bg-white"
                                        }`}
                                    onClick={() => handleNotificationClick(item)}
                                >
                                    {/* Header Row: Title & Remove */}
                                    <div className="flex justify-between items-start gap-4">
                                        <h3 className={`text-[14px] leading-snug pr-4 transition-colors hover:text-[#f5b21a] ${!item.is_read ? "font-extrabold text-black" : "font-semibold text-gray-700"
                                            }`}>
                                            {item.title}
                                        </h3>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent parent handleNotificationClick from triggering
                                                removeNotification(item.notification_id, item.is_read);
                                            }}
                                            disabled={deletingIds.includes(item.notification_id)}
                                            className="w-5 h-5 flex items-center justify-center bg-[#f1f1f1] hover:bg-[#f5b21a] hover:text-white text-gray-500 rounded-full transition-colors cursor-pointer flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label="Remove notification"
                                        >
                                            {deletingIds.includes(item.notification_id) ? (
                                                <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <X size={10} strokeWidth={3} />
                                            )}
                                        </button>
                                    </div>

                                    {/* Message */}
                                    <p className={`text-[13px] leading-normal ${!item.is_read ? "text-black font-medium" : "text-gray-500"
                                        }`}>
                                        {item.description}
                                    </p>

                                    {/* Footer: Date & Mark as Read */}
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-[11px] text-gray-400 font-medium tracking-tight">
                                            {item.date_added_formatted}
                                        </p>

                                        {!item.is_read && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead(item.notification_id);
                                                }}
                                                className="text-[11px] text-gray-400 hover:text-[#f5b21a] font-bold py-1 px-2 -mr-2 bg-transparent cursor-pointer transition-all"
                                            >
                                                Mark as Read
                                            </button>
                                        )}
                                    </div>

                                    {/* Unread Indicator Dot */}
                                    {!item.is_read && (
                                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#f5b21a] rounded-full"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Section */}
                <div className="bg-white border-t border-gray-100 sticky bottom-0">
                    <Link
                        href="/customer/notifications"
                        onClick={onClose}
                        className="w-full h-[60px] flex items-center justify-center text-[17px] font-black text-black hover:bg-gray-50 transition-colors tracking-tight"
                    >
                        See All ({unreadCount} unread)
                    </Link>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #eee;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #ddd;
                }
            `}</style>
        </div>
    );
}

function BellIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" />
        </svg>
    )
}
