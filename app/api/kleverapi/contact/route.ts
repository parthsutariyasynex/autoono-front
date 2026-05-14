import { NextRequest, NextResponse } from "next/server";
import { getGlobalBaseUrl } from "@/lib/api/magento-url";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        // body: { name, email, comment, telephone }

        const url = `${getGlobalBaseUrl(request)}/contact`;

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify(body),
            cache: "no-store",
        });

        console.log(`[contact POST] ${res.status} → ${url}`);

        const text = await res.text();
        let data: any;
        try { data = JSON.parse(text); } catch { data = { message: text }; }

        if (!res.ok) {
            return NextResponse.json(
                { message: data?.message || "Failed to send message" },
                { status: res.status }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("[contact POST] exception:", error.message);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
