import { NextResponse } from "next/server";
import { getBaseUrl, getGlobalBaseUrl, getStoreBaseUrl } from "@/lib/api/magento-url";

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const storeCode = searchParams.get("store") || searchParams.get("storeCode");

        const forwardParams = new URLSearchParams(searchParams.toString());
        forwardParams.delete("store");
        forwardParams.delete("storeCode");
        const queryString = forwardParams.toString();

        const fetchHeaders = {
            "Content-Type": "application/json",
            Authorization: authHeader,
            platform: "web",
        };

        // Try store URL first, then locale URL, then global V1 (matches live site)
        const baseUrls: string[] = storeCode
            ? [getStoreBaseUrl(storeCode), getGlobalBaseUrl(request)]
            : [getBaseUrl(request), getGlobalBaseUrl(request)];

        let response: Response | null = null;
        let lastUrl = "";

        for (const base of baseUrls) {
            const url = `${base}/product-search${queryString ? `?${queryString}` : ""}`;
            lastUrl = url;
            const t0 = Date.now();
            const res = await fetch(url, { method: "GET", headers: fetchHeaders, cache: "no-store" });
            console.log(`[product-search] ⏱ ${Date.now() - t0}ms (${res.status}) q=${searchParams.get("query")} → ${url}`);
            if (res.ok) { response = res; break; }
            if (res.status !== 404) { response = res; break; } // non-404 error — don't retry
        }

        if (!response) {
            return NextResponse.json({ message: "Product search failed" }, { status: 502 });
        }

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
            { message: error.message || "Server error searching products" },
            { status: 500 }
        );
    }
}
