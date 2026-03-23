import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const session: any = await getServerSession(authOptions);
    const token = session?.accessToken;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    // Base Magento Products API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    const magentoUrl = new URL(baseUrl.split("/kleverapi")[0] + "/products");

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
        // Skip our fixed param keys
        if (key.startsWith("_")) return;

        // E.g., brand=29, category_id=5
        // A comma separated string implies multiple choices, we construct 'in'
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
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) {
            throw new Error(`API Error: ${res.status}`);
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Failed to fetch products" }, { status: 500 });
    }
}
