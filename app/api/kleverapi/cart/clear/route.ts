import { NextResponse } from "next/server";
import { getBaseUrl, getLocaleBaseUrl } from "@/lib/api/magento-url";

// BASE_URL is now obtained per-request via getBaseUrl(req)

/* =========================
   CLEAR CART (KleverAPI)
   POST /api/kleverapi/cart/clear
========================= */
export async function POST(req: Request) {
    try {
        const BASE_URL = getBaseUrl(req);
        const authHeader = req.headers.get("authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        let response = await fetch(`${BASE_URL}/cart/clear`, {
            method: "POST",
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
            },
        });

        let responseText = await response.text();

        // If warehouse store code fails, retry with locale-only store (e.g. V101_en → en)
        if (!response.ok) {
            const localeUrl = `${getLocaleBaseUrl(req)}/cart/clear`;
            if (localeUrl !== `${BASE_URL}/cart/clear`) {
                console.log("[cart/clear] Retrying with locale-base URL");
                const localeRes = await fetch(localeUrl, {
                    method: "POST",
                    headers: { Authorization: authHeader, "Content-Type": "application/json" },
                });
                if (localeRes.ok) {
                    response = localeRes;
                    responseText = await localeRes.text();
                }
            }
        }

        if (!response.ok) {
            console.error("Clear Cart API error:", response.status, responseText);
            let errorData: any = { message: "Failed to clear cart" };
            try { errorData = JSON.parse(responseText); } catch { }
            return NextResponse.json(errorData, { status: response.status });
        }

        // Magento may return an empty body, plain true, or JSON on success
        let data: any = { success: true };
        if (responseText) {
            try { data = JSON.parse(responseText); } catch { data = { success: true, message: responseText }; }
        }
        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy Clear Cart Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
