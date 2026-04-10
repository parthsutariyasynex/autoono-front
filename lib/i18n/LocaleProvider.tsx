"use client";

import { createContext, useState, useEffect } from "react";
import { isValidLocale, Locale, defaultLocale } from "./config";

export const LocaleContext = createContext<Locale>(defaultLocale);

/**
 * Read locale from browser URL (most reliable source on client).
 */
function getBrowserLocale(): Locale {
    if (typeof window === "undefined") return defaultLocale;
    if (window.location.pathname.startsWith("/ar")) return "ar";
    if (window.location.pathname.startsWith("/en")) return "en";
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

    // On mount: read locale from browser URL (fixes SSR mismatch after rewrite)
    // Root layout doesn't re-render on client navigation, so initialLocale can be stale.
    useEffect(() => {
        const urlLocale = getBrowserLocale();
        if (urlLocale !== locale) {
            setLocale(urlLocale);
        }
    }, []);

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
