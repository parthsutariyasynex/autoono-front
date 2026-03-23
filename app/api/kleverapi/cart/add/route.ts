import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { sku, qty } = body;

        const response = await fetch(`${BASE_URL}/cart/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
            },
            body: JSON.stringify({
                sku,
                qty
            }),
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error("Add to Cart API error:", response.status, errBody);
            return NextResponse.json(
                { message: "Failed to add to cart", details: errBody },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy POST Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
