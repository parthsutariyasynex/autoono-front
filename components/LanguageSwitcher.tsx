"use client";

import { useState, useEffect } from "react";
import { setLocaleCookie, locales, type Locale } from "@/lib/i18n/client";
import { defaultLocale } from "@/lib/i18n/config";
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";

/**
 * Language Switcher Component (Minimalist Text Link)
 * 
 * A clean, text-only toggle that switches between EN and AR.
 * Removes all button-like containers for a more integrated header look.
 */
export default function LanguageSwitcher() {
    const router = useRouter();
    const pathname = usePathname();
    const { i18n } = useTranslation();
    const [currentLocale, setCurrentLocale] = useState<Locale>(defaultLocale);

    useEffect(() => {
        const segs = pathname?.split("/").filter(Boolean) || [];
        const first = segs[0] || "";
        const isAr = first === "ar" || first.endsWith("_ar");
        setCurrentLocale(isAr ? "ar" : "en");
    }, [pathname]);

    const handleSwitch = (newLocale: Locale) => {
        if (newLocale === currentLocale) return;

        setLocaleCookie(newLocale);
        i18n.changeLanguage(newLocale);

        const segs = pathname?.split("/").filter(Boolean) || [];
        if (segs.length === 0) {
            router.push(`/${newLocale}`);
            return;
        }

        const first = segs[0];
        const STORE_CODE_RE = /^[A-Za-z0-9]+_(en|ar)$/;

        if (STORE_CODE_RE.test(first)) {
            const base = first.split("_")[0];
            segs[0] = `${base}_${newLocale}`;
        } else if (first === "en" || first === "ar") {
            segs[0] = newLocale;
        } else {
            segs.unshift(newLocale);
        }

        const targetUrl = `/${segs.join("/")}${window.location.search || ""}`;
        router.push(targetUrl);
        router.refresh();
    };

    const targetLocale = currentLocale === "en" ? "ar" : "en";

    return (
        <button
            onClick={() => handleSwitch(targetLocale)}
            className="text-body font-bold text-black hover:text-primary transition-colors px-2 uppercase tracking-tight active:scale-95 whitespace-nowrap"
            aria-label={`Switch to ${targetLocale === "ar" ? "Arabic" : "English"}`}
        >
            {targetLocale === "ar" ? "العربية" : "English"}
        </button>
    );
}
