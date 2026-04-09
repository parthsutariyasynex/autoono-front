import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

// BASE_URL is now obtained per-request via getBaseUrl(request)

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ sku: string }> }
) {
    const { sku } = await params;
    try {
        const BASE_URL = getBaseUrl(request);
        const body = await request.json(); // Expected: { qty: number }

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

        // Mageplaza Quick Order Update Quantity API
        const magentoUrl = `${BASE_URL}/quick-order/update-qty/${sku}`;

        console.log("[quick-order/update-qty] Updating item:", sku, "to qty:", body.qty, "at:", magentoUrl);

        const res = await fetch(magentoUrl, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
            cache: "no-store",
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error(`[quick-order/update-qty] Magento error for ${sku}:`, res.status, errBody);
            return NextResponse.json({ error: "Update failed", details: errBody }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error(`[quick-order/update-qty] Error for ${sku}:`, error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
