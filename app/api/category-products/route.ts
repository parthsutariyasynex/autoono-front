import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    try {
        // Step 1: Get token from header or session
        let token: string | null = null;
        const authHeader = request.headers.get("authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7).replace(/['"]/g, "").trim();
        }

        if (!token) {
            const session: any = await getServerSession(authOptions);
            token = session?.accessToken;
        }

        if (!token || token === "null" || token === "undefined") {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Step 2: Handle search parameters
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get("categoryId") || "5";
        const page = searchParams.get("page") || "1";
        const pageSize = searchParams.get("pageSize") || "20";

        // Step 3: Construct Magento URL manually (not via URLSearchParams)
        // so that commas in multi-value filters stay unencoded.
        const queryParts: string[] = [
            `categoryId=${encodeURIComponent(categoryId)}`,
            `searchCriteria[currentPage]=${encodeURIComponent(page)}`,
            `searchCriteria[pageSize]=${encodeURIComponent(pageSize)}`,
        ];

        // Same filter = OR (repeated params); different filters = AND.
        // Magento/KleverAPI expects repeated params for OR: itemCode=2709&itemCode=2602
        const reservedKeys = new Set(["categoryId", "page", "pageSize"]);
        const uniqueKeys = Array.from(new Set(Array.from(searchParams.keys())));

        uniqueKeys.forEach((key) => {
            if (reservedKeys.has(key)) return;
            const rawValues = searchParams.getAll(key);
            const values = rawValues
                .flatMap((v) => v.split(",").map((s) => s.trim()).filter(Boolean))
                .filter((v, i, arr) => arr.indexOf(v) === i);
            values.forEach((value) => {
                queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
            });
        });

        const magentoUrlStr = `${process.env.NEXT_PUBLIC_BASE_URL}/category-products?${queryParts.join("&")}`;
        console.log("Magento request URL:", magentoUrlStr);

        const res = await fetch(magentoUrlStr, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error("Magento category-products error:", res.status, errBody);
            return Response.json(
                { error: "Magento API error", details: errBody },
                { status: res.status }
            );
        }

        const data = await res.json();
        // DEBUG: Log first product's full structure to identify stock fields
        const items = data.products || data.items || [];
        if (items.length > 0) {
            console.log("=== FIRST PRODUCT ALL FIELDS ===");
            console.log(JSON.stringify(items[0], null, 2));
            console.log("=== FIELD NAMES ===", Object.keys(items[0]));
        }
        return Response.json(data);

    } catch (error: any) {
        console.error("category-products route error:", error.message);
        return Response.json(
            { error: "Failed to fetch products", message: error.message },
            { status: 500 }
        );
    }
}
