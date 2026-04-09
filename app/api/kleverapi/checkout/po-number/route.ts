import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

// BASE_URL is now obtained per-request via getBaseUrl(request)

export async function POST(req: Request) {
    try {
        const BASE_URL = getBaseUrl(req);
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        console.log(">>> PO Number REQUEST:", body);

        const response = await fetch(`${BASE_URL}/checkout/po-number`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
                platform: "web",
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        console.log("<<< PO Number RESPONSE:", response.status);

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy PO Number Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
