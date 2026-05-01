import { NextResponse } from "next/server";
import { getBaseUrl, getStoreBaseUrl } from "@/lib/api/magento-url";

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const storeCode = searchParams.get("store") || searchParams.get("storeCode");

        // Use store-specific base URL if provided, otherwise fall back to locale-based base URL
        const BASE_URL = storeCode ? getStoreBaseUrl(storeCode) : getBaseUrl(request);

        // Strip routing-only params that belong in the URL path, not the query string.
        // store/storeCode is already encoded in BASE_URL (e.g. /rest/V101/V1/…);
        // forwarding them again as query params confuses Magento.
        const forwardParams = new URLSearchParams(searchParams.toString());
        forwardParams.delete("store");
        forwardParams.delete("storeCode");
        const queryString = forwardParams.toString();
        const url = `${BASE_URL}/product-search${queryString ? `?${queryString}` : ""}`;

        const t0 = Date.now();
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
                platform: "web",
            },
            cache: "no-store",
        });
        const tMagento = Date.now() - t0;
        console.log(`[product-search] ⏱ Magento ${tMagento}ms (${response.status}) q=${searchParams.get("query")} → ${url}`);

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
