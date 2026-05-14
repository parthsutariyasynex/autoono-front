import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl, getGlobalBaseUrl, getStoreBaseUrl } from "@/lib/api/magento-url";

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        // body: { items: [{ sku, rule_id, qty }] }

        // Use store-specific URL when available (promo rules are per-warehouse store)
        const { searchParams } = new URL(request.url);
        const storeCode = searchParams.get("store") || request.headers.get("x-store-code") || "";
        const LOCALE_CODES = new Set(["en", "ar"]);
        const BASE_URL = (storeCode && !LOCALE_CODES.has(storeCode))
            ? getStoreBaseUrl(storeCode)
            : getBaseUrl(request);

        const res = await fetch(`${BASE_URL}/cart/promo-items/add`, {
            method: "POST",
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error("[promo-items/add POST] error:", res.status, errBody);
            let message = "Failed to add promo items";
            try {
                const parsed = JSON.parse(errBody);
                message = parsed.message || parsed.error || message;
            } catch { }
            return NextResponse.json({ message, details: errBody }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("[promo-items/add POST] exception:", error.message);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
