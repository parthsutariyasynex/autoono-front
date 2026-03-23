import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        const body = await req.json();

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized: Missing customer token" }, { status: 401 });
        }

        const response = await fetch(`${BASE_URL}/checkout/shipping-address`, {
            method: "POST",
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
                platform: "web",
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Set Shipping Address API error:", response.status, data);
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy POST Shipping Address Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
