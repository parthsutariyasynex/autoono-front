import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    let token: string | null = null;
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7).replace(/['"]/g, "").trim();
    }
    if (!token || token === "null") {
        const session: any = await getServerSession(authOptions);
        token = session?.accessToken;
    }

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const width = searchParams.get("width");
    const height = searchParams.get("height");

    // Correctly encoding the parameters for the external fetch
    const encodedWidth = width ? encodeURIComponent(width) : '';
    const encodedHeight = height ? encodeURIComponent(height) : '';

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/tyre-size/rim?width=${encodedWidth}&height=${encodedHeight}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'platform': 'web'
            },
        }
    );

    const data = await res.json();
    return NextResponse.json(data);
}
