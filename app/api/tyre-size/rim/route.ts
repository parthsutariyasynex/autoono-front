import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const session: any = await getServerSession(authOptions);
    const token = session?.accessToken;

    if (!token) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const width = searchParams.get("width");
    const height = searchParams.get("height");

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/tyre-size/rim?width=${width}&height=${height}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    const data = await res.json();
    return Response.json(data);
}
