"use client";

import { useLocale } from "@/lib/i18n/client";

/**
 * Returns a function that prefixes any path with the current locale.
 *
 * Usage:
 *   const lp = useLocalePath();
 *   <Link href={lp("/products")}>        → /en/products or /ar/products
 *   router.push(lp("/checkout"));        → /en/checkout or /ar/checkout
 *
 * If the path already has a locale prefix, it's returned as-is.
 */
export function useLocalePath() {
  const locale = useLocale();

  return (path: string): string => {
    // Already has locale prefix
    if (path.startsWith("/en/") || path.startsWith("/ar/") || path === "/en" || path === "/ar") {
      return path;
    }
    // Root path
    if (path === "/") return `/${locale}`;
    // Normal path
    return `/${locale}${path}`;
  };
}
