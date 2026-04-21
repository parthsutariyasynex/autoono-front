import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth/auth-options";
import { NextRequest } from "next/server";
import { getBaseUrl, getLocaleFromRequest, getV101BaseUrl, getStoreBaseUrl } from "@/lib/api/magento-url";

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
                    cookieName: "autoono.session-token",
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
        const categoryId = searchParams.get("categoryId") || "15";
        const page = searchParams.get("page") || "1";
        const pageSize = searchParams.get("pageSize") || "20";
        // Optional store/warehouse code (e.g. V101, V102, V103) — goes into the Magento URL path
        const storeCode = searchParams.get("storeCode") || searchParams.get("store") || "";

        // Group parameters: Magento's layered navigation uses key[0]=v1. 
        // We want to group these into key=v1,v2 for the category-products JSON API.
        const groupedParams: Record<string, string[]> = {};
        searchParams.forEach((value, key) => {
            const baseKey = key.includes("[") ? key.split("[")[0] : key;
            if (!groupedParams[baseKey]) groupedParams[baseKey] = [];
            if (!groupedParams[baseKey].includes(value)) groupedParams[baseKey].push(value);
        });

        // Step 3: Construct Magento URL with simple params (matching live API format)
        const queryParts: string[] = [
            `categoryId=${encodeURIComponent(categoryId)}`,
            `currentPage=${encodeURIComponent(page)}`,
            `pageSize=${encodeURIComponent(pageSize)}`,
            `is_ajax=1`,
        ];

        // Filters: mapping and joining grouped values
        const reservedKeys = new Set(["categoryId", "page", "pageSize", "sortBy", "is_ajax", "storeCode", "store", "lang", "category"]);

        Object.entries(groupedParams).forEach(([key, values]) => {
            if (reservedKeys.has(key)) return;

            const combined = values
                .flatMap((v) => v.split(",").map((s) => s.trim()).filter(Boolean))
                .filter((v, i, arr) => arr.indexOf(v) === i)
                .join(",");

            if (combined) {
                // Specialized mappings for specific Magento attributes
                const keyMap: Record<string, string> = {
                    brand: "mgs_brand",
                    origin: "manufacturer",
                    tyre_size: "color",
                    product_group: "productGroup",
                    warranty_period: "warrantyPeriod",
                    new_arrivals: "newArrivals",
                    item_code: "itemCode",
                    oem_marking: "oemMarking",
                    parts_category: "partsCategory",
                    oil_type: "oilType",
                    grade: "oilGrade"
                };

                const magentoKey = keyMap[key] || key;

                // Append to query parts without incorrect snake_case conversion
                queryParts.push(`${encodeURIComponent(magentoKey)}=${encodeURIComponent(combined)}`);
            }
        });

        // Debug: log what locale the API route receives
        const xLocaleHeader = request.headers.get("x-locale");
        const localeCookie = request.cookies.get("NEXT_LOCALE")?.value;
        const referer = request.headers.get("referer") || "";
        const langParam = new URL(request.url).searchParams.get("lang");
        const resolvedLocale = getLocaleFromRequest(request);
        console.log("[category-products] LOCALE DEBUG: lang=" + langParam + " header=" + xLocaleHeader + " cookie=" + localeCookie + " resolved=" + resolvedLocale + " referer=" + referer);

        // Choose the Magento base URL: storeCode from query (e.g. V101) takes priority,
        // otherwise fall back to "ar" as the default store context.
        const effectiveStoreCode = storeCode || "ar";
        const primaryBaseUrl = getStoreBaseUrl(effectiveStoreCode);
        const magentoUrlStr = `${primaryBaseUrl}/category-products?${queryParts.join("&")}`;
        console.log("[category-products] storeCode=" + effectiveStoreCode + " URL:", magentoUrlStr);

        let res = await fetch(magentoUrlStr, {
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "platform": "web",
            },
            cache: "no-store",
        });

        // Fallback Strategy: If V101 returns 404, try the locale-specific URL
        if (!res.ok && res.status === 404) {
            console.warn("[category-products] V101 URL returned 404. Falling back to locale baseUrl.");
            const localeBaseUrl = getBaseUrl(request);
            const fallbackUrl = `${localeBaseUrl}/category-products?${queryParts.join("&")}`;
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
            console.error("Magento category-products error:", res.status, errBody);
            return Response.json(
                { error: "Magento API error", details: errBody },
                { status: res.status }
            );
        }

        const data = await res.json();

        // ── Normalize Filter Keys ──
        if (Array.isArray(data.filters)) {
            data.filters = data.filters.map((f: any) => {
                let code = f.code || f.attribute_code;

                // Map backend keys to what the frontend expects
                if (code === "color") code = "tyre_size";
                if (code === "manufacturer") code = "origin";
                if (code === "mgs_brand") code = "brand";
                if (code === "productGroup") code = "product_group";
                if (code === "warrantyPeriod") code = "warranty_period";
                if (code === "newArrivals") code = "new_arrivals";
                if (code === "partsCategory") code = "parts_category";
                if (code === "oilType") code = "oil_type";
                if (code === "oilGrade") code = "grade";
                if (code === "oilGrade") code = "grade";

                return { ...f, code };
            });
        }

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

                const locale = getLocaleFromRequest(request);
                // Create the synthetic filter group
                const offersFilter = {
                    code: "offers",
                    label: locale === "ar" ? "العروض والترقيات" : "Promotions and Offers",
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
        // Include debug info so we can see what locale was used
        return new Response(JSON.stringify({
            ...data,
            products: products,
            total_count: totalCount,
            filters: finalFilters
        }), {
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store, no-cache, must-revalidate",
            },
        });

    } catch (error: any) {
        console.error("category-products route error:", error.message);
        return Response.json(
            { error: "Failed to fetch products", message: error.message },
            { status: 500 }
        );
    }
}
