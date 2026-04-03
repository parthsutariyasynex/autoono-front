import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function DELETE(request: NextRequest) {
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

        // Mageplaza Quick Order Clear API
        const magentoUrl = `${BASE_URL}/quick-order/clear`;

        console.log("[quick-order/clear] Deleting from:", magentoUrl);

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
            console.error("[quick-order/clear] Magento error:", res.status, errBody);
            try {
                const errData = JSON.parse(errBody);
                return NextResponse.json({ error: "Clear failed", details: errData }, { status: res.status });
            } catch {
                return NextResponse.json({ error: "Clear failed", details: errBody }, { status: res.status });
            }
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("[quick-order/clear] Error:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
