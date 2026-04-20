import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

// Proxies the Magento payment-history receipt PDF to the browser.
// Maps to: GET https://<magento>/rest/{locale}/V1/kleverapi/payment-history/{id}/download
// Locale comes from x-locale header / NEXT_LOCALE cookie / referer URL via getBaseUrl().
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const BASE_URL = getBaseUrl(request);
        const { id } = await params;
        const authHeader = request.headers.get("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const magentoUrl = `${BASE_URL}/payment-history/${id}/download`;

        const response = await fetch(magentoUrl, {
            method: "GET",
            headers: {
                Authorization: authHeader,
                Accept: "application/pdf, application/json",
                platform: "web",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            return NextResponse.json(
                { message: data.message || `Magento returned ${response.status}` },
                { status: response.status }
            );
        }

        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            const data = await response.json();
            if (data.success && data.base64) {
                const buffer = Buffer.from(data.base64, 'base64');
                const filename = data.filename || `receipt_${id}.pdf`;
                const mimeType = data.mime_type || "application/pdf";

                return new NextResponse(buffer, {
                    status: 200,
                    headers: {
                        "Content-Type": mimeType,
                        "Content-Disposition": `attachment; filename="${filename}"`,
                        "Cache-Control": "private, no-store",
                    },
                });
            } else {
                return NextResponse.json(
                    { message: data.message || "Failed to parse receipt data from JSON" },
                    { status: 400 }
                );
            }
        }

        // Fallback for direct binary stream if upstream returns it
        const upstreamType = contentType || "application/pdf";
        const upstreamDisposition =
            response.headers.get("content-disposition") ||
            `attachment; filename="receipt_${id}.pdf"`;

        const buffer = await response.arrayBuffer();
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": upstreamType,
                "Content-Disposition": upstreamDisposition,
                "Cache-Control": "private, no-store",
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || "Server error downloading receipt" },
            { status: 500 }
        );
    }
}
