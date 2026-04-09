import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// ─── i18n config ────────────────────────────────────────────────────────────
const LOCALES = ["en", "ar"] as const;
type Locale = (typeof LOCALES)[number];
const DEFAULT_LOCALE: Locale = "en";
const LOCALE_COOKIE = "NEXT_LOCALE";

function isValidLocale(value: string): value is Locale {
    return LOCALES.includes(value as Locale);
}

// ─── Route config ───────────────────────────────────────────────────────────
const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/about", "/locations", "/guides", "/catalogue"];
const SKIP_PATHS = ["/api", "/_next", "/favicon.ico", "/logo", "/images"];

/**
 * Middleware handles two concerns:
 *
 * 1. LOCALE — Ensure every page URL has a locale prefix.
 *    /login       → redirect to /en/login
 *    /products    → redirect to /en/products
 *    /            → redirect to /en
 *    /en/login    → works (rewrite to /login)
 *    /ar/login    → works (rewrite to /login)
 *
 * 2. AUTH — Protected routes require a valid token.
 */
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ── 1. Skip static assets & API routes ──────────────────────────────
    if (SKIP_PATHS.some((p) => pathname.startsWith(p))) {
        if (pathname.startsWith("/api")) {
            const localeCookie = request.cookies.get(LOCALE_COOKIE)?.value;
            const locale = localeCookie && isValidLocale(localeCookie) ? localeCookie : DEFAULT_LOCALE;
            const response = NextResponse.next();
            response.headers.set("x-locale", locale);
            return response;
        }
        return NextResponse.next();
    }

    // ── 2. Check if URL already has a locale prefix ─────────────────────
    const segments = pathname.split("/").filter(Boolean);
    const firstSegment = segments[0];

    if (firstSegment && isValidLocale(firstSegment)) {
        // URL has locale → rewrite to the actual page path
        const locale = firstSegment;
        const pathnameWithoutLocale = "/" + segments.slice(1).join("/") || "/";

        const url = request.nextUrl.clone();
        url.pathname = pathnameWithoutLocale;

        // Pass locale to Layout via request headers
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-locale", locale);

        const response = NextResponse.rewrite(url, {
            request: {
                headers: requestHeaders,
            },
        });

        // Sync the locale cookie
        response.cookies.set(LOCALE_COOKIE, locale, {
            path: "/",
            maxAge: 60 * 60 * 24 * 365,
            sameSite: "lax",
        });

        // Auth check
        if (PUBLIC_ROUTES.some((route) => pathnameWithoutLocale.startsWith(route))) {
            return response;
        }

        const isAuthenticated = await checkAuth(request);
        if (!isAuthenticated) {
            const loginUrl = request.nextUrl.clone();
            loginUrl.pathname = `/${locale}/login`;
            loginUrl.search = "";
            loginUrl.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
            return NextResponse.redirect(loginUrl);
        }

        return response;
    }

    // ── 3. No locale prefix → redirect to /en/... (default locale) ──────
    //    /login              → /en/login
    //    /login?mode=password → /en/login?mode=password
    //    /products?page=2   → /en/products?page=2
    //    /                  → /en
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
    // url.search is preserved automatically by clone()

    const response = NextResponse.redirect(url);
    response.cookies.set(LOCALE_COOKIE, DEFAULT_LOCALE, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
    });

    return response;
}

/**
 * Combined authentication check
 */
async function checkAuth(request: NextRequest): Promise<boolean> {
    try {
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
        });
        if (token?.accessToken && token?.error !== "MagentoTokenExpired") {
            return true;
        }
    } catch { }

    const authCookie = request.cookies.get("auth-token");
    if (authCookie?.value && authCookie.value !== "null" && authCookie.value !== "undefined") {
        return true;
    }

    return false;
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|logo|images).*)",
    ],
};
