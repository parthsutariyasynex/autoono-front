import { NextResponse } from "next/server";
import { getBaseUrl, getGlobalBaseUrl } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";

// BASE_URL is now obtained per-request via getBaseUrl(req)

export async function GET(req: any) {
    try {
        const BASE_URL = getBaseUrl(req);
        const { searchParams } = new URL(req.url);
        const pageSize = searchParams.get("pageSize") || "15";
        const currentPage = searchParams.get("currentPage") || "1";

        const token = await getRequestToken(req);

        if (!token) {
            console.warn("[Notifications Proxy] No token found");
            return NextResponse.json({ message: "Unauthorized: Missing customer token" }, { status: 401 });
        }

        const url = `${BASE_URL}/notifications?pageSize=${pageSize}&currentPage=${currentPage}`;
        console.log("[Notifications Proxy] Fetching from Magento:", url);

        let response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "platform": "web",
            },
            cache: "no-store",
        });

        let data = await response.json();

        // --- FALLBACK STRATEGY ---
        if (response.status === 404) {
            const globalBase = getGlobalBaseUrl(req);
            const globalUrl = `${globalBase}/notifications?pageSize=${pageSize}&currentPage=${currentPage}`;
            if (globalUrl !== url) {
                console.log(`[Notifications Proxy] Not found at ${url}. Retrying global URL: ${globalUrl}`);
                const fallbackResponse = await fetch(globalUrl, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                        "platform": "web",
                    },
                    cache: "no-store",
                });
                if (fallbackResponse.ok) {
                    data = await fallbackResponse.json();
                    response = fallbackResponse;
                }
            }
        }

        console.log("[Notifications Proxy] Magento Response Status:", response.status);

        if (!response.ok) {
            console.error("[Notifications Proxy] Magento error:", response.status, JSON.stringify(data).substring(0, 500));
            return NextResponse.json(data, { status: response.status });
        }

        // Normalize: find the notification items array from whatever key Magento uses
        let items: any[] = [];
        if (Array.isArray(data)) {
            items = data;
        } else {
            // Try common Magento response field names
            for (const key of Object.keys(data)) {
                if (Array.isArray(data[key]) && data[key].length > 0) {
                    console.log("[Notifications] Found items array in key:", key, "count:", data[key].length);
                    items = data[key];
                    break;
                }
            }
        }

        // Return normalized response
        return NextResponse.json({
            items,
            total_count: data.total_count ?? data.totalCount ?? items.length,
            unread_count: data.unread_count ?? data.unreadCount ?? 0,
        });
    } catch (error) {
        console.error("Proxy GET Notifications Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
