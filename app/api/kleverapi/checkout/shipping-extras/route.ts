import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.includes("null") || authHeader.includes("undefined")) {
            console.error("Shipping Extras Proxy: Missing or invalid token header:", authHeader);
            return NextResponse.json({ message: "Unauthorized: Invalid token format" }, { status: 401 });
        }

        const body = await req.json();
        console.log(">>> Shipping Extras REQUEST:", body);

        const response = await fetch(`${BASE_URL}/checkout/shipping-extras`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
                platform: "web",
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        console.log("<<< Shipping Extras RESPONSE:", response.status, data);

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy Shipping Extras Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
