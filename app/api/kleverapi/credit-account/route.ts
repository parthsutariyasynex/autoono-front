import { NextRequest, NextResponse } from "next/server";
import { getGlobalBaseUrl } from "@/lib/api/magento-url";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

async function getAuthToken(request: NextRequest): Promise<string | null> {
    let token: string | null = null;

    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
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

export async function GET(request: NextRequest) {
    const baseUrl = getGlobalBaseUrl(request);
    const token = await getAuthToken(request);

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let res: Response | null = null;
    try {
        res = await fetch(`${baseUrl}/credit-account`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });
    } catch (networkErr: any) {
        console.warn("[credit-account GET] Network error, hiding widget:", networkErr.message);
        return NextResponse.json({ is_visible: false });
    }

    if (!res.ok) {
        console.warn("[credit-account GET] Magento returned", res.status, "— hiding widget");
        return NextResponse.json({ is_visible: false });
    }

    const data = await res.json();
    return NextResponse.json(data);
}
