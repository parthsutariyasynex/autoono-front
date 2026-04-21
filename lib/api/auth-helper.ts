import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Robust token extraction for API route handlers.
 * Checks:
 * 1. Authorization: Bearer <token> header
 * 2. NextAuth JWT cookie
 * 3. auth-token cookie
 */
export async function getRequestToken(req: Request | NextRequest): Promise<string | null> {
    let token: string | null = null;

    // 1. Check Authorization header
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
        token = authHeader.substring(7).replace(/['"]/g, "").trim();
    }

    // 2. Check NextAuth JWT (if secret is available)
    if (!token && process.env.NEXTAUTH_SECRET) {
        try {
            // getToken expects NextRequest but works with Request if passed carefully
            const jwt = await getToken({
                req: req as any,
                secret: process.env.NEXTAUTH_SECRET,
                cookieName: "autoono.session-token",
            });
            token = (jwt as any)?.accessToken || null;
        } catch (e) {
            console.error("[auth-helper] NextAuth getToken error:", e);
        }
    }

    // 3. Fallback to auth-token cookie directly
    if (!token) {
        const cookieHeader = req.headers.get("cookie") || "";
        const match = cookieHeader.match(/auth-token=([^;]+)/);
        if (match) {
            token = decodeURIComponent(match[1]).replace(/['"]/g, "").trim();
        }
    }

    // Clean up "null" or "undefined" strings
    if (token === "null" || token === "undefined" || !token) {
        return null;
    }

    return token;
}
