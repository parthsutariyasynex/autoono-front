import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

// BASE_URL is now obtained per-request via getBaseUrl(request)

export async function GET(req: Request) {
    try {
        const BASE_URL = getBaseUrl(req);
        const authHeader = req.headers.get("authorization");
        if (!authHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        console.log(">>> Fetch Multishipping Shipping Methods GET");

        const response = await fetch(`${BASE_URL}/multishipping/shipping-methods`, {
            method: "GET",
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
                platform: "web",
            },
            cache: "no-store",
        });

        const responseText = await response.text();
        console.log("<<< Fetch Multishipping Shipping Methods RESPONSE:", response.status, responseText);

        if (!response.ok) {
            let errorData;
            try { errorData = JSON.parse(responseText); } catch { errorData = { message: responseText }; }
            return NextResponse.json(errorData, { status: response.status });
        }

        const data = JSON.parse(responseText);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy Multishipping Shipping Methods Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const BASE_URL = getBaseUrl(req);
        const authHeader = req.headers.get("authorization");
        if (!authHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        console.log(">>> Set Multishipping Shipping Methods REQUEST:", JSON.stringify(body, null, 2));

        const response = await fetch(`${BASE_URL}/multishipping/shipping-methods`, {
            method: "POST",
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
                platform: "web",
            },
            body: JSON.stringify(body),
            cache: "no-store",
        });

        const responseText = await response.text();
        console.log("<<< Set Multishipping Shipping Methods RESPONSE:", response.status, responseText);

        if (!response.ok) {
            let errorData;
            try { errorData = JSON.parse(responseText); } catch { errorData = { message: responseText }; }
            return NextResponse.json(errorData, { status: response.status });
        }

        const data = JSON.parse(responseText);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy Set Multishipping Shipping Methods Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
