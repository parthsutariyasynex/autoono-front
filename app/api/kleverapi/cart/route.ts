import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

/* =========================
   GET CART (KleverAPI)
========================= */
export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");

        // Note: Removing the strict 401 requirement if you want to support guest carts,
        // but keeping it as you manually added it.
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized: Missing customer token" }, { status: 401 });
        }

        const BASE_URL = getBaseUrl(req);
        const response = await fetch(`${BASE_URL}/cart`, {
            method: "GET",
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
                platform: "web",
            },
            cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Cart API error:", response.status, data);
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy GET Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
