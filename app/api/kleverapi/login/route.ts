import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const magentoUrl = process.env.MAGENTO_AUTH_TOKEN_URL || "";

        if (!magentoUrl) {
            return NextResponse.json({ message: "Auth URL not configured" }, { status: 500 });
        }

        const res = await fetch(magentoUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: body.username,
                password: body.password,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(data, { status: res.status });
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || "Login failed" }, { status: 500 });
    }
}
