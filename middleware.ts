import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { SESSION_COOKIE_NAME } from "./lib/auth/constants";

// ─── i18n config ────────────────────────────────────────────────────────────
const LOCALES = ["en", "ar"] as const;
type Locale = (typeof LOCALES)[number];
const DEFAULT_LOCALE: Locale = "en";
const LOCALE_COOKIE = "NEXT_LOCALE";

function isValidLocale(value: string): value is Locale {
    return LOCALES.includes(value as Locale);
}

// Magento warehouse store codes look like V101_en, V102_ar, Anwar_en, etc.
// They always end with _en or _ar.
const STORE_CODE_RE = /^[A-Za-z0-9]+_(en|ar)$/;
function isStoreCode(value: string): boolean {
    return STORE_CODE_RE.test(value);
}

// ─── Route config ───────────────────────────────────────────────────────────
const PUBLIC_ROUTES = ["/login", "/forgot-password", "/about", "/locations", "/guides", "/catalogue", "/privacy-policy", "/return-exchange-policy", "/terms-conditions"];
const SKIP_PATHS = ["/api", "/_next", "/favicon.ico", "/logo", "/images", "/locales"];

// Magento SEO paths → Next.js internal routes (prefix match).
const MAGENTO_PATH_REWRITES: Record<string, string> = {
    "/all-tyres": "/products",
    "/all-lubricants": "/products",
    "/lubricants": "/products",
    "/tyres": "/products",
    "/about-us": "/about",
    "/branch-locations": "/locations",
    "/user-guides": "/guides",
    "/product-catalogue": "/catalogue",
};

function applyPathRewrites(cleanPath: string): string {
    for (const [from, to] of Object.entries(MAGENTO_PATH_REWRITES)) {
        if (cleanPath === from || cleanPath.startsWith(from + "/")) return to;
    }
    return cleanPath;
}

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
            return NextResponse.next({ request: { headers: requestHeaders } });
        }
        return NextResponse.next();
    }

    const segments = pathname.split("/").filter(Boolean);
    const firstSegment = segments[0];

    // ── 2a. Store-code prefix (/V101_en/..., /V102_ar/...) ──────────────
    // These match the live Magento site URL format.
    if (firstSegment && isStoreCode(firstSegment)) {
        const storeCode = firstSegment;
        // Extract locale from store code suffix (V101_en → en, V102_ar → ar)
        const localeSuffix = storeCode.split("_").pop() || DEFAULT_LOCALE;
        const locale: Locale = isValidLocale(localeSuffix) ? localeSuffix : DEFAULT_LOCALE;

        const rawPath = "/" + segments.slice(1).join("/") || "/";
        const cleanPath = rawPath.replace(/\.html$/, "");
        const targetPath = applyPathRewrites(cleanPath);

        const url = request.nextUrl.clone();
        url.pathname = targetPath;

        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-locale", locale);
        requestHeaders.set("x-store-code", storeCode);

        const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });

        // Set locale cookie (not the store code)
        response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });

        // Public routes — no auth needed
        if (PUBLIC_ROUTES.some((r) => targetPath.startsWith(r))) return response;

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

    // ── 2b. Locale prefix (/en/..., /ar/...) ────────────────────────────
    if (firstSegment && isValidLocale(firstSegment)) {
        const locale = firstSegment;
        const rawPathWithoutLocale = "/" + segments.slice(1).join("/") || "/";

        const cleanPath = rawPathWithoutLocale.replace(/\.html$/, "");
        const pathnameWithoutLocale = applyPathRewrites(cleanPath);

        const url = request.nextUrl.clone();
        url.pathname = pathnameWithoutLocale;

        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-locale", locale);

        const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });

        response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
        response.headers.append("Set-Cookie", `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`);

        // Root path "/" → redirect to login or products based on auth
        if (pathnameWithoutLocale === "/") {
            const isAuthenticated = await checkAuth(request);
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.pathname = isAuthenticated ? `/${locale}/products` : `/${locale}/login`;
            return NextResponse.redirect(redirectUrl);
        }

        // Public routes — no auth needed
        if (PUBLIC_ROUTES.some((route) => pathnameWithoutLocale.startsWith(route))) return response;

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

    // ── 3. No prefix → redirect to /{locale}/... ────────────────────────
    const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
    const localeToUse = (cookieLocale && isValidLocale(cookieLocale)) ? cookieLocale : DEFAULT_LOCALE;

    const url = request.nextUrl.clone();
    url.pathname = `/${localeToUse}${pathname === "/" ? "" : pathname}`;

    const response = NextResponse.redirect(url);
    response.cookies.set(LOCALE_COOKIE, localeToUse, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });

    return response;
}

async function checkAuth(request: NextRequest): Promise<boolean> {
    try {
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
            secureCookie: process.env.NODE_ENV === "production",
            cookieName: SESSION_COOKIE_NAME,
        });

        // Reject if no token at all, or if the jwt callback marked it expired.
        if (!token?.accessToken) return false;
        if (token?.error === "MagentoTokenExpired") return false;

        return true;
    } catch { }

    return false;
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo|images).*)",],
};
