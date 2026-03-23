import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized: Missing customer token" }, { status: 401 });
        }

        const response = await fetch(`${BASE_URL}/checkout/totals`, {
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
            console.error("Checkout Totals API error:", response.status, data);
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy GET Totals Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
