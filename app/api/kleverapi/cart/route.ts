import { NextResponse } from "next/server";
import { getBaseUrl, getGlobalBaseUrl, getLocaleBaseUrl } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";

const LOCALE_CODES = new Set(["en", "ar"]);

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

        const fetchHeaders = {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            platform: "web",
        };

        const storeCode = req.headers.get("x-store-code") || "";
        const isWarehouse = storeCode && !LOCALE_CODES.has(storeCode);
        const primaryUrl = `${getBaseUrl(req)}/cart`;

        console.log(`[API ROUTE] Fetching Cart from: ${primaryUrl}`);

        const primaryResponse = await fetch(primaryUrl, {
            method: "GET",
            headers: fetchHeaders,
            cache: "no-store",
        });

        // On hard errors fall back to global URL
        if (primaryResponse.status === 400 || primaryResponse.status === 404) {
            const globalUrl = `${getGlobalBaseUrl(req)}/cart`;
            if (globalUrl !== primaryUrl) {
                console.log(`[API ROUTE] Cart ${primaryResponse.status} at ${primaryUrl}. Retrying with global: ${globalUrl}`);
                const fallback = await fetch(globalUrl, { method: "GET", headers: fetchHeaders, cache: "no-store" });
                if (fallback.ok) return NextResponse.json(await fallback.json());
            }
        }

        if (!primaryResponse.ok) {
            const errData = await primaryResponse.json().catch(() => ({}));
            console.error("[API ROUTE ERROR] Cart API error:", primaryResponse.status, JSON.stringify(errData).substring(0, 500));
            return NextResponse.json(errData, { status: primaryResponse.status });
        }

        const primaryData = await primaryResponse.json();

        // For warehouse stores (e.g. Anwar_Khaled_en) the KleverAPI /cart endpoint
        // may omit promo/free-gift items from its response. Fetch the locale URL as
        // well and merge any items that are missing from the warehouse response so
        // they always appear on the cart page.
        if (isWarehouse) {
            const localeUrl = `${getLocaleBaseUrl(req)}/cart`;
            if (localeUrl !== primaryUrl) {
                try {
                    const localeResponse = await fetch(localeUrl, { method: "GET", headers: fetchHeaders, cache: "no-store" });
                    if (localeResponse.ok) {
                        const localeData = await localeResponse.json();
                        const primaryItems: any[] = Array.isArray(primaryData?.items) ? primaryData.items : [];
                        const localeItems: any[] = Array.isArray(localeData?.items) ? localeData.items : [];

                        const primaryIds = new Set(primaryItems.map((i: any) => i.item_id).filter(Boolean));
                        const extraItems = localeItems.filter((i: any) => i.item_id && !primaryIds.has(i.item_id));

                        if (extraItems.length > 0) {
                            console.log(`[API ROUTE] Cart: merging ${extraItems.length} promo item(s) from locale URL`);
                            primaryData.items = [...primaryItems, ...extraItems];
                        }
                    }
                } catch (err) {
                    console.warn("[API ROUTE] Cart: locale URL merge failed (non-critical):", err);
                }
            }
        }

        return NextResponse.json(primaryData);
    } catch (error) {
        console.error("[API ROUTE ERROR] Cart GET Proxy Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
