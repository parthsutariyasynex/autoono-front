import { NextResponse } from "next/server";
import { getBaseUrl, getLocaleBaseUrl, getStandardRestBase } from "@/lib/api/magento-url";

export async function DELETE(req: Request, { params }: { params: Promise<{ itemId: string }> }) {
    try {
        const { itemId } = await params;
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const headers = {
            Authorization: authHeader,
            "Content-Type": "application/json",
        };

        // 1. Try KleverAPI endpoint
        const kleverUrl = `${getBaseUrl(req)}/cart/remove/${itemId}`;
        let response = await fetch(kleverUrl, { method: "DELETE", headers });
        let responseText = await response.text();

        // 2. If KleverAPI warehouse store returns 404/405, try with locale-only store (e.g. V101_en → en)
        if (response.status === 404 || response.status === 405) {
            console.log(`[cart/remove] KleverAPI 404 for item ${itemId}, trying locale-base URL`);
            const localeUrl = `${getLocaleBaseUrl(req)}/cart/remove/${itemId}`;
            if (localeUrl !== kleverUrl) {
                const localeResponse = await fetch(localeUrl, { method: "DELETE", headers });
                const localeText = await localeResponse.text();
                if (localeResponse.ok) {
                    let d: any = { success: true };
                    if (localeText) { try { d = JSON.parse(localeText); } catch { } }
                    return NextResponse.json(d);
                }
            }

            // 3. Final fallback: standard Magento REST endpoint
            console.log(`[cart/remove] locale-base failed, trying standard REST`);
            const fallbackUrl = `${getStandardRestBase(req)}/carts/mine/items/${itemId}`;
            const fallbackResponse = await fetch(fallbackUrl, { method: "DELETE", headers });
            const fallbackText = await fallbackResponse.text();

            if (fallbackResponse.ok || fallbackResponse.status === 404) {
                return NextResponse.json({ success: true });
            }

            console.error("[cart/remove] All fallbacks failed:", fallbackResponse.status, fallbackText);
            let errorData: any = { message: "Failed to remove cart item" };
            try { errorData = JSON.parse(fallbackText); } catch { }
            return NextResponse.json(errorData, { status: fallbackResponse.status });
        }

        if (!response.ok) {
            console.error("[cart/remove] KleverAPI error:", response.status, responseText);
            let errorData: any = { message: "Failed to remove cart item" };
            try { errorData = JSON.parse(responseText); } catch { }
            return NextResponse.json(errorData, { status: response.status });
        }

        let data: any = { success: true };
        if (responseText) {
            try { data = JSON.parse(responseText); } catch { data = { success: true }; }
        }
        return NextResponse.json(data);
    } catch (error) {
        console.error("[cart/remove] Proxy DELETE Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
