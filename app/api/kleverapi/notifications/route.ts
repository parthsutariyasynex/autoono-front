import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl, getGlobalBaseUrl } from "@/lib/api/magento-url";
import { getRequestToken } from "@/lib/api/auth-helper";
import axios from "axios";

export async function GET(req: NextRequest) {
    try {
        const BASE_URL = getBaseUrl(req);
        const { searchParams } = new URL(req.url);
        const pageSize = searchParams.get("pageSize") || "15";
        const currentPage = searchParams.get("currentPage") || "1";

        const tokenStart = Date.now();
        const token = await getRequestToken(req);
        const tokenEnd = Date.now();
        console.log(`[Notifications Proxy] Token retrieved in ${tokenEnd - tokenStart}ms`);

        if (!token) {
            console.warn("[Notifications Proxy] No token found");
            return NextResponse.json({ message: "Unauthorized: Missing customer token" }, { status: 401 });
        }

        const url = `${BASE_URL}/notifications?pageSize=${pageSize}&currentPage=${currentPage}`;
        console.log(`[Notifications Proxy] Fetching from Magento: ${url}`);

        let data: any;
        let status: number;

        try {
            const fetchStart = Date.now();
            const response = await axios.get(url, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "platform": "web",
                },
                timeout: 10000,
            });
            const fetchEnd = Date.now();
            console.log(`[Notifications Proxy] Axios completed in ${fetchEnd - fetchStart}ms`);
            data = response.data;
            status = response.status;
        } catch (error: any) {
            if (error.response?.status === 404) {
                const globalBase = getGlobalBaseUrl(req);
                const globalUrl = `${globalBase}/notifications?pageSize=${pageSize}&currentPage=${currentPage}`;
                if (globalUrl !== url) {
                    console.log(`[Notifications Proxy] Not found at ${url}. Retrying global URL: ${globalUrl}`);
                    const fallbackResponse = await axios.get(globalUrl, {
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json",
                            "platform": "web",
                        },
                        timeout: 10000,
                    });
                    data = fallbackResponse.data;
                    status = fallbackResponse.status;
                } else {
                    throw error;
                }
            } else {
                throw error;
            }
        }

        console.log("[Notifications Proxy] Magento Response Status:", status);

        // Normalize: find the notification items array from whatever key Magento uses
        let items: any[] = [];
        if (Array.isArray(data)) {
            items = data;
        } else {
            for (const key of Object.keys(data)) {
                if (Array.isArray(data[key]) && data[key].length > 0) {
                    items = data[key];
                    break;
                }
            }
        }

        return NextResponse.json({
            items,
            total_count: data.total_count ?? data.totalCount ?? items.length,
            unread_count: data.unread_count ?? data.unreadCount ?? 0,
        });
    } catch (error: any) {
        console.error("Proxy GET Notifications Error:", error.message);
        if (error.response) {
            console.error("Proxy GET Notifications Status:", error.response.status);
            return NextResponse.json(error.response.data, { status: error.response.status });
        }
        return NextResponse.json({ 
            message: "Internal server error",
            code: error.code || 'unknown'
        }, { status: 500 });
    }
}
