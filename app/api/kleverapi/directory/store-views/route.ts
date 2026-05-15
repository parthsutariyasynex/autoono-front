import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

export async function GET(req: Request) {
    try {
        const BASE_URL = getBaseUrl(req);
        // Magento store views API
        const magentoUrl = `${BASE_URL}/store/storeViews`;

        console.log(`>>> Fetch Store Views REQUEST: ${magentoUrl}`);

        const response = await fetch(magentoUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                accept: "application/json",
                platform: "web",
            },
            next: { revalidate: 3600 }
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Proxy GET Store Views Error:", error);
        return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
    }
}
