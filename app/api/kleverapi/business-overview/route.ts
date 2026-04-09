import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

// Shared auth helper
async function getAuthToken(request: NextRequest): Promise<string | null> {
    let token: string | null = null;

    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7).replace(/['"]/g, "").trim();
    }

    if (!token || token === "null") {
        const cookie = request.cookies.get("auth-token")?.value;
        if (cookie) token = cookie.replace(/['"]/g, "").trim();
    }

    if (!token || token === "null") {
        const session: any = await getServerSession(authOptions);
        token = session?.accessToken || null;
    }

    if (!token || token === "null" || token === "undefined") return null;
    return token;
}

// GET — Fetch business overview
export async function GET(request: NextRequest) {
    try {
        const baseUrl = getBaseUrl(request);
        const token = await getAuthToken(request);
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const res = await fetch(`${baseUrl}/business-overview`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error("[business-overview GET] Magento error:", res.status, errBody);
            return NextResponse.json({ error: "Magento API error", details: errBody }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("[business-overview GET] Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT — Update business overview
export async function PUT(request: NextRequest) {
    try {
        const baseUrl = getBaseUrl(request);
        const token = await getAuthToken(request);
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        console.log("[business-overview PUT] Payload:", JSON.stringify(body).substring(0, 500));

        const res = await fetch(`${baseUrl}/business-overview`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            cache: "no-store",
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error("[business-overview PUT] Magento error:", res.status, errBody);
            return NextResponse.json({ error: "Magento API error", details: errBody }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("[business-overview PUT] Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
