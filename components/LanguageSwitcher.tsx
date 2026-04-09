"use client";

import { useState, useEffect } from "react";
import {
    setLocaleCookie,
    locales,
    type Locale,
} from "@/lib/i18n/client";
import { defaultLocale, localeNames } from "@/lib/i18n/config";

/**
 * Language Switcher Component
 *
 * Uses useState + useEffect to avoid hydration mismatch:
 * - Server render: defaults to "en" (matches SSR)
 * - Client mount: reads actual locale from window.location.pathname
 */
export default function LanguageSwitcher() {
    // Start with default locale to match server render (prevents hydration mismatch)
    const [currentLocale, setCurrentLocale] = useState<Locale>(defaultLocale);

    // After hydration, read the real locale from the browser URL
    useEffect(() => {
        const locale = window.location.pathname.startsWith("/ar") ? "ar" : "en";
        setCurrentLocale(locale);
    }, []);

    const handleSwitch = (newLocale: Locale) => {
        if (newLocale === currentLocale) return;

        // 1. Update cookie
        setLocaleCookie(newLocale);

        // 2. Notify DirectionSync + data-fetching components instantly
        window.dispatchEvent(new CustomEvent("locale-changed", { detail: newLocale }));

        // 3. Full page navigation — ensures middleware runs, cookies are set,
        //    and all server/client state is fresh
        const currentPath = window.location.pathname;
        const stripped = currentPath.replace(/^\/(en|ar)/, "") || "/";
        window.location.href = `/${newLocale}${stripped === "/" ? "" : stripped}${window.location.search}`;
    };

    return (
        <div className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5">
            {locales.map((locale) => (
                <button
                    key={locale}
                    onClick={() => handleSwitch(locale)}
                    className={`
            px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200
            ${currentLocale === locale
                            ? "bg-[#f5a623] text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                        }
          `}
                    aria-label={`Switch to ${localeNames[locale]}`}
                    title={localeNames[locale]}
                >
                    {/* {locale === "en" ? "EN" : "عر"} */}
                    {locale === "en" ? "EN" : "AR"}

                </button>
            ))}
        </div>
    );
}
