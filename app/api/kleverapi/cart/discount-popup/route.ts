import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl, getGlobalBaseUrl, getStoreBaseUrl } from "@/lib/api/magento-url";

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const storeCode = searchParams.get("store") || searchParams.get("storeCode") ||
            request.headers.get("x-store-code") || "";

        const fetchHeaders = {
            Authorization: authHeader,
            "Content-Type": "application/json",
        };

        // Build candidate URLs — store-specific first, then locale, then global V1.
        // Promo rules are tied to a warehouse store (e.g. V101_en), not the generic
        // locale store (en), so the store URL must be tried first.
        const LOCALE_CODES = new Set(["en", "ar"]);
        const candidateUrls: string[] = [];
        if (storeCode && !LOCALE_CODES.has(storeCode)) {
            candidateUrls.push(`${getStoreBaseUrl(storeCode)}/cart/discount-popup`);
        }
        candidateUrls.push(`${getBaseUrl(request)}/cart/discount-popup`);
        candidateUrls.push(`${getGlobalBaseUrl(request)}/cart/discount-popup`);

        let bestData: any = null;

        for (const url of candidateUrls) {
            let r: Response;
            try {
                r = await fetch(url, { headers: fetchHeaders, cache: "no-store" });
            } catch {
                continue;
            }
            console.log(`[discount-popup] ${r.status} → ${url}`);
            if (!r.ok) continue;

            const data = await r.json();
            const rules = data?.promo_rules ?? data?.rules ?? [];
            console.log(`[discount-popup] promo_rules length: ${Array.isArray(rules) ? rules.length : "n/a"} from ${url}`);

            // Prefer a response that actually has promo rules
            if (Array.isArray(rules) && rules.length > 0) {
                bestData = data;
                break;
            }
            // Keep the first successful response as fallback
            if (!bestData) bestData = data;
        }

        if (!bestData) {
            return NextResponse.json({ message: "Failed to fetch discount popup" }, { status: 502 });
        }

        return NextResponse.json(bestData);
    } catch (error: any) {
        console.error("[discount-popup GET] exception:", error.message);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
