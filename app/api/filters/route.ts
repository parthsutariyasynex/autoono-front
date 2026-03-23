import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

export async function GET(request: Request) {
    try {
        // Step 1: Try to get token from the Authorization header sent by the browser
        let token: string | null = null;

        const authHeader = request.headers.get("authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const raw = authHeader.replace("Bearer ", "").replace(/['"]/g, "").trim();
            if (raw && raw !== "null" && raw !== "undefined") {
                token = raw;
            }
        }

        // Step 2: Fallback to Next-Auth session if no valid token from header
        if (!token) {
            const session: any = await getServerSession(authOptions);
            if (session?.accessToken) {
                token = session.accessToken;
            }
        }

        // Step 3: Reject if still no token
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Step 4: Get categoryId from query params
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get("categoryId") || "5";

        // Step 5: Fetch from Magento with the correct URL and user's token
        const magentoUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/category-filter-options/${categoryId}`;

        const res = await fetch(magentoUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error("Magento filter API error:", res.status, errBody);
            return NextResponse.json(
                { error: "Magento API error", status: res.status, detail: errBody },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("Filter route catch:", error.message);
        return NextResponse.json(
            { error: "Failed to fetch filters", message: error.message },
            { status: 500 }
        );
    }
}