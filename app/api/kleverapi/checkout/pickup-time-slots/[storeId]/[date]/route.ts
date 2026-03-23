import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function GET(
    req: Request,
    { params }: { params: { storeId: string; date: string } }
) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { storeId, date } = await params;

        const response = await fetch(`${BASE_URL}/checkout/pickup-time-slots/${storeId}/${date}`, {
            method: "GET",
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
                platform: "web",
            },
            cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Pickup Time Slots API error:", response.status, data);
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy Pickup Time Slots Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
