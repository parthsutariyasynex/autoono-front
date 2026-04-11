import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

import { getRequestToken } from "@/lib/api/auth-helper";

export async function GET(request: NextRequest) {
    const token = await getRequestToken(request);

    // Proceed without token if missing, allowing guest access if Magento supports it

    // This route (width) does not typically take search parameters for its primary function.
    // If it were to take parameters, they would be extracted here.
    // For example, if it needed a 'category' parameter:
    // const { searchParams } = new URL(request.url);
    // const category = searchParams.get("category");
    // const encodedCategory = category ? encodeURIComponent(category) : '';
    // const url = `${baseUrl}/tyre-size/width${encodedCategory ? `?category=${encodedCategory}` : ''}`;

    const fetchOptions: any = {
        headers: {
            'Content-Type': 'application/json',
            'platform': 'web',
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        cache: 'no-store',
    };

    if (token && token !== "null") {
        fetchOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const baseUrl = getBaseUrl(request);
        const res = await fetch(
            `${baseUrl}/tyre-size/width`,
            fetchOptions
        );

        const responseText = await res.text();

        if (!res.ok) {
            console.error("[tyre-size/width] Magento error:", res.status, responseText);
            return NextResponse.json({ error: "Magento error", details: responseText }, { status: res.status });
        }

        try {
            const data = JSON.parse(responseText);
            return NextResponse.json(data);
        } catch (e) {
            console.error("[tyre-size/width] JSON Parse Error:", e);
            return NextResponse.json({ error: "Invalid JSON from Magento", raw: responseText.substring(0, 500) }, { status: 500 });
        }
    } catch (err: any) {
        console.error("[tyre-size/width] Fetch error details:", {
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
