"use client";

import { createContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { isValidLocale, Locale, defaultLocale } from "./config";

export const LocaleContext = createContext<Locale>(defaultLocale);

const STORE_CODE_LOCALE_RE = /^\/[A-Za-z0-9]+_(en|ar)(\/|$)/;

/**
 * Read locale from browser URL (most reliable source on client).
 * Handles both /ar/... and store-code URLs like /V102_ar/...
 */
function getBrowserLocale(): Locale {
    if (typeof window === "undefined") return defaultLocale;
    const path = window.location.pathname;
    const storeMatch = path.match(STORE_CODE_LOCALE_RE);
    if (storeMatch) return storeMatch[1] as Locale;
    if (path.startsWith("/ar")) return "ar";
    if (path.startsWith("/en")) return "en";
    return defaultLocale;
}

export function LocaleProvider({
    children,
    initialLocale
}: {
    children: React.ReactNode;
    initialLocale: Locale
}) {
    const [locale, setLocale] = useState<Locale>(initialLocale);
    const pathname = usePathname();

    // Sync locale from browser URL on mount AND on every client navigation.
    // This fixes AR leaking into EN when navigating between locales.
    useEffect(() => {
        const urlLocale = getBrowserLocale();
        if (urlLocale !== locale) {
            setLocale(urlLocale);
        }
        // Keep <html dir> and <html lang> in sync with the URL locale — the root
        // layout only sets these on initial render, so SPA navigation across /en ↔ /ar
        // would otherwise leave RTL/LTR direction stale.
        if (typeof document !== "undefined") {
            document.documentElement.lang = urlLocale;
            document.documentElement.dir = urlLocale === "ar" ? "rtl" : "ltr";
        }
    }, [pathname]);

    // Listen for language switch events (from LanguageSwitcher)
    useEffect(() => {
        const handleLocaleChanged = (e: Event) => {
            const newLocale = (e as CustomEvent).detail;
            if (isValidLocale(newLocale)) {
                setLocale(newLocale);
            }
        };
        window.addEventListener("locale-changed", handleLocaleChanged);
        return () => window.removeEventListener("locale-changed", handleLocaleChanged);
    }, []);

    return (
        <LocaleContext.Provider value={locale}>
            {children}
        </LocaleContext.Provider>
    );
}
