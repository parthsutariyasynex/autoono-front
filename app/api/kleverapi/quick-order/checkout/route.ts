import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function POST(request: NextRequest) {
    try {
        let token: string | null = null;

        const authHeader = request.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
            token = authHeader.substring(7).replace(/['"]/g, "").trim();
        }

        if (!token) {
            token = request.cookies.get("auth-token")?.value?.replace(/['"]/g, "").trim() || null;
        }

        if (!token || token === "null" || token === "undefined") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        // Mageplaza Quick Order Checkout API
        const magentoUrl = `${BASE_URL}/quick-order/checkout`;

        console.log("[quick-order/checkout] Posting to:", magentoUrl);

        const res = await fetch(magentoUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
            cache: "no-store",
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error("[quick-order/checkout] Magento error:", res.status, errBody);
            return NextResponse.json({ error: "Checkout failed", details: errBody }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("[quick-order/checkout] Error:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
