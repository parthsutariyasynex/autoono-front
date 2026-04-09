// ─── Server-side helper for API route handlers ─────────────────────────────
// Reads the locale from the request (cookie or header) and returns the
// correct Magento base URL.

import { cookies } from "next/headers";
import {
    LOCALE_COOKIE,
    defaultLocale,
    getMagentoBaseUrl,
    isValidLocale,
    type Locale,
} from "./config";

/**
 * Get the Magento base URL for the current request's locale.
 * Reads the locale from the NEXT_LOCALE cookie (set by middleware).
 *
 * Usage in API route handlers:
 * ```ts
 * import { getLocaleMagentoUrl } from "@/lib/i18n/server";
 * const BASE_URL = await getLocaleMagentoUrl();
 * ```
 */
export async function getLocaleMagentoUrl(): Promise<string> {
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get(LOCALE_COOKIE)?.value;
    const locale: Locale =
        localeCookie && isValidLocale(localeCookie) ? localeCookie : defaultLocale;
    return getMagentoBaseUrl(locale);
}

/**
 * Get the current locale from cookies.
 */
export async function getLocaleFromCookies(): Promise<Locale> {
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get(LOCALE_COOKIE)?.value;
    return localeCookie && isValidLocale(localeCookie)
        ? localeCookie
        : defaultLocale;
}

/**
 * Extract locale from a NextRequest (for use in middleware or API routes
 * that already have the request object).
 */
export function getLocaleFromRequest(request: Request): Locale {
    // Check X-Locale header first (set by middleware)
    const headerLocale = request.headers.get("x-locale");
    if (headerLocale && isValidLocale(headerLocale)) {
        return headerLocale;
    }

    // Fallback: parse cookie from the Cookie header
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`));
    if (match && isValidLocale(match[1])) {
        return match[1] as Locale;
    }

    return defaultLocale;
}
