import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

export async function GET(request: Request) {
    try {
        const BASE_URL = getBaseUrl(request);
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get("orderId");

        const authHeader = request.headers.get("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        let magentoUrl = `${BASE_URL}/payment-history`;
        if (orderId) {
            magentoUrl += `?orderId=${orderId}`;
        }

        const response = await fetch(magentoUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
                platform: "web",
            },
            cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { message: data.message || `Magento returned ${response.status}` },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || "Server error fetching payment history" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const BASE_URL = getBaseUrl(request);
        const authHeader = request.headers.get("Authorization");
        const body = await request.json();

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const response = await fetch(`${BASE_URL}/payment-history`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
                platform: "web",
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { message: data.message || `Magento returned ${response.status}` },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || "Server error creating payment record" },
            { status: 500 }
        );
    }
}
