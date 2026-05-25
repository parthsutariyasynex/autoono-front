"use client";

import { TranslationProvider } from "@/hooks/useTranslation";

export default function TranslationWrapper({
  children,
  initialLocale,
  initialTranslations,
}: {
  children: React.ReactNode;
  initialLocale?: string;
  initialTranslations?: Record<string, string>;
}) {
  return (
    <TranslationProvider
      initialLocale={initialLocale}
      initialTranslations={initialTranslations}
    >
      {children}
    </TranslationProvider>
  );
}
