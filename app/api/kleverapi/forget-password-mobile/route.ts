import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

export async function POST(request: Request) {
    try {
        const BASE_URL = getBaseUrl(request);
        const body = await request.json();

        const response = await fetch(`${BASE_URL}/forget-password-mobile`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
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
            { message: error.message || "Server error processing forgot password" },
            { status: 500 }
        );
    }
}
