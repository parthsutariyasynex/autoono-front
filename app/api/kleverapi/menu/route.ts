import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

// BASE_URL is now obtained per-request via getBaseUrl(request)

// Map Magento absolute URLs to local Next.js routes
const URL_MAP: Record<string, string> = {
    all_tyres: "/products",
    all_lubricants: "/products",
    quick_order: "/quick-order",
    about_us: "/about",
    branch_locations: "/locations",
    user_guides: "/guides",
    product_catalogue: "/catalogue",
};

export async function GET(request: NextRequest) {
    try {
        const BASE_URL = getBaseUrl(request);
        let token: string | null = null;

        const authHeader = request.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
            token = authHeader.substring(7).replace(/['"]/g, "").trim();
        }

        if (!token) {
            token = request.cookies.get("auth-token")?.value?.replace(/['"]/g, "").trim() || null;
        }

        if (!token || token === "null" || token === "undefined") {
            token = null;
        }

        const res = await fetch(`${BASE_URL}/menu`, {
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            cache: "no-store", // No cache — response varies by locale
        });

        if (!res.ok) {

            const errBody = await res.text();
            console.error("[menu] Magento error:", res.status, errBody);
            return NextResponse.json({ error: "Failed to fetch menu" }, { status: res.status });
        }

        const data = await res.json();
        const rawItems = Array.isArray(data) ? data : [];

        // Recursive mapper to handle children and URL mapping
        const mapMenuItem = (item: any): any => {
            // Magento category id may come back under different keys depending on endpoint version
            const categoryId = item.category_id ?? item.categoryId ?? item.entity_id ?? item.id ?? null;
            const mapped = {
                code: item.code,
                label: item.label,
                href: URL_MAP[item.code] || item.url || "#",
                magentoUrl: item.url || "",
                categoryId: categoryId != null ? String(categoryId) : null,
                sort_order: item.sort_order,
                is_visible: item.is_visible !== false,
            } as any;

            if (Array.isArray(item.children) && item.children.length > 0) {
                mapped.children = item.children
                    .filter((child: any) => child.is_visible !== false)
                    .map(mapMenuItem);
            }

            return mapped;
        };

        const items = rawItems
            .filter((item: any) => item.is_visible !== false)
            .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
            .map(mapMenuItem);

        return new Response(JSON.stringify(items), {
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store, no-cache, must-revalidate",
            },
        });
    } catch (error: any) {
        console.error("[menu] Route error:", error.message);
        return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
    }
}
