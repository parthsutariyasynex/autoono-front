import { NextResponse, NextRequest } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

// BASE_URL is now obtained per-request via getBaseUrl(request)

export async function GET(req: NextRequest) {
    try {
        const BASE_URL = getBaseUrl(req);
        let token: string | null = null;
        const authHeader = req.headers.get("authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        if (!token) {
            token = req.cookies.get("auth-token")?.value || null;
        }

        if (!token) {
            const session: any = await getServerSession(authOptions);
            token = session?.accessToken || null;
        }

        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const year = searchParams.get("year");

        const response = await fetch(`${BASE_URL}/targets-achievements?year=${year}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                platform: "web",
            },
            cache: "no-store",
        });

        const data = await response.json();
        if (!response.ok) return NextResponse.json(data, { status: response.status });

        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy Targets & Achievements Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
