import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

export async function POST(request: NextRequest) {
    try {
        const BASE_URL = getBaseUrl(request);
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        // body: { items: [{ sku, rule_id, qty }] }

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
