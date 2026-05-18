import { NextResponse } from "next/server";
import { getBaseUrl, getLocaleBaseUrl } from "@/lib/api/magento-url";

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { sku, qty } = body;

        const headers = {
            "Content-Type": "application/json",
            Authorization: authHeader,
        };
        const addBody = JSON.stringify({ sku, qty });

        // 1. Try warehouse store (e.g. V101_en)
        const kleverUrl = `${getBaseUrl(req)}/cart/add`;
        let response = await fetch(kleverUrl, { method: "POST", headers, body: addBody });
        let responseText = await response.text();

        // 2. If warehouse store fails for any reason, retry with locale-only store (e.g. en)
        if (!response.ok) {
            const localeUrl = `${getLocaleBaseUrl(req)}/cart/add`;
            if (localeUrl !== kleverUrl) {
                const localeRes = await fetch(localeUrl, { method: "POST", headers, body: addBody });
                const localeText = await localeRes.text();
                if (localeRes.ok) {
                    let d: any = { success: true };
                    if (localeText) { try { d = JSON.parse(localeText); } catch { } }
                    return NextResponse.json(d);
                }
                responseText = localeText;
                response = localeRes;
            }
        }

        if (!response.ok) {
            console.error("Add to Cart API error:", response.status, responseText);
            let message = "Failed to add to cart";
            try {
                const parsed = JSON.parse(responseText);
                message = parsed.message || parsed.error || message;
            } catch { /* plain text */ }
            return NextResponse.json({ message, details: responseText }, { status: response.status });
        }

        let data: any = { success: true };
        if (responseText) {
            try { data = JSON.parse(responseText); } catch { data = { success: true }; }
        }
        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy POST Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
