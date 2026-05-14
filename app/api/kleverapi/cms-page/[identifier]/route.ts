import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl, getGlobalBaseUrl } from "@/lib/api/magento-url";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ identifier: string }> }
) {
    try {
        const { identifier } = await params;

        const candidateUrls = [
            `${getBaseUrl(request)}/cms-page/${encodeURIComponent(identifier)}`,
            `${getGlobalBaseUrl(request)}/cms-page/${encodeURIComponent(identifier)}`,
        ];

        for (const url of candidateUrls) {
            let res: Response;
            try {
                res = await fetch(url, {
                    headers: { "Content-Type": "application/json" },
                    cache: "no-store",
                });
            } catch {
                continue;
            }

            console.log(`[cms-page] ${res.status} → ${url}`);
            if (!res.ok) continue;

            const data = await res.json();
            return NextResponse.json(data);
        }

        return NextResponse.json({ message: "CMS page not found" }, { status: 404 });
    } catch (error: any) {
        console.error("[cms-page GET] exception:", error.message);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
