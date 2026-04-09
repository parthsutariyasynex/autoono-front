import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

// BASE_URL is now obtained per-request via getBaseUrl(request)

export async function POST(request: NextRequest) {
    try {
        const BASE_URL = getBaseUrl(request);
        let token: string | null = null;

        const authHeader = request.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
            token = authHeader.substring(7).replace(/['"]/g, "").trim();
        }

        if (!token) {
            token = request.cookies.get("auth-token")?.value?.replace(/['"]/g, "").trim() || null;
        }

        if (!token || token === "null" || token === "undefined") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Expected JSON Body: { fileContent: "base64..." }
        const body = await request.json();

        if (!body.fileContent) {
            return NextResponse.json({ message: "No file content provided" }, { status: 400 });
        }

        // Mageplaza Quick Order Upload CSV API
        const magentoUrl = `${BASE_URL}/quick-order/upload-csv`;

        console.log("[quick-order/upload-csv] Uploading base64 content to:", magentoUrl);

        const res = await fetch(magentoUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                fileContent: body.fileContent,
                file_name: body.fileName || "quick_order.csv" // Optional: preserve original name if sent
            }),
        });

        const responseText = await res.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch {
            data = { message: "Failed to parse backend response", raw: responseText };
        }

        if (!res.ok) {
            console.error("[quick-order/upload-csv] Magento error:", res.status, data);
            return NextResponse.json(data, { status: res.status });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error("[quick-order/upload-csv] Catch Error:", error.message);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
