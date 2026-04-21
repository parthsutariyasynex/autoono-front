
import "intl-tel-input/build/css/intlTelInput.css";
import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import { cookies, headers } from "next/headers";
import { CartProvider } from "../modules/cart/context/CartContext";
import { ReduxProvider } from "@/store/provider";
import ProtectedLayout from "@/app/components/ProtectedLayout";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { NextAuthProvider } from "@/components/providers/NextAuthProvider";
import DirectionSync from "@/app/components/DirectionSync";
import {
  localeDirection,
  isValidLocale,
  defaultLocale,
  type Locale,
  LOCALE_COOKIE
} from "@/lib/i18n/config";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import TranslationWrapper from "@/components/providers/TranslationWrapper";

const rubik = Rubik({
  subsets: ["latin", "arabic"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-rubik",
  fallback: ["system-ui", "Arial", "sans-serif"],
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "AutoOno",
  description: "AutoOno",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Try x-locale header (set by middleware rewrite)
  const headerList = await headers();
  const headerLocale = headerList.get("x-locale");

  // 2. Fallback to cookie
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE)?.value;

  const localeValue = (headerLocale && isValidLocale(headerLocale))
    ? headerLocale
    : (localeCookie && isValidLocale(localeCookie))
      ? localeCookie
      : defaultLocale;

  const locale = localeValue as Locale;
  const dir = localeDirection[locale];

  return (
    <html lang={locale} dir={dir}>
      <body className={`${rubik.variable} font-rubik`}>
        <LocaleProvider initialLocale={locale}>
          <TranslationWrapper>
            <ReduxProvider>
              <NextAuthProvider>
                <CartProvider>
                  <DirectionSync />
                  <Toaster position="top-right" reverseOrder={false} />
                  <ProtectedLayout>
                    {children}
                  </ProtectedLayout>
                </CartProvider>
              </NextAuthProvider>
            </ReduxProvider>
          </TranslationWrapper>
        </LocaleProvider>
      </body>
    </html>
  );
}