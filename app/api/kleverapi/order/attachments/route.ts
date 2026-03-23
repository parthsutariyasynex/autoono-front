import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const order_id = searchParams.get("order_id");
        const document_type = searchParams.get("document_type");
        const invoice_due = searchParams.get("invoice_due");

        const authHeader = request.headers.get("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Construct query parameters for Magento
        const params = new URLSearchParams();
        if (order_id) params.append("order_id", order_id);
        if (document_type && document_type !== "All") params.append("document_type", document_type);
        if (invoice_due && invoice_due !== "All") params.append("invoice_due", invoice_due);

        const queryString = params.toString();
        const magentoUrl = `${BASE_URL}/order/attachments${queryString ? `?${queryString}` : ""}`;

        const response = await fetch(magentoUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
                platform: "web",
            },
            cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { message: data.message || `Magento returned ${response.status}` },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || "Server error fetching order attachments" },
            { status: 500 }
        );
    }
}
