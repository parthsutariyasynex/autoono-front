"use client";

import { useLocale } from "@/lib/i18n/client";
import { useState, useEffect, useCallback } from "react";

let cachedTranslations: Record<string, Record<string, string>> = {};

export function useTranslation() {
  const locale = useLocale();
  const [translations, setTranslations] = useState<Record<string, string>>(
    cachedTranslations[locale] || {}
  );

  useEffect(() => {
    if (cachedTranslations[locale]) {
      setTranslations(cachedTranslations[locale]);
      return;
    }

    fetch(`/locales/${locale}.json`)
      .then((res) => res.json())
      .then((data) => {
        cachedTranslations[locale] = data;
        setTranslations(data);
      })
      .catch((err) => {
        console.error(`Failed to load ${locale} translations:`, err);
      });
  }, [locale]);

  const t = useCallback(
    (key: string): string => translations[key] || key,
    [translations]
  );

  const isRtl = locale === "ar";
  return { t, locale, isRtl };
}
