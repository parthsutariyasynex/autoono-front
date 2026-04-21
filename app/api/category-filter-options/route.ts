import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { NextRequest } from "next/server";
import { getBaseUrl, getV101BaseUrl } from "@/lib/api/magento-url";

export async function GET(req: NextRequest) {
    try {
        const session: any = await getServerSession(authOptions);
        const token = session?.accessToken;

        if (!token) {
            console.warn("[category-filter-options] No token found in session.");
        }

        const { searchParams } = new URL(req.url);
        const categoryId = searchParams.get("categoryId") || "15";

        const v101BaseUrl = getV101BaseUrl(req);
        const magentoUrl = `${v101BaseUrl}/category-filter-options?categoryId=${categoryId}`;
        console.log("[category-filter-options] Attempting proper V101 URL:", magentoUrl);

        let res = await fetch(magentoUrl, {
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
                "Content-Type": "application/json",
                "platform": "web",
            },
            cache: "no-store",
        });

        // Fallback Strategy: If V101 fails with 404, try the locale-specific URL
        if (!res.ok && res.status === 404) {
            console.warn("[category-filter-options] V101 URL returned 404. Falling back to locale baseUrl.");
            const localeBaseUrl = getBaseUrl(req);
            const fallbackUrl = `${localeBaseUrl}/category-filter-options?categoryId=${categoryId}`;
            res = await fetch(fallbackUrl, {
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` }),
                    "Content-Type": "application/json",
                    "platform": "web",
                },
                cache: "no-store",
            });
        }

        if (!res.ok) {
            const errBody = await res.text();
            console.error("Magento filter-options error:", res.status, errBody);
            return Response.json({ error: `API Error: ${res.status}`, details: errBody }, { status: res.status });
        }

        const data = await res.json();
        return Response.json(data);
    } catch (err: any) {
        console.error("category-filter-options route error:", err.message);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
