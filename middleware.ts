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
const SKIP_PATHS = ["/api", "/_next", "/favicon.ico", "/logo", "/images", "/locales"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ── 1. Skip static assets & API routes ──────────────────────────────
    if (SKIP_PATHS.some((p) => pathname.startsWith(p))) {
        if (pathname.startsWith("/api")) {
            const clientLocale = request.headers.get("x-locale");
            const localeCookie = request.cookies.get(LOCALE_COOKIE)?.value;
            const locale = (clientLocale && isValidLocale(clientLocale))
                ? clientLocale
                : (localeCookie && isValidLocale(localeCookie))
                    ? localeCookie
                    : DEFAULT_LOCALE;

            const requestHeaders = new Headers(request.headers);
            requestHeaders.set("x-locale", locale);
            return NextResponse.next({
                request: { headers: requestHeaders },
            });
        }
        return NextResponse.next();
    }

    // ── 2. URL has locale prefix (/en/..., /ar/...) ─────────────────────
    const segments = pathname.split("/").filter(Boolean);
    const firstSegment = segments[0];

    if (firstSegment && isValidLocale(firstSegment)) {
        const locale = firstSegment;
        const pathnameWithoutLocale = "/" + segments.slice(1).join("/") || "/";

        const url = request.nextUrl.clone();
        url.pathname = pathnameWithoutLocale;

        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-locale", locale);

        const response = NextResponse.rewrite(url, {
            request: { headers: requestHeaders },
        });

        response.cookies.set(LOCALE_COOKIE, locale, {
            path: "/",
            maxAge: 60 * 60 * 24 * 365,
            sameSite: "lax",
        });
        response.headers.append(
            "Set-Cookie",
            `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`
        );

        // Root path "/" → redirect to login or products based on auth
        if (pathnameWithoutLocale === "/") {
            const isAuthenticated = await checkAuth(request);
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.pathname = isAuthenticated
                ? `/${locale}/products`
                : `/${locale}/login`;
            return NextResponse.redirect(redirectUrl);
        }

        // Public routes — no auth needed
        if (PUBLIC_ROUTES.some((route) => pathnameWithoutLocale.startsWith(route))) {
            return response;
        }

        // Protected routes — require auth
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

    // ── 3. No locale prefix → redirect to /{locale}/... ─────────────────
    const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
    const localeToUse = (cookieLocale && isValidLocale(cookieLocale)) ? cookieLocale : DEFAULT_LOCALE;

    const url = request.nextUrl.clone();
    url.pathname = `/${localeToUse}${pathname === "/" ? "" : pathname}`;

    const response = NextResponse.redirect(url);
    response.cookies.set(LOCALE_COOKIE, localeToUse, {
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
            secret: process.env.NEXTAUTH_SECRET || "yoursecret",
            secureCookie: process.env.NODE_ENV === "production",
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
