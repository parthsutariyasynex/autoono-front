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
    loadingPromises[locale] = fetch(`/locales/${locale}.json`)
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

  useEffect(() => {
    let cancelled = false;

    loadTranslations(locale).then((data) => {
      if (!cancelled) {
        setTranslations(data);
        setReady(true);
      }
    });

    return () => { cancelled = true; };
  }, [locale]);

  // Block rendering until translations are available
  if (!ready) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#fff" }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "4px solid #e5e7eb", borderTopColor: "#f5a623",
          animation: "spin 0.8s linear infinite"
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
  return { t, locale, isRtl };
}
