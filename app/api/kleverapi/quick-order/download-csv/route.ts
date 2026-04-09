import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

// BASE_URL is now obtained per-request via getBaseUrl(request)

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
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Mageplaza Quick Order Download CSV API
        const magentoUrl = `${BASE_URL}/quick-order/download-csv`;

        console.log("[quick-order/download-csv] Requesting CSV from:", magentoUrl);

        const res = await fetch(magentoUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error("[quick-order/download-csv] Magento error:", res.status, errBody);
            return NextResponse.json({ error: "Download failed", details: errBody }, { status: res.status });
        }

        const data = await res.json();
        console.log("[quick-order/download-csv] Magento data received:", {
            success: data?.success,
            hasBase64: !!data?.base64,
            message: data?.message
        });

        return NextResponse.json(data);

    } catch (error: any) {
        console.error("[quick-order/download-csv] Error:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
