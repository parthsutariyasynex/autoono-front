import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth/auth-options";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    try {
        // Step 1: Get token - try multiple methods
        let token: string | null = null;

        // Method 1: Authorization header from client
        const authHeader = request.headers.get("authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7).replace(/['"]/g, "").trim();
            console.log("[category-products] Token from Auth header:", token ? "found" : "missing");
        }

        // Method 2: NextAuth JWT from cookie (most reliable on Vercel)
        if (!token) {
            try {
                const jwtToken = await getToken({
                    req: request,
                    secret: process.env.NEXTAUTH_SECRET,
                });
                token = (jwtToken as any)?.accessToken || null;
                console.log("[category-products] Token from JWT cookie:", token ? "found" : "missing");
            } catch (e) {
                console.error("[category-products] JWT token error:", e);
            }
        }

        // Method 4: auth-token cookie directly
        if (!token) {
            token = request.cookies.get("auth-token")?.value || null;
            if (token) {
                token = token.replace(/['"]/g, "").trim();
                console.log("[category-products] Token from auth-token cookie:", token ? "found" : "missing");
            }
        }

        // Final check: if token is invalid string, clear it
        if (token === "null" || token === "undefined" || !token) {
            token = null;
        }

        // Note: For some anonymous endpoints, we might want to continue even without a token.
        // But here we'll keep the check if the app requires login to see products.
        if (!token) {
            console.warn("[category-products] No token found. Proceeding as guest if allowed by Magento.");
        }

        // Step 2: Handle search parameters
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get("categoryId") || "5";
        const page = searchParams.get("page") || "1";
        const pageSize = searchParams.get("pageSize") || "20";

        // Step 3: Construct Magento URL with simple params (matching live API format)
        const queryParts: string[] = [
            `categoryId=${encodeURIComponent(categoryId)}`,
            `currentPage=${encodeURIComponent(page)}`,
            `pageSize=${encodeURIComponent(pageSize)}`,
        ];

        // Filters: comma-separated values (e.g. year=2022,2023)
        const reservedKeys = new Set(["categoryId", "page", "pageSize"]);
        const uniqueKeys = Array.from(new Set(Array.from(searchParams.keys())));

        uniqueKeys.forEach((key) => {
            if (reservedKeys.has(key)) return;
            const rawValues = searchParams.getAll(key);
            const combined = rawValues
                .flatMap((v) => v.split(",").map((s) => s.trim()).filter(Boolean))
                .filter((v, i, arr) => arr.indexOf(v) === i)
                .join(",");

            if (combined) {
                // Specialized mappings for specific Magento attributes
                const keyMap: Record<string, string> = {
                    brand: "mgs_brand",
                    origin: "manufacturer"
                };

                const mappedKey = keyMap[key] || key;

                // Convert camelCase filter keys to snake_case for Magento (e.g. warrantyPeriod -> warranty_period)
                const magentoKey = mappedKey.replace(/([A-Z])/g, "_$1").toLowerCase();
                queryParts.push(`${encodeURIComponent(magentoKey)}=${encodeURIComponent(combined)}`);
            }
        });

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const magentoUrlStr = `${baseUrl}/category-products?${queryParts.join("&")}`;
        console.log("[category-products] Magento URL:", magentoUrlStr);
        console.log("[category-products] Base URL env:", baseUrl ? "set" : "MISSING!");

        const res = await fetch(magentoUrlStr, {
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error("Magento category-products error:", res.status, errBody);
            return Response.json(
                { error: "Magento API error", details: errBody },
                { status: res.status }
            );
        }

        const data = await res.json();

        // ── Dynamic Offers Filter Injection ──
        const products = Array.isArray(data.products) ? data.products : (Array.isArray(data.items) ? data.items : []);

        if (products.length > 0) {
            // Collect unique offers from the products array
            const offerValues = products
                .map((p: any) => p.offer)
                .filter((v: any): v is string => typeof v === 'string' && v.trim().length > 0);

            const uniqueOffers: string[] = Array.from(new Set(offerValues));

            if (uniqueOffers.length > 0) {
                // Count products per offer for the filter counts
                const offerCounts: Record<string, number> = {};
                offerValues.forEach((v: string) => {
                    offerCounts[v] = (offerCounts[v] || 0) + 1;
                });

                // Create the synthetic filter group
                const offersFilter = {
                    code: "offers",
                    label: "Promotions and Offers",
                    record_count: uniqueOffers.length,
                    options: uniqueOffers.map((offer: string) => ({
                        value: offer,
                        label: offer,
                        count: offerCounts[offer]
                    }))
                };

                // Ensure data.filters exists
                if (!Array.isArray(data.filters)) {
                    data.filters = [];
                }

                // Check if already exists to avoid duplicates
                const hasOffers = data.filters.some((f: any) => f.code === "offers" || f.code === "promotions_and_offers");

                if (!hasOffers) {
                    // Find index of itemCode to insert after it, or push to start
                    const itemCodeIndex = data.filters.findIndex((f: any) => f.code === "itemCode" || f.code === "item_code");
                    if (itemCodeIndex !== -1) {
                        data.filters.splice(itemCodeIndex + 1, 0, offersFilter);
                    } else {
                        data.filters.unshift(offersFilter);
                    }
                }
            }
        }

        // Extract total count and other fields from the original response
        const totalCount = typeof data.total_count === "number" ? data.total_count : products.length;
        const finalFilters = Array.isArray(data.filters) ? data.filters : [];

        // Return the clean, normalized structure requested
        return Response.json({
            ...data,
            products: products,
            total_count: totalCount,
            filters: finalFilters
        });

    } catch (error: any) {
        console.error("category-products route error:", error.message);
        return Response.json(
            { error: "Failed to fetch products", message: error.message },
            { status: 500 }
        );
    }
}
