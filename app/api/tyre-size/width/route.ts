import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    let token: string | null = null;

    // 1. Try Header
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7).replace(/['"]/g, "").trim();
    }

    // 2. Try Session (only if token not found in header)
    if (!token || token === "null") {
        const session: any = await getServerSession(authOptions);
        token = session?.accessToken;
    }

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // This route (width) does not typically take search parameters for its primary function.
    // If it were to take parameters, they would be extracted here.
    // For example, if it needed a 'category' parameter:
    // const { searchParams } = new URL(request.url);
    // const category = searchParams.get("category");
    // const encodedCategory = category ? encodeURIComponent(category) : '';
    // const url = `${process.env.NEXT_PUBLIC_BASE_URL}/tyre-size/width${encodedCategory ? `?category=${encodedCategory}` : ''}`;

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/tyre-size/width`,
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
