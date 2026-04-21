// ─── Locale-Aware Magento URL Helper for API Route Handlers ─────────────────
// This module provides the `getBaseUrl(request)` function that all API route
// handlers should use instead of `process.env.NEXT_PUBLIC_BASE_URL`.
//
// It reads the locale from:
//   1. The `x-locale` header (set by the API client on the frontend)
//   2. The `NEXT_LOCALE` cookie (set by middleware)
//   3. Falls back to the default locale ("en")
//
// Usage:
//   import { getBaseUrl } from "@/lib/api/magento-url";
//   const BASE_URL = getBaseUrl(request);

const LOCALE_COOKIE = "NEXT_LOCALE";
const VALID_LOCALES = ["en", "ar"];
const DEFAULT_LOCALE = "en";

/**
 * Extract the locale from a request and return the correct Magento base URL.
 *
 * @param request - The incoming Request object (available in API route handlers)
 * @returns The Magento base URL with the correct store code, e.g.:
 *   - `https://autoono-demo.btire.com/rest/en/V1/kleverapi`
 */
export function getBaseUrl(request: Request): string {
    const locale = getLocaleFromRequest(request);
    const domain =
        process.env.NEXT_PUBLIC_MAGENTO_BASE_URL ||
        "https://autoono-demo.btire.com";
    return `${domain}/rest/${locale}/V1/kleverapi`;
}

/**
 * Return the Magento base URL with V101 store code.
 * This is often the most reliable "global" context for KleverApi.
 */
export function getV101BaseUrl(request: Request): string {
    const domain =
        process.env.NEXT_PUBLIC_MAGENTO_BASE_URL ||
        "https://autoono-demo.btire.com";
    return `${domain}/rest/V101/V1/kleverapi`;
}

/**
 * Return the Magento base URL with a dynamic store code (e.g. V101, V102, V103).
 * Example: https://autoono-demo.btire.com/rest/V101/V1/kleverapi
 */
export function getStoreBaseUrl(storeCode: string): string {
    const domain =
        process.env.NEXT_PUBLIC_MAGENTO_BASE_URL ||
        "https://autoono-demo.btire.com";
    const safe = encodeURIComponent(storeCode);
    return `${domain}/rest/${safe}/V1/kleverapi`;
}

/**
 * Return the Magento base URL WITHOUT the store code.
 */
export function getGlobalBaseUrl(request: Request): string {
    const domain =
        process.env.NEXT_PUBLIC_MAGENTO_BASE_URL ||
        "https://autoono-demo.btire.com";
    return `${domain}/rest/V1/kleverapi`;
}

/**
 * Extract locale from a Request object.
 */
export function getLocaleFromRequest(request: Request): string {
    // 1. Check ?lang= query parameter (most reliable — can't be stripped)
    try {
        const url = new URL(request.url);
        const langParam = url.searchParams.get("lang");
        if (langParam && VALID_LOCALES.includes(langParam)) {
            return langParam;
        }
    } catch { }

    // 2. Check custom x-locale header (sent by frontend fetch)
    const headerLocale = request.headers.get("x-locale");
    if (headerLocale && VALID_LOCALES.includes(headerLocale)) {
        return headerLocale;
    }

    // 3. Check Referer URL (browser sends this automatically)
    const referer = request.headers.get("referer") || "";
    if (referer.includes("/ar/")) return "ar";

    // 4. Check cookie
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`));
    if (match && VALID_LOCALES.includes(match[1])) {
        return match[1];
    }

    // 5. Default
    return DEFAULT_LOCALE;
}

/**
 * Get the Magento auth token URL for the given locale.
 */
export function getAuthUrl(request: Request): string {
    const locale = getLocaleFromRequest(request);
    const domain =
        process.env.NEXT_PUBLIC_MAGENTO_BASE_URL ||
        "https://autoono-demo.btire.com";
    return `${domain}/rest/${locale}/V1/integration/customer/token`;
}
