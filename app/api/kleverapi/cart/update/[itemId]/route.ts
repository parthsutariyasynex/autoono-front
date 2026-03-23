import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function PUT(req: Request, { params }: { params: Promise<{ itemId: string }> }) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { itemId } = await params;
        const body = await req.json();
        const { qty } = body;

        // Requirement: Send the updated quantity in the request body.
        const payload = { qty: Number(qty) };
        console.log(">>> Update Cart REQUEST:", `${BASE_URL}/cart/update/${itemId}`, payload);

        const response = await fetch(`${BASE_URL}/cart/update/${itemId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
            },
            body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        console.log("<<< Update Cart RESPONSE:", response.status, responseText);

        if (!response.ok) {
            console.error("Update Cart API error:", response.status, responseText);
            return NextResponse.json(
                { message: "Failed to update cart item", details: responseText },
                { status: response.status }
            );
        }

        const data = JSON.parse(responseText);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy PUT Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
