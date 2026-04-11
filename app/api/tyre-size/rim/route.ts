import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

import { getRequestToken } from "@/lib/api/auth-helper";

export async function GET(request: NextRequest) {
    const token = await getRequestToken(request);
    // Optional token - if found use it, else proceed as guest

    const { searchParams } = new URL(request.url);
    const width = searchParams.get("width");
    const height = searchParams.get("height");

    try {
        const baseUrl = getBaseUrl(request);
        let url = `${baseUrl}/tyre-size/rim`;
        // ... (remaining params logic)
        const params = new URLSearchParams();
        if (width) params.append("width", width);
        if (height) params.append("height", height);
        if (params.toString()) url += `?${params.toString()}`;

        const fetchOptions: any = {
            headers: {
                "Content-Type": "application/json",
                platform: "web",
                accept: "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
            cache: "no-store",
        };

        if (token && token !== "null") {
            fetchOptions.headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(url, fetchOptions);
        const responseText = await res.text();

        if (!res.ok) {
            console.error("[tyre-size/rim] Magento error:", res.status, responseText);
            return NextResponse.json({ error: "Magento error", details: responseText }, { status: res.status });
        }

        try {
            const data = JSON.parse(responseText);
            return NextResponse.json(data);
        } catch (e) {
            console.error("[tyre-size/rim] JSON Parse Error:", e);
            return NextResponse.json({ error: "Invalid JSON from Magento", raw: responseText.substring(0, 500) }, { status: 500 });
        }
    } catch (err: any) {
        console.error("[tyre-size/rim] Fetch error details:", {
            message: err.message,
            stack: err.stack,
            cause: err.cause,
            code: err.code
        });
        return NextResponse.json({
            error: "Internal Server Error",
            message: err.message,
            details: err.cause ? String(err.cause) : undefined
        }, { status: 500 });
    }
}
