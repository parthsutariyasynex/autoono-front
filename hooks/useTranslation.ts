"use client";

import { useLocale } from "@/lib/i18n/client";
import en from "../public/locales/en.json";
import ar from "../public/locales/ar.json";

const translations: Record<string, Record<string, string>> = { en, ar };

export function useTranslation() {
  const locale = useLocale();
  const t = (key: string): string => translations[locale]?.[key] || key;
  const isRtl = locale === "ar";
  return { t, locale, isRtl };
}
