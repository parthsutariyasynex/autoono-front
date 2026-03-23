import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.includes("null") || authHeader.includes("undefined")) {
            console.error("[Pickup Stores Proxy] Missing or invalid token format:", authHeader);
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const url = `${BASE_URL}/checkout/pickup-stores`;
        console.log("[Pickup Stores Proxy] Fetching from Magento:", url);

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": authHeader,
                "Content-Type": "application/json",
                "platform": "web",
            },
            cache: "no-store",
        });

        const data = await response.json();
        console.log("[Pickup Stores Proxy] Magento Response Status:", response.status);

        if (!response.ok) {
            console.error("[Pickup Stores Proxy] Magento API error:", response.status, JSON.stringify(data).substring(0, 500));
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy Pickup Stores Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
