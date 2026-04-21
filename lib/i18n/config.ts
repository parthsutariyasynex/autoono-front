// ─── i18n Configuration ─────────────────────────────────────────────────────
// Supported locales and default settings for Magento multi-store integration.

export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const LOCALE_COOKIE = "NEXT_LOCALE";

/** Direction mapping for each locale */
export const localeDirection: Record<Locale, "ltr" | "rtl"> = {
    en: "ltr",
    ar: "rtl",
};

/** Display names for each locale (used in the language switcher) */
export const localeNames: Record<Locale, string> = {
    en: "English",
    ar: "العربية",
};

/**
 * Build the Magento base URL for a given locale.
 *
 * @example
 *   getMagentoBaseUrl("en") → "https://autoono-demo.btire.com/rest/en/V1/kleverapi"
 *   getMagentoBaseUrl("ar") → "https://autoono-demo.btire.com/rest/ar/V1/kleverapi"
 */
export function getMagentoBaseUrl(locale: Locale = defaultLocale): string {
    const domain =
        process.env.NEXT_PUBLIC_MAGENTO_BASE_URL ||
        "https://autoono-demo.btire.com";
    return `${domain}/rest/${locale}/V1/kleverapi`;
}

/**
 * Build the Magento auth token URL for a given locale.
 */
export function getMagentoAuthUrl(locale: Locale = defaultLocale): string {
    const domain =
        process.env.NEXT_PUBLIC_MAGENTO_BASE_URL ||
        "https://autoono-demo.btire.com";
    return `${domain}/rest/${locale}/V1/integration/customer/token`;
}

/**
 * Check if a string is a valid locale.
 */
export function isValidLocale(value: string): value is Locale {
    return locales.includes(value as Locale);
}
