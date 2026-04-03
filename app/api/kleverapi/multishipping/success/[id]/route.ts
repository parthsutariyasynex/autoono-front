import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const orderId = params.id;
        console.log(`>>> Multi-Shipping Success GET REQUEST for Order: ${orderId}`);

        const response = await fetch(`${BASE_URL}/multishipping/success/${orderId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
                platform: "web",
            },
            cache: "no-store",
        });

        const responseText = await response.text();
        console.log(`<<< Multi-Shipping Success RESPONSE for Order ${orderId}:`, response.status, responseText);

        if (!response.ok) {
            let errorData;
            try {
                errorData = JSON.parse(responseText);
            } catch {
                errorData = { message: responseText };
            }
            return NextResponse.json(errorData, { status: response.status });
        }

        const data = JSON.parse(responseText);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy Multi-Shipping Success Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
