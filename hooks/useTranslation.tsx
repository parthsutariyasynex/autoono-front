"use client";

import { useLocale } from "@/lib/i18n/client";
import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";

// ─── Global cache (survives navigations, cleared only on full reload) ───────
const cachedTranslations: Record<string, Record<string, string>> = {};
const loadingPromises: Record<string, Promise<Record<string, string>>> = {};

/**
 * Fetch + cache translations for a locale. Deduplicates concurrent requests.
 */
function loadTranslations(locale: string): Promise<Record<string, string>> {
  if (cachedTranslations[locale]) {
    return Promise.resolve(cachedTranslations[locale]);
  }
  if (!loadingPromises[locale]) {
    loadingPromises[locale] = fetch(`/locales/${locale}.json?v=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        cachedTranslations[locale] = data;
        delete loadingPromises[locale];
        return data;
      })
      .catch((err) => {
        console.error(`Failed to load ${locale} translations:`, err);
        delete loadingPromises[locale];
        return {};
      });
  }
  return loadingPromises[locale];
}

// ─── Context ────────────────────────────────────────────────────────────────
const TranslationContext = createContext<Record<string, string>>({});

/**
 * TranslationProvider — blocks rendering until translations are loaded.
 * On subsequent navigations, translations are already cached → instant.
 */
export function TranslationProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const hasCached = !!cachedTranslations[locale];
  const [translations, setTranslations] = useState<Record<string, string>>(
    cachedTranslations[locale] || {}
  );
  const [ready, setReady] = useState(hasCached);
  const [loadedLocale, setLoadedLocale] = useState(hasCached ? locale : "");

  useEffect(() => {
    // If locale changed, reset ready state to block rendering until new translations load
    if (locale !== loadedLocale) {
      if (!cachedTranslations[locale]) {
        setReady(false);
      }
    }

    let cancelled = false;

    loadTranslations(locale).then((data) => {
      if (!cancelled) {
        setTranslations(data);
        setLoadedLocale(locale);
        setReady(true);
      }
    });

    return () => { cancelled = true; };
  }, [locale]);

  // Block rendering until translations are available
  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <TranslationContext.Provider value={translations}>
      {children}
    </TranslationContext.Provider>
  );
}

/**
 * useTranslation — reads from context. Always has data when rendered
 * (TranslationProvider blocks until loaded).
 */
export function useTranslation() {
  const locale = useLocale();
  const translations = useContext(TranslationContext);

  const t = useCallback(
    (key: string): string => translations[key] || key,
    [translations]
  );

  const isRtl = locale === "ar";

  const i18n = {
    language: locale,
    changeLanguage: (newLocale: string) => {
      window.dispatchEvent(new CustomEvent("locale-changed", { detail: newLocale }));
    }
  };

  return { t, locale, isRtl, i18n };
}
