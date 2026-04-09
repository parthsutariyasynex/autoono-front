"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { isValidLocale, Locale, defaultLocale } from "./config";

export const LocaleContext = createContext<Locale>(defaultLocale);

export function LocaleProvider({
    children,
    initialLocale
}: {
    children: React.ReactNode;
    initialLocale: Locale
}) {
    const [locale, setLocale] = useState<Locale>(initialLocale);

    // Sync state if initialLocale changes (e.g. during navigation)
    useEffect(() => {
        setLocale(initialLocale);
    }, [initialLocale]);

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
