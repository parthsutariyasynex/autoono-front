"use client";

import { useState, useEffect } from "react";
import {
    setLocaleCookie,
    locales,
    type Locale,
} from "@/lib/i18n/client";
import { defaultLocale, localeNames } from "@/lib/i18n/config";

import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";

/**
 * Language Switcher Component
 *
 * Uses useState + useEffect to avoid hydration mismatch:
 * - Server render: defaults to "en" (matches SSR)
 * - Client mount: reads actual locale from window.location.pathname
 * - Resyncs on every pathname change so other navigation sources
 *   (e.g. warehouse dropdown switching /en ↔ /ar) update the highlight too.
 */
export default function LanguageSwitcher() {
    const router = useRouter();
    const pathname = usePathname();
    const { i18n } = useTranslation();
    // Start with default locale to match server render (prevents hydration mismatch)
    const [currentLocale, setCurrentLocale] = useState<Locale>(defaultLocale);

    // After hydration AND on every client-side navigation, read the locale from the URL
    useEffect(() => {
        const locale = window.location.pathname.startsWith("/ar") ? "ar" : "en";
        setCurrentLocale(locale);
    }, [pathname, i18n.language]);

    const handleSwitch = (newLocale: Locale) => {
        if (newLocale === currentLocale) return;

        // 1. Update cookie
        setLocaleCookie(newLocale);

        // 2. Notify DirectionSync + data-fetching components instantly
        i18n.changeLanguage(newLocale);

        // 3. Dynamic navigation — ensures seamless transition
        const currentPath = window.location.pathname;
        const stripped = currentPath.replace(/^\/(en|ar)/, "") || "/";
        const targetUrl = `/${newLocale}${stripped === "/" ? "" : stripped}${window.location.search || ""}`;

        router.push(targetUrl);
        // Force refresh to ensure all components (Navbar, etc.) re-render with new locale
        router.refresh();
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
                            ? "bg-primary text-white shadow-sm"
                            : "text-black/70 hover:text-black hover:bg-gray-200"
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
