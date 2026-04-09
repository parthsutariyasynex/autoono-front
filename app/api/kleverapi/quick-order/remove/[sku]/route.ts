import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

// BASE_URL is now obtained per-request via getBaseUrl(request)

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ sku: string }> }
) {
    const { sku } = await params;
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
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Mageplaza Quick Order Remove Single Item API
        const magentoUrl = `${BASE_URL}/quick-order/remove/${sku}`;

        console.log("[quick-order/remove] Deleting item:", sku, "from:", magentoUrl);

        const res = await fetch(magentoUrl, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error(`[quick-order/remove] Magento error for ${sku}:`, res.status, errBody);
            return NextResponse.json({ error: "Removal failed", details: errBody }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error(`[quick-order/remove] Error for ${sku}:`, error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
