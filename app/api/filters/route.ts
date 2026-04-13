import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

export async function GET(request: NextRequest) {
    try {
        const baseUrl = getBaseUrl(request);
        // Step 1: Try to get token from the Authorization header sent by the browser
        let token: string | null = null;

        const authHeader = request.headers.get("authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const raw = authHeader.replace("Bearer ", "").replace(/['"]/g, "").trim();
            if (raw && raw !== "null" && raw !== "undefined") {
                token = raw;
            }
        }

        // Step 2: Fallback to cookies directly (most reliable)
        if (!token) {
            const cookie = request.cookies.get("auth-token")?.value;
            if (cookie) {
                token = cookie.replace(/['"]/g, "").trim();
            }
        }

        // Step 3: Fallback to Next-Auth session
        if (!token) {
            const session: any = await getServerSession(authOptions);
            if (session?.accessToken) {
                token = session.accessToken;
            }
        }

        // Final check - santize invalid strings
        if (token === "null" || token === "undefined" || !token) {
            token = null;
        }

        // Step 4: Get categoryId from query params
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get("categoryId") || "5";

        // Step 5: Fetch filter options from Magento
        const magentoUrl = `${baseUrl}/category-filter-options/${categoryId}`;

        const res = await fetch(magentoUrl, {
            method: "GET",
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
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

        // Normalize response: always return { filters: [...] }
        // Magento may return array directly, or wrapped in filters/data/items
        let filters = Array.isArray(data)
            ? data
            : (data.filters || data.data || data.items || []);

        // ── Normalize Filter Keys ──
        if (Array.isArray(filters)) {
            filters = filters.map((f: any) => {
                let code = f.code || f.attribute_code;

                // Map backend keys to what the frontend expects
                if (code === "color") code = "tyre_size";
                if (code === "manufacturer") code = "origin";
                if (code === "mgs_brand") code = "brand";
                if (code === "productGroup") code = "product_group";
                if (code === "warrantyPeriod") code = "warranty_period";
                if (code === "newArrivals") code = "new_arrivals";

                return { ...f, code };
            });
        }

        console.log(`[filters/route] Loaded ${filters.length} normalized filter groups for category ${categoryId}`);

        return NextResponse.json({ filters });

    } catch (error: any) {
        console.error("Filter route catch:", error.message);
        return NextResponse.json(
            { error: "Failed to fetch filters", message: error.message },
            { status: 500 }
        );
    }
}