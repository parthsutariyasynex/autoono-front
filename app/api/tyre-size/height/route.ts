import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

export async function GET(request: NextRequest) {
    let token: string | null = null;

    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7).replace(/['"]/g, "").trim();
    }

    const { searchParams } = new URL(request.url);
    const width = searchParams.get("width");

    try {
        const baseUrl = getBaseUrl(request);
        let url = `${baseUrl}/tyre-size/height`;
        if (width) {
            url += `?width=${encodeURIComponent(width)}`;
        }
        const fetchOptions: any = {
            headers: {
                "Content-Type": "application/json",
                "accept": "application/json",
                "platform": "web",
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
            console.error(`[tyre-size/height] Magento error: ${res.status} for ${url}`, responseText);
            return NextResponse.json({
                error: "Magento error",
                status: res.status,
                details: responseText.substring(0, 1000)
            }, { status: res.status });
        }

        try {
            const data = JSON.parse(responseText);
            return NextResponse.json(data);
        } catch (e) {
            console.error(`[tyre-size/height] JSON Parse Error for ${url}:`, e);
            return NextResponse.json({
                error: "Invalid JSON from Magento",
                raw: responseText.substring(0, 500)
            }, { status: 500 });
        }
    } catch (err: any) {
        console.error("[tyre-size/height] Fetch exception:", {
            message: err.message,
            stack: err.stack,
            url: `${getBaseUrl(request)}/tyre-size/height`
        });
        return NextResponse.json({
            error: "Internal Server Error",
            message: err.message || "Fetch failed",
            details: err.cause ? String(err.cause) : undefined
        }, { status: 500 });
    }
}
