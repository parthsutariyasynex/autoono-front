import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        // Use a more robust normalization to match the expected https://altalayi-demo.btire.com/rest/V1/kleverapi format
        const cleanBaseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/https?:\/\/[^\/]+(\/en)?\/rest\/en/, 'https://altalayi-demo.btire.com/rest');
        const response = await fetch(`${cleanBaseUrl}/change-password`, {
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
            console.error("Change Password API error:", response.status, data);
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy POST Change Password Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
