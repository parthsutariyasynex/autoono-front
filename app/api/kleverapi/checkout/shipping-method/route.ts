import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        console.log(">>> Set Shipping Method (Singular) REQUEST:", body);

        const response = await fetch(`${BASE_URL}/checkout/shipping-method`, {
            method: "POST",
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
                platform: "web",
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        console.log("<<< Set Shipping Method (Singular) RESPONSE:", response.status);

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy Set Shipping Method (Singular) Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
