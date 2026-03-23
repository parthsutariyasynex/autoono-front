import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        console.log(">>> Multishipping Start REQUEST");

        const response = await fetch(`${BASE_URL}/multishipping/start`, {
            method: "POST",
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
                platform: "web",
            },
        });

        const data = await response.json();
        console.log("<<< Multishipping Start RESPONSE:", response.status);

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy Multishipping Start Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
