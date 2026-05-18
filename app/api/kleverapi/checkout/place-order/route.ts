import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

// BASE_URL is now obtained per-request via getBaseUrl(req)

export async function POST(req: Request) {
    try {
        const BASE_URL = getBaseUrl(req);
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        console.log(">>> Place Order REQUEST:", body);

        const response = await fetch(`${BASE_URL}/checkout/place-order`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
                platform: "web",
            },
            body: JSON.stringify(body),
        });

        const responseText = await response.text();
        console.log("<<< Place Order RESPONSE:", response.status, responseText);

        if (!response.ok) {
            let errorData;
            try {
                errorData = JSON.parse(responseText);
            } catch {
                errorData = { message: responseText };
            }
            return NextResponse.json(errorData, { status: response.status });
        }

        let data: any;
        try {
            data = JSON.parse(responseText);
        } catch {
            return NextResponse.json({ message: "Invalid response from server" }, { status: 500 });
        }

        // Normalize: if Magento returns a plain order ID (number or string), wrap it
        if (typeof data !== 'object' || data === null) {
            data = { order_id: data, order_increment_id: String(data) };
        }
        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy Place Order Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
