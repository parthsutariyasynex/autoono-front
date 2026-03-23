import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized: Missing customer token" }, { status: 401 });
        }

        const body = await req.json();

        const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
        const EXTERNAL_URL = `${BASE_URL}/enquiry`;

        const response = await fetch(EXTERNAL_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error("Enquiry API error:", response.status, errBody);
            return NextResponse.json(
                { message: "Failed to submit enquiry", details: errBody },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy POST Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
