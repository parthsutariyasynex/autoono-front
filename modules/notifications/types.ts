export interface NotificationItem {
    notification_id: number;
    title: string;
    description: string;
    is_read: boolean;
    url: string;
    date_added: string;
    date_added_formatted: string;
}

export interface NotificationsResponse {
    items: NotificationItem[];
    total_count: number;
    unread_count: number;
}
