import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

// BASE_URL is now obtained per-request via getBaseUrl(request)

export async function GET(req: Request) {
    try {
        const BASE_URL = getBaseUrl(req);
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.includes("null") || authHeader.includes("undefined")) {
            console.error("PO Upload Proxy: Missing or invalid token header:", authHeader);
            return NextResponse.json({ message: "Unauthorized: Invalid token format" }, { status: 401 });
        }

        const response = await fetch(`${BASE_URL}/checkout/po-upload`, {
            method: "GET",
            headers: {
                Authorization: authHeader,
                platform: "web",
                accept: "application/json",
            },
            cache: "no-store",
        });

        const responseText = await response.text();

        if (!response.ok) {
            console.error("PO Upload GET error:", response.status, responseText);
            return NextResponse.json({ error: "Failed to get PO upload", details: responseText }, { status: response.status });
        }

        try {
            const data = JSON.parse(responseText);
            return NextResponse.json(data);
        } catch (e) {
            // Return empty data if not valid JSON
            return NextResponse.json([]);
        }
    } catch (error: any) {
        console.error("Proxy PO Upload GET Error:", error);
        return NextResponse.json({ message: "Internal server error", details: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const BASE_URL = getBaseUrl(req);
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.includes("null") || authHeader.includes("undefined")) {
            console.error("PO Upload Proxy: Missing or invalid token header:", authHeader);
            return NextResponse.json({ message: "Unauthorized: Invalid token format" }, { status: 401 });
        }

        const formData = await req.formData();
        console.log(">>> PO Upload REQUEST: Multipart Data");

        const response = await fetch(`${BASE_URL}/checkout/po-upload`, {
            method: "POST",
            headers: {
                Authorization: authHeader,
                platform: "web",
                // Do not set Content-Type here, it will be set automatically with boundary for FormData
            },
            body: formData,
        });

        const data = await response.json();
        console.log("<<< PO Upload RESPONSE:", response.status);

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy PO Upload Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
