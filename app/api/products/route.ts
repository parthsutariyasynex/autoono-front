import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";

export async function GET(req: NextRequest) {
    const token = await getRequestToken(req);

    const { searchParams } = new URL(req.url);
    const baseUrl = getBaseUrl(req);

    // Base Magento Products API - more robust URL construction
    // baseUrl is expected to be e.g. .../rest/en/V1/kleverapi
    const magentoBase = baseUrl.split("/kleverapi")[0];
    const magentoUrl = new URL(`${magentoBase}/products`);

    let filterGroupIndex = 0;

    // Fixed filters mapping
    const name = searchParams.get("_name");
    const minPrice = searchParams.get("_minPrice");
    const maxPrice = searchParams.get("_maxPrice");
    const latest = searchParams.get("_latest");

    if (name) {
        magentoUrl.searchParams.append(`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][field]`, "name");
        magentoUrl.searchParams.append(`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][value]`, `%${name}%`);
        magentoUrl.searchParams.append(`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][condition_type]`, "like");
        filterGroupIndex++;
    }

    if (minPrice) {
        magentoUrl.searchParams.append(`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][field]`, "price");
        magentoUrl.searchParams.append(`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][value]`, minPrice);
        magentoUrl.searchParams.append(`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][condition_type]`, "gteq");
        filterGroupIndex++;
    }

    if (maxPrice) {
        magentoUrl.searchParams.append(`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][field]`, "price");
        magentoUrl.searchParams.append(`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][value]`, maxPrice);
        magentoUrl.searchParams.append(`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][condition_type]`, "lteq");
        filterGroupIndex++;
    }

    if (latest === "true") {
        magentoUrl.searchParams.append(`searchCriteria[sortOrders][0][field]`, "created_at");
        magentoUrl.searchParams.append(`searchCriteria[sortOrders][0][direction]`, "DESC");
    }

    // Dynamic filters loop
    searchParams.forEach((value, key) => {
        // Skip our fixed param keys and locale params
        if (key.startsWith("_") || key === "lang") return;

        // E.g., brand=29, category_id=5
        const values = value.split(",");

        magentoUrl.searchParams.append(`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][field]`, key);
        magentoUrl.searchParams.append(`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][value]`, value);

        if (values.length > 1) {
            magentoUrl.searchParams.append(`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][condition_type]`, "in");
        } else {
            magentoUrl.searchParams.append(`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][condition_type]`, "eq");
        }

        filterGroupIndex++;
    });

    // Default category fallback if category_id not strictly set
    if (!searchParams.has("category_id")) {
        magentoUrl.searchParams.append(`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][field]`, "category_id");
        magentoUrl.searchParams.append(`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][value]`, "5");
        magentoUrl.searchParams.append(`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][condition_type]`, "eq");
        filterGroupIndex++;
    }

    // Defaults
    magentoUrl.searchParams.append("searchCriteria[pageSize]", "50");

    try {
        const res = await fetch(magentoUrl.toString(), {
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "platform": "web",
            },
            cache: "no-store"
        });

        const contentType = res.headers.get("content-type");
        let data;
        if (contentType && contentType.includes("application/json")) {
            data = await res.json();
        } else {
            data = { message: await res.text() };
        }

        if (!res.ok) {
            console.error(`[products] Magento Error ${res.status}:`, data);
            return NextResponse.json(data, { status: res.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("[products] Exception:", error.message);
        return NextResponse.json({ error: error.message || "Failed to fetch products" }, { status: 500 });
    }
}
