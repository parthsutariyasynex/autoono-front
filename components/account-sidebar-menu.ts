"use client";

export type AccountSidebarItem = {
    name: string;
    nameKey: string;
    href: string;
};

export const accountSidebarMenu: AccountSidebarItem[] = [
    { name: "My Account", nameKey: "sidebar.myAccount", href: "/my-account" },
    { name: "My Statement", nameKey: "sidebar.myStatement", href: "/customer/statement" },
    { name: "My Orders", nameKey: "sidebar.myOrders", href: "/my-orders" },
    { name: "My Order Attachments", nameKey: "sidebar.myOrderAttachments", href: "/customer/order-attachments" },
    { name: "Favorite Products", nameKey: "sidebar.favoriteProducts", href: "/favorites" },
    { name: "Address Book", nameKey: "sidebar.addressBook", href: "/customer/address-book" },
    { name: "Dashboard", nameKey: "sidebar.dashboard", href: "/customer/dashboard" },
    { name: "Notifications", nameKey: "sidebar.notifications", href: "/customer/notifications" },
];
