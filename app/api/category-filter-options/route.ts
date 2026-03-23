import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const session: any = await getServerSession(authOptions);
        const token = session?.accessToken;

        if (!token) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const categoryId = searchParams.get("categoryId") || "5"; // Adjust if categoryId isn't needed

        const res = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/category-filter-options?categoryId=${categoryId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!res.ok) {
            return Response.json({ error: `API Error: ${res.status}` }, { status: res.status });
        }

        const data = await res.json();
        return Response.json(data);
    } catch (err: any) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}
