import { NextResponse } from "next/server";
import { getBaseUrl, getLocaleBaseUrl, getStandardRestBase } from "@/lib/api/magento-url";

export async function PUT(req: Request, { params }: { params: Promise<{ itemId: string }> }) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { itemId } = await params;
        const body = await req.json();
        const { qty, cart_id } = body;
        const qtyNum = Number(qty);

        const headers = {
            "Content-Type": "application/json",
            Authorization: authHeader,
        };

        // 1. Try KleverAPI endpoint
        const kleverUrl = `${getBaseUrl(req)}/cart/update/${itemId}`;
        console.log(">>> Update Cart REQUEST:", kleverUrl, { qty: qtyNum });
        let response = await fetch(kleverUrl, {
            method: "PUT",
            headers,
            body: JSON.stringify({ qty: qtyNum }),
        });
        let responseText = await response.text();
        console.log("<<< Update Cart RESPONSE:", response.status, responseText);

        // 2. If KleverAPI warehouse store returns 404/405, try with locale-only store (e.g. V101_en → en)
        if (response.status === 404 || response.status === 405) {
            console.log(`[cart/update] KleverAPI 404 for item ${itemId}, trying locale-base URL`);
            const localeUrl = `${getLocaleBaseUrl(req)}/cart/update/${itemId}`;
            if (localeUrl !== kleverUrl) {
                const localeResponse = await fetch(localeUrl, {
                    method: "PUT",
                    headers,
                    body: JSON.stringify({ qty: qtyNum }),
                });
                const localeText = await localeResponse.text();
                console.log("[cart/update] locale-base RESPONSE:", localeResponse.status, localeText);
                if (localeResponse.ok) {
                    let d: any = { success: true };
                    if (localeText) { try { d = JSON.parse(localeText); } catch { } }
                    return NextResponse.json(d);
                }
            }

            // 3. Final fallback: standard Magento REST endpoint
            console.log(`[cart/update] locale-base failed, trying standard REST`);
            const restBase = getStandardRestBase(req);

            // Magento requires quote_id for PUT /carts/mine/items; fetch it if not in body
            let quoteId: string | null = cart_id ? String(cart_id) : null;
            if (!quoteId) {
                try {
                    const cartInfoRes = await fetch(`${restBase}/carts/mine`, {
                        method: "GET",
                        headers: { Authorization: authHeader, "Content-Type": "application/json" },
                        cache: "no-store",
                    });
                    if (cartInfoRes.ok) {
                        const cartInfo = await cartInfoRes.json();
                        quoteId = cartInfo.id ? String(cartInfo.id) : null;
                    }
                } catch { /* proceed without quote_id */ }
            }

            const fallbackUrl = `${restBase}/carts/mine/items/${itemId}`;
            const fallbackBody: any = {
                cartItem: { item_id: Number(itemId), qty: qtyNum },
            };
            if (quoteId) fallbackBody.cartItem.quote_id = quoteId;

            const fallbackResponse = await fetch(fallbackUrl, {
                method: "PUT",
                headers,
                body: JSON.stringify(fallbackBody),
            });
            const fallbackText = await fallbackResponse.text();
            console.log("[cart/update] standard REST RESPONSE:", fallbackResponse.status, fallbackText);

            if (!fallbackResponse.ok) {
                let errorData: any = { message: "Failed to update cart item" };
                try { errorData = JSON.parse(fallbackText); } catch { }
                return NextResponse.json(errorData, { status: fallbackResponse.status });
            }

            let data: any = { success: true };
            if (fallbackText) {
                try { data = JSON.parse(fallbackText); } catch { data = { success: true }; }
            }
            return NextResponse.json(data);
        }

        if (!response.ok) {
            console.error("[cart/update] KleverAPI error:", response.status, responseText);
            let errorData: any = { message: "Failed to update cart item" };
            try { errorData = JSON.parse(responseText); } catch { }
            return NextResponse.json(errorData, { status: response.status });
        }

        let data: any = { success: true };
        if (responseText) {
            try { data = JSON.parse(responseText); } catch { data = { success: true }; }
        }
        return NextResponse.json(data);
    } catch (error) {
        console.error("[cart/update] Proxy PUT Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
