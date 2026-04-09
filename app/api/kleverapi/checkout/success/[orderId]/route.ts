import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

// BASE_URL is now obtained per-request via getBaseUrl(request)

export async function GET(
    req: Request,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const BASE_URL = getBaseUrl(req);
        const { orderId } = await params;
        const authHeader = req.headers.get("authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.includes("null") || authHeader.includes("undefined")) {
            console.error("Checkout Success Proxy: Missing or invalid token header:", authHeader);
            return NextResponse.json({ message: "Unauthorized: Invalid token format" }, { status: 401 });
        }

        if (!orderId) {
            return NextResponse.json({ message: "Order ID is required" }, { status: 400 });
        }

        const response = await fetch(`${BASE_URL}/checkout/success/${orderId}`, {
            method: "GET",
            headers: {
                Authorization: authHeader as string,
                "Content-Type": "application/json",
                platform: "web",
                accept: "application/json",
            },
            cache: "no-store",
        });

        const responseText = await response.text();

        if (!response.ok) {
            console.error("Checkout Success API error:", response.status, responseText);
            return NextResponse.json({ error: "Failed to get success data", details: responseText }, { status: response.status });
        }

        try {
            const data = JSON.parse(responseText);
            return NextResponse.json(data);
        } catch (e) {
            console.error("Checkout Success JSON Parse Error. Raw:", responseText);
            return NextResponse.json({ error: "Invalid JSON from Magento", raw: responseText }, { status: 500 });
        }
    } catch (error: any) {
        console.error("Proxy GET Checkout Success Error:", error);
        return NextResponse.json({ message: "Internal server error", details: error.message }, { status: 500 });
    }
}
