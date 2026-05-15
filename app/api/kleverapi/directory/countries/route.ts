import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

export async function GET(req: Request) {
    try {
        const BASE_URL = getBaseUrl(req);
        const magentoUrl = `${BASE_URL}/directory/countries`;

        console.log(`>>> Fetch Countries REQUEST: ${magentoUrl}`);

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
        console.error("Proxy GET Countries Error:", error);
        return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
    }
}
