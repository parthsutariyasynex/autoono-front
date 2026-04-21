import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

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
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const res = await fetch(`${BASE_URL}/source-permission/stores`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error("[source-permission/stores] Magento error:", res.status, errBody);
            return NextResponse.json({ error: "Failed to fetch stores" }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data, {
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        });
    } catch (error: any) {
        console.error("[source-permission/stores] Route error:", error.message);
        return NextResponse.json({ error: "Failed to fetch stores" }, { status: 500 });
    }
}
