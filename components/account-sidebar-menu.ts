"use client";

export type AccountSidebarItem = {
    name: string;
    href: string;
};

export const accountSidebarMenu: AccountSidebarItem[] = [
    { name: "My Account", href: "/my-account" },
    { name: "My Statement", href: "/customer/statement" },
    { name: "Manage Accounts", href: "/customer/account" },
    { name: "My Orders", href: "/my-orders" },
    { name: "My Order Attachments", href: "/customer/order-attachments" },
    { name: "Favourite Products", href: "/customer/favourite-products" },
    { name: "Address Book", href: "/customer/address-book" },
    { name: "Dashboard", href: "/customer/dashboard" },
    { name: "My Forecast", href: "/customer/forecast" },
    { name: "Notifications", href: "/customer/notifications" },
];
