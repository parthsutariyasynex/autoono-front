import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const BASE_URL = getBaseUrl(request);
        const { orderId } = await params;
        const authHeader = request.headers.get("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        const response = await fetch(`${BASE_URL}/order/${orderId}/confirm`, {
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
            { message: error.message || "Server error confirming order" },
            { status: 500 }
        );
    }
}
