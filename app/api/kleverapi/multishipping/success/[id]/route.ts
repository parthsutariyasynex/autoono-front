import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

// BASE_URL is now obtained per-request via getBaseUrl(request)

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const BASE_URL = getBaseUrl(req);
        const { id: orderId } = await params;
        const authHeader = req.headers.get("authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        console.log(`>>> Multi-Shipping Success GET REQUEST for Order: ${orderId}`);

        const response = await fetch(`${BASE_URL}/multishipping/success/${orderId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: authHeader as string,
                platform: "web",
                accept: "application/json",
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
