"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { NotificationsResponse, NotificationItem } from "../types";
import toast from "react-hot-toast";
import { useTranslation } from "@/hooks/useTranslation";

export function useNotifications() {
    const { data: session } = useSession();
    const { t, isRtl } = useTranslation();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [deletingIds, setDeletingIds] = useState<number[]>([]);

    const fetchNotifications = useCallback(async (pageSize = 15, currentPage = 1) => {
        const token = (session as any)?.accessToken;
        if (!token) return;

        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/kleverapi/notifications?pageSize=${pageSize}&currentPage=${currentPage}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                console.warn("[useNotifications] Received 401, signing out...");
                const { signOut } = await import("next-auth/react");
                const locale = typeof window !== "undefined" && window.location.pathname.startsWith("/ar") ? "ar" : "en";
                await signOut({ redirect: false });
                window.location.href = `/${locale}/login`;
                return;
            }

            if (!response.ok) {
                // Backend down or server error — fail silently
                return;
            }

            const data: any = await response.json();

            // Robustly check for the list of notifications
            const items = Array.isArray(data) ? data
                : data.items || data.notifications || data.data || [];
            // Normalize items to ensure notification_id and is_read are always present
            const normalizedItems = items.map((item: any) => ({
                ...item,
                notification_id: item.notification_id ?? item.id ?? item.entity_id,
                is_read: !!(item.is_read ?? item.isRead ?? false)
            }));

            setNotifications(normalizedItems);
            setUnreadCount(data.unread_count ?? data.unreadCount ?? 0);
            setTotalCount(data.total_count ?? data.totalCount ?? normalizedItems.length);
        } catch {
            // Network error or backend unreachable — fail silently
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    const markAsRead = useCallback(async (notificationId: number) => {
        const token = (session as any)?.accessToken;
        if (!token) return false;

        try {
            const response = await fetch(`/api/kleverapi/notifications/${notificationId}/read`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const resData = await response.json().catch(() => null);
            console.log("[markAsRead] ID:", notificationId, "Status:", response.status, "Response:", resData);

            if (response.ok) {
                // Update local state and decrease unread count in one pass
                setNotifications(prev => {
                    const item = prev.find(i => i.notification_id === notificationId);
                    if (item && !item.is_read) {
                        setUnreadCount(count => Math.max(0, count - 1));
                    }
                    return prev.map(item =>
                        item.notification_id === notificationId
                            ? { ...item, is_read: true }
                            : item
                    );
                });

                // Sync navbar bell icon
                window.dispatchEvent(new CustomEvent("notifications-updated"));
                // Prefer the translated string in AR mode; the backend
                // message comes back in English regardless of locale.
                toast.success(isRtl ? t("notifications.markedAsRead") : (resData?.message || t("notifications.markedAsRead")));
                return true;
            } else {
                console.warn("[markAsRead] Failed for ID:", notificationId, resData);
                toast.error(isRtl ? t("notifications.markReadFailed") : (resData?.message || t("notifications.markReadFailed")));
            }
        } catch (err) {
            console.error("Error marking notification as read:", err);
            toast.error(t("notifications.errorOccurred"));
        }
        return false;
    }, [session, t, isRtl]);

    const removeNotification = useCallback(async (notificationId: number, isRead: boolean) => {
        const token = (session as any)?.accessToken;
        if (!token) return;

        setDeletingIds(prev => [...prev, notificationId]);

        try {
            // Mark as read first if it's currently unread (backend might require it)
            if (!isRead) {
                await markAsRead(notificationId);
            }

            // Call the remove API on the server
            const response = await fetch(`/api/kleverapi/notifications/${notificationId}/remove`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const resData = await response.json().catch(() => null);
            console.log("[removeNotification] ID:", notificationId, "Status:", response.status, "Response:", resData);

            if (response.ok) {
                // Immediately remove from UI
                setNotifications(prev => prev.filter(item => item.notification_id !== notificationId));
                setTotalCount(count => Math.max(0, count - 1));

                // Sync navbar bell icon
                window.dispatchEvent(new CustomEvent("notifications-updated"));
                toast.success(isRtl ? t("notifications.deleted") : (resData?.message || t("notifications.deleted")));
            } else {
                console.warn("Server-side removal failed for notification:", notificationId, resData);
                toast.error(isRtl ? t("notifications.deleteFailed") : (resData?.message || t("notifications.deleteFailed")));
            }
        } catch (err) {
            console.error("Error removing notification:", err);
            toast.error(t("notifications.errorDuringDeletion"));
        } finally {
            setDeletingIds(prev => prev.filter(id => id !== notificationId));
        }
    }, [session, markAsRead, t, isRtl]);

    return {
        notifications,
        unreadCount,
        totalCount,
        isLoading,
        error,
        deletingIds,
        fetchNotifications,
        markAsRead,
        removeNotification
    };
}
