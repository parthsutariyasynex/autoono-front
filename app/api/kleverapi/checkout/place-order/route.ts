import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function POST(req: Request) {
    try {
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

        const data = JSON.parse(responseText);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy Place Order Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
