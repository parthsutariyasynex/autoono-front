import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api/magento-url";

export async function POST(req: Request) {
    try {
        const baseUrl = getBaseUrl(req);

        const body = await req.json();
        console.log(">>> RESET PASSWORD PROXY BODY:", body);

        const response = await fetch(
            `${baseUrl}/forget-password-mobile/reset`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    platform: "web"
                },
                body: JSON.stringify(body)
            }
        );

        const data = await response.json();
        console.log(">>> RESET PASSWORD PROXY RESPONSE:", {
            status: response.status,
            data
        });

        return NextResponse.json(data, { status: response.status });

    } catch (error: any) {

        return NextResponse.json(
            { message: error.message || "Server Error" },
            { status: 500 }
        );

    }
}
