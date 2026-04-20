import { NextResponse } from "next/server";
import { getBaseUrl, getGlobalBaseUrl } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";

/* =========================
   GET CART (KleverAPI)
 ========================= */
export async function GET(req: any) {
    try {
        const token = await getRequestToken(req);

        if (!token) {
            console.warn("[API ROUTE] Cart: No token found");
            return NextResponse.json({ message: "Unauthorized: Missing customer token" }, { status: 401 });
        }

        const BASE_URL = getBaseUrl(req);
        const url = `${BASE_URL}/cart`;

        console.log(`[API ROUTE] Fetching Cart from: ${url}`);
        const maskedToken = token.length > 10 ? `${token.substring(0, 5)}...${token.substring(token.length - 5)}` : 'short-token';
        // console.log(`[API ROUTE] Using Token: Bearer ${maskedToken}`);

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                platform: "web",
            },
            cache: "no-store",
        });

        const data = await response.json();

        // --- FALLBACK STRATEGY ---
        // If 400 (Bad Request) or 404, try global URL
        if (response.status === 400 || response.status === 404) {
            const globalBase = getGlobalBaseUrl(req);
            const globalUrl = `${globalBase}/cart`;

            if (globalUrl !== url) {
                console.log(`[API ROUTE] Cart error ${response.status} at ${url}. Retrying with global URL: ${globalUrl}`);
                const fallbackResponse = await fetch(globalUrl, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        platform: "web",
                    },
                    cache: "no-store",
                });

                if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    return NextResponse.json(fallbackData);
                }
            }
        }

        if (!response.ok) {
            console.error("[API ROUTE ERROR] Cart API error:", response.status, JSON.stringify(data).substring(0, 500));
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("[API ROUTE ERROR] Cart GET Proxy Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
