import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const baseUrl = getBaseUrl(request);

        const res = await fetch(`${baseUrl}/login/email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: body.username || body.email,
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
