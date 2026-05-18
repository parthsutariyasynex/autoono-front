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
 * Prefers the warehouse store code (x-store-code header, e.g. V101_en) over
 * plain locale so that checkout/cart calls always hit the right Magento store view.
 *
 * @param request - The incoming Request object (available in API route handlers)
 * @returns The Magento base URL with the correct store code, e.g.:
 *   - `https://autoono-demo.btire.com/rest/V101_en/V1/kleverapi`
 *   - `https://autoono-demo.btire.com/rest/en/V1/kleverapi` (fallback)
 */
export function getBaseUrl(request: Request): string {
    const domain =
        process.env.NEXT_PUBLIC_MAGENTO_BASE_URL ||
        "https://autoono-demo.btire.com";

    // Middleware forwards x-store-code from the NEXT_STORE cookie.
    // If it's a warehouse code (not just "en"/"ar"), use it so cart/checkout
    // calls hit the same store view where the quote was created.
    const storeCode = request.headers.get("x-store-code") || "";
    if (storeCode && !VALID_LOCALES.includes(storeCode)) {
        return `${domain}/rest/${encodeURIComponent(storeCode)}/V1/kleverapi`;
    }

    const locale = getLocaleFromRequest(request);
    return `${domain}/rest/${locale}/V1/kleverapi`;
}

/**
 * Return the standard Magento REST base (no /kleverapi) for the active store.
 * Used as a fallback when a KleverAPI endpoint returns 404.
 * Example: https://autoono-demo.btire.com/rest/V101_en/V1
 */
export function getStandardRestBase(request: Request): string {
    const domain =
        process.env.NEXT_PUBLIC_MAGENTO_BASE_URL ||
        "https://autoono-demo.btire.com";
    const storeCode = request.headers.get("x-store-code") || "";
    if (storeCode && !VALID_LOCALES.includes(storeCode)) {
        return `${domain}/rest/${encodeURIComponent(storeCode)}/V1`;
    }
    const locale = getLocaleFromRequest(request);
    return `${domain}/rest/${locale}/V1`;
}

/**
 * Extract the locale from a warehouse store code (e.g. "V101_en" → "en", "V102_ar" → "ar").
 * Falls back to getLocaleFromRequest when the store code has no locale suffix.
 * Use this for KleverAPI endpoints that only work with plain locale store views
 * (en/ar), not warehouse store codes.
 */
export function getLocaleBaseUrl(request: Request): string {
    const domain =
        process.env.NEXT_PUBLIC_MAGENTO_BASE_URL ||
        "https://autoono-demo.btire.com";
    const storeCode = request.headers.get("x-store-code") || "";
    // Extract locale suffix from warehouse store code: V101_en → en, V102_ar → ar
    if (storeCode && !VALID_LOCALES.includes(storeCode)) {
        const parts = storeCode.split("_");
        const suffix = parts[parts.length - 1]?.toLowerCase();
        if (suffix && VALID_LOCALES.includes(suffix)) {
            return `${domain}/rest/${suffix}/V1/kleverapi`;
        }
    }
    const locale = getLocaleFromRequest(request);
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
