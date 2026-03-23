import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.includes("null") || authHeader.includes("undefined")) {
            console.error("PO Upload Proxy: Missing or invalid token header:", authHeader);
            return NextResponse.json({ message: "Unauthorized: Invalid token format" }, { status: 401 });
        }

        console.log(">>> PO Upload GET REQUEST");

        const response = await fetch(`${BASE_URL}/checkout/po-upload`, {
            method: "GET",
            headers: {
                Authorization: authHeader,
                platform: "web",
            },
        });

        const data = await response.json();
        console.log("<<< PO Upload GET RESPONSE:", response.status);

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy PO Upload GET Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
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
