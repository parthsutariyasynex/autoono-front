import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.includes("null") || authHeader.includes("undefined")) {
            console.error("Shipping Methods Proxy: Missing or invalid token header:", authHeader);
            return NextResponse.json({ message: "Unauthorized: Invalid token format" }, { status: 401 });
        }

        const response = await fetch(`${BASE_URL}/checkout/shipping-methods`, {
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
            console.error("<<< Shipping Methods API Error:", response.status, data);
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        // console.error("Proxy Shipping Methods Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.includes("null") || authHeader.includes("undefined")) {
            console.error("Shipping Methods Proxy: Missing or invalid token header:", authHeader);
            return NextResponse.json({ message: "Unauthorized: Invalid token format" }, { status: 401 });
        }

        const body = await req.json();
        const response = await fetch(`${BASE_URL}/checkout/shipping-methods`, {
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
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        // console.error("Proxy Set Shipping Method Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
