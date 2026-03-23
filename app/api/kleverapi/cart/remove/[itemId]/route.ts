import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function DELETE(req: Request, { params }: { params: { itemId: string } }) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { itemId } = params;

        const response = await fetch(`${BASE_URL}/cart/remove/${itemId}`, {
            method: "DELETE",
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error("Remove Cart API error:", response.status, errBody);
            return NextResponse.json(
                { message: "Failed to remove cart item", details: errBody },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy DELETE Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
