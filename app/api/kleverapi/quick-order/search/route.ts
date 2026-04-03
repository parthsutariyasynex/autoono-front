import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function GET(request: NextRequest) {
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

        const { searchParams } = new URL(request.url);
        const query = searchParams.get("query") || "";
        const pageSize = searchParams.get("pageSize") || "10";

        if (!query || query.length < 2) {
            return NextResponse.json({ items: [], total_count: 0 });
        }

        const magentoUrl = `${BASE_URL}/quick-order/search?query=${encodeURIComponent(query)}&pageSize=${encodeURIComponent(pageSize)}`;

        const res = await fetch(magentoUrl, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error("[quick-order/search] Magento error:", res.status, errBody);
            return NextResponse.json({ error: "Search failed" }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("[quick-order/search] Error:", error.message);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
