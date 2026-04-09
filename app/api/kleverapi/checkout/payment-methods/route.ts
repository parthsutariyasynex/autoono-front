import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

// BASE_URL is now obtained per-request via getBaseUrl(request)

export async function GET(req: Request) {
    try {
        const BASE_URL = getBaseUrl(req);
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.includes("null") || authHeader.includes("undefined")) {
            console.error("Payment Methods Proxy: Invalid token:", authHeader);
            return NextResponse.json({ message: "Unauthorized: Invalid token format" }, { status: 401 });
        }

        console.log(`>>> Payment Methods GET REQUEST: ${BASE_URL}/checkout/payment-methods`);

        const response = await fetch(`${BASE_URL}/checkout/payment-methods`, {
            method: "GET",
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
                accept: "application/json",
                platform: "web",
            },
            cache: "no-store",
        });

        // Safe response parsing
        const responseText = await response.text();
        let data;
        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch (err) {
            console.error(`<<< Payment Methods GET RESPONSE: ${response.status} (FAILED TO PARSE JSON)`, responseText);
            return NextResponse.json(
                { message: "Invalid backend response format", details: responseText.substring(0, 200) },
                { status: 502 }
            );
        }

        console.log(`<<< Payment Methods GET RESPONSE: ${response.status}`, data);

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Proxy GET Payment Methods Error:", error);
        return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
    }
}
