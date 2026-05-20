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

        let res: Response | null = null;
        try {
            res = await fetch(`${BASE_URL}/source-permission`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
            });
        } catch (networkErr: any) {
            console.warn("[source-permission] Magento fetch threw (network/timeout):", networkErr.message);
            // Return empty permissions — Navbar handles missing data gracefully
            return NextResponse.json({ permissions: [], stores: [] }, { status: 200 });
        }

        if (!res.ok) {
            const errBody = await res.text();
            console.error("[source-permission] Magento error:", res.status, errBody);
            // Return empty on error so Navbar doesn't crash
            return NextResponse.json({ permissions: [], stores: [] }, { status: 200 });
        }

        const data = await res.json();
        return NextResponse.json(data, {
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        });
    } catch (error: any) {
        console.error("[source-permission] Route error:", error.message);
        return NextResponse.json({ permissions: [], stores: [] }, { status: 200 });
    }
}
