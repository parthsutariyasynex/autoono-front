import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

const fallbackSidebar = {
    user_type: "customer",
    items: [
        { label: "My Account", url: "/my-account", code: "my_account", is_visible: true, sort_order: 10 },
        { label: "Dashboard", url: "/customer/dashboard", code: "dashboard", is_visible: true, sort_order: 20 },
        { label: "My Orders", url: "/my-orders", code: "my_orders", is_visible: true, sort_order: 30 },
        { label: "My Statement", url: "/customer/statement", code: "statement", is_visible: true, sort_order: 40 },
        { label: "Favorite Products", url: "/favorites", code: "favourite_products", is_visible: true, sort_order: 50 },
        { label: "Address Book", url: "/customer/address-book", code: "address_book", is_visible: true, sort_order: 60 },
        { label: "Notifications", url: "/customer/notifications", code: "notifications", is_visible: true, sort_order: 70 },
        { label: "Sign Out", url: "/logout", code: "sign_out", is_visible: true, sort_order: 999 },
    ]
};

export async function GET(request: NextRequest) {
    try {
        const BASE_URL = getBaseUrl(request);

        let token: string | null = null;
        const authHeader = request.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
            token = authHeader.substring(7).replace(/['"]/g, "").trim();
        }
        if (!token) {
            token = request.cookies.get("auth-token")?.value?.replace(/['"]/g, "").trim() || null;
        }
        if (!token || token === "null" || token === "undefined") {
            return NextResponse.json(fallbackSidebar, {
                headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
            });
        }

        const res = await fetch(`${BASE_URL}/account-sidebar`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.warn("[account-sidebar] Magento error, serving fallback:", res.status, errBody);
            return NextResponse.json(fallbackSidebar, {
                headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
            });
        }

        const data = await res.json();
        return NextResponse.json(data, {
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        });
    } catch (error: any) {
        console.warn("[account-sidebar] Route error, serving fallback:", error.message);
        return NextResponse.json(fallbackSidebar, {
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        });
    }
}
