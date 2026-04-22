import { NextResponse } from "next/server";
import { APP_NAMESPACE, AUTH_COOKIE_NAMES } from "@/lib/auth/constants";

/**
 * Expires every auth cookie this project owns — including HttpOnly ones
 * which the client cannot clear from JS.
 *
 * Called from handleGlobalLogout() so multi-project localhost setups
 * don't leave a stale session cookie behind that another project (or a
 * stale tab on this one) could pick up.
 */
function expire(res: NextResponse, name: string) {
    res.cookies.set(name, "", {
        path: "/",
        maxAge: 0,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    });
}

export async function POST() {
    const res = NextResponse.json({ ok: true });

    const names = new Set<string>([
        ...AUTH_COOKIE_NAMES,
        `${APP_NAMESPACE}.callback-url`,
        // Legacy / default NextAuth cookies — clear in case they exist from
        // a previous build or another localhost project on the same host.
        "next-auth.session-token",
        "next-auth.csrf-token",
        "next-auth.callback-url",
        "__Secure-next-auth.session-token",
        "__Host-next-auth.csrf-token",
    ]);

    for (const name of names) expire(res, name);
    return res;
}
