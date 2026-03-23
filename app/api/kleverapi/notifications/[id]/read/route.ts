import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const authHeader = req.headers.get("authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized: Missing customer token" }, { status: 401 });
        }

        const url = `${BASE_URL}/notifications/${id}/read`;
        console.log("[Notification Read] Calling:", url);

        // Try PUT first (standard Magento update), fallback to POST
        let response = await fetch(url, {
            method: "PUT",
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
                platform: "web",
            },
        });

        // If PUT returns 404 or 405, try POST as fallback
        if (response.status === 404 || response.status === 405) {
            console.log("[Notification Read] PUT failed with", response.status, "— trying POST");
            response = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: authHeader,
                    "Content-Type": "application/json",
                    platform: "web",
                },
            });
        }

        const text = await response.text();
        console.log("[Notification Read] Status:", response.status, "Response:", text.substring(0, 300));

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            // Magento may return plain true/false
            data = { success: text.trim() === "true", raw: text };
        }

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Proxy Mark Notification Read Error:", error);
        return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
    }
}
