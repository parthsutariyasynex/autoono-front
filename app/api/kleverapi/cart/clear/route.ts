import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

/* =========================
   CLEAR CART (KleverAPI)
   POST /api/kleverapi/cart/clear
========================= */
export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const response = await fetch(`${BASE_URL}/cart/clear`, {
            method: "POST",
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error("Clear Cart API error:", response.status, errBody);
            return NextResponse.json(
                { message: "Failed to clear cart", details: errBody },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy Clear Cart Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
