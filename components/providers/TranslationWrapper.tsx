"use client";

import { TranslationProvider } from "@/hooks/useTranslation";

export default function TranslationWrapper({ children }: { children: React.ReactNode }) {
  return <TranslationProvider>{children}</TranslationProvider>;
}
