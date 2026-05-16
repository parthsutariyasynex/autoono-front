
"use client";

import { useContext } from "react";
import { LocaleContext } from "./LocaleProvider";
import {
    locales,
    defaultLocale,
    isValidLocale,
    LOCALE_COOKIE,
    type Locale,
} from "./config";

/**
 * Extract locale from pathname.
 */
export function getLocaleFromPathname(pathname: string): Locale {
    const segments = pathname.split("/").filter(Boolean);
    const first = segments[0];
    if (first && isValidLocale(first)) {
        return first as Locale;
    }
    return defaultLocale;
}

/**
 * React hook: returns the current locale from context.
 */
export function useLocale(): Locale {
    return useContext(LocaleContext);
}

const STORE_CODE_LOCALE_RE = /^\/[A-Za-z0-9]+_(en|ar)(\/|$)/;

/**
 * Read locale from browser URL (client-only helper).
 * Handles both /ar/... and store-code URLs like /V102_ar/...
 */
export function getBrowserLocale(): Locale {
    if (typeof window === "undefined") return defaultLocale;
    const path = window.location.pathname;
    const storeMatch = path.match(STORE_CODE_LOCALE_RE);
    if (storeMatch && isValidLocale(storeMatch[1])) return storeMatch[1] as Locale;
    if (path.startsWith("/ar")) return "ar";
    if (path.startsWith("/en")) return "en";
    const match = document.cookie.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`));
    if (match && isValidLocale(match[1])) return match[1] as Locale;
    return defaultLocale;
}

/**
 * Get the path without the locale prefix.
 */
export function stripLocaleFromPath(pathname: string): string {
    const segments = pathname.split("/").filter(Boolean);
    const first = segments[0];
    if (first && isValidLocale(first)) {
        return "/" + segments.slice(1).join("/") || "/";
    }
    return pathname;
}

/**
 * Build locale-prefixed path from current path.
 */
export function switchLocalePath(
    currentPath: string,
    newLocale: Locale
): string {
    const stripped = stripLocaleFromPath(currentPath);
    return `/${newLocale}${stripped === "/" ? "" : stripped}`;
}

/**
 * Set the locale cookie (for client-side use).
 */
export function setLocaleCookie(locale: Locale): void {
    document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
}

export { locales, defaultLocale, type Locale };
