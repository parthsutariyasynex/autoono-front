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

        // Mageplaza Quick Order Validate API
        const magentoUrl = `${BASE_URL}/quick-order/validate`;

        console.log("[quick-order/validate] Posting to:", magentoUrl);

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
            console.error("[quick-order/validate] Magento error:", res.status, errBody);
            return NextResponse.json({ error: "Validation failed", details: errBody }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("[quick-order/validate] Error:", error.message);
        return NextResponse.json({ error: "Validation failed" }, { status: 500 });
    }
}
