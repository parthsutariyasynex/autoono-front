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
 *   - `https://altalayi-demo.btire.com/rest/en/V1/kleverapi`
 *   - `https://altalayi-demo.btire.com/rest/ar/V1/kleverapi`
 */
export function getBaseUrl(request: Request): string {
    const locale = getLocaleFromRequest(request);
    const domain =
        process.env.NEXT_PUBLIC_MAGENTO_BASE_URL ||
        "https://altalayi-demo.btire.com";
    return `${domain}/rest/${locale}/V1/kleverapi`;
}

/**
 * Extract locale from a Request object.
 */
export function getLocaleFromRequest(request: Request): string {
    // 1. Check custom x-locale header (sent by api-client.ts)
    const headerLocale = request.headers.get("x-locale");
    if (headerLocale && VALID_LOCALES.includes(headerLocale)) {
        return headerLocale;
    }

    // 2. Check cookie
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`));
    if (match && VALID_LOCALES.includes(match[1])) {
        return match[1];
    }

    // 3. Default
    return DEFAULT_LOCALE;
}

/**
 * Get the Magento auth token URL for the given locale.
 */
export function getAuthUrl(request: Request): string {
    const locale = getLocaleFromRequest(request);
    const domain =
        process.env.NEXT_PUBLIC_MAGENTO_BASE_URL ||
        "https://altalayi-demo.btire.com";
    return `${domain}/rest/${locale}/V1/integration/customer/token`;
}
