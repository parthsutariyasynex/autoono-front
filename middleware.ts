import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that DON'T need authentication
const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password"];

// Static assets and API routes to skip entirely
const SKIP_PATHS = ["/api", "/_next", "/favicon.ico", "/logo", "/images"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // --- Skip static assets and API routes ---
    if (SKIP_PATHS.some((path) => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // --- Allow public routes ---
    if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // --- Check authentication for ALL other routes ---

    // Method 1: Check NextAuth JWT cookie
    let isAuthenticated = false;
    try {
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
        });
        // Must have a valid accessToken AND no expiry error
        if (token?.accessToken && token?.error !== "MagentoTokenExpired") {
            isAuthenticated = true;
        }
    } catch { }

    // Method 2: Check custom auth-token cookie (set during login)
    if (!isAuthenticated) {
        const authCookie = request.cookies.get("auth-token");
        if (authCookie?.value && authCookie.value !== "null" && authCookie.value !== "undefined") {
            isAuthenticated = true;
        }
    }

    // Not authenticated → redirect to login
    if (!isAuthenticated) {
        const loginUrl = new URL("/login", request.url);
        // Save the FULL original URL (path + query params) so we can redirect back after login
        const fullPath = request.nextUrl.search
            ? `${pathname}${request.nextUrl.search}`
            : pathname;
        loginUrl.searchParams.set("callbackUrl", fullPath);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all routes except:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico
         * - logo directory
         * - images directory
         */
        "/((?!api|_next/static|_next/image|favicon.ico|logo|images).*)",
    ],
};
