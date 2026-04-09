/**
 * Detect the current locale from the browser URL path.
 */
export function getCurrentLocale(): string {
  if (typeof window === "undefined") return "en";
  return window.location.pathname.startsWith("/ar") ? "ar" : "en";
}

/**
 * Build headers for API fetch calls with auth token and locale.
 * Use this for all raw fetch() calls to ensure locale is always sent.
 *
 * Usage:
 *   const res = await fetch("/api/kleverapi/orders", { headers: apiHeaders() });
 *   const res = await fetch("/api/kleverapi/cart", { headers: apiHeaders(token) });
 */
export function apiHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-locale": getCurrentLocale(),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Builds a locale-prefixed /login URL with callbackUrl preserving current path + query params.
 */
export function getLoginUrl(): string {
  if (typeof window === "undefined") return "/en/login";
  const locale = getCurrentLocale();
  const currentPath = window.location.pathname + window.location.search;
  return `/${locale}/login?callbackUrl=${encodeURIComponent(currentPath)}`;
}

/**
 * Redirects to login page with current URL preserved as callbackUrl.
 */
export function redirectToLogin(router: { replace: (url: string) => void }) {
  router.replace(getLoginUrl());
}

/**
 * Formats a number or string price into Saudi Riyal (SAR) currency format.
 * Requirement: SAR 1,650.00
 * 
 * @param price - The numeric or string value to format
 * @returns A formatted string with SAR symbol, thousands separator, and 2 decimal places.
 */
export function formatPrice(price: number | string | null | undefined): string {
  // "SAR" is used as a prefix; Price component will replace it with the custom icon character \uE900
  const SYMBOL = "SAR";

  if (price === null || price === undefined || price === "") return `${SYMBOL} 0.00`;

  const numericPrice = typeof price === "string" ? parseFloat(price) : price;

  if (isNaN(numericPrice)) return `${SYMBOL} 0.00`;

  const formattedNumber = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericPrice);

  return `${SYMBOL} ${formattedNumber}`;
}



/**
 * Formats filters and state into a Magento-style layered navigation query string.
 * Example: ?is_ajax=1&item_code[0]=val1&item_code[1]=val2
 */
export function formatMagentoQueryParams(
  filters: Record<string, string[]>,
  page: number = 1,
  sortBy: string = "none"
): string {
  const parts: string[] = [];

  if (page > 1) parts.push(`page=${page}`);
  if (sortBy && sortBy !== "none") parts.push(`sortBy=${encodeURIComponent(sortBy)}`);

  Object.entries(filters).forEach(([key, values]) => {
    if (Array.isArray(values)) {
      values.forEach((val, index) => {
        parts.push(`${encodeURIComponent(key)}[${index}]=${encodeURIComponent(val)}`);
      });
    }
  });

  return parts.join("&");
}

/**
 * Parses a Magento-style query string back into a filter state object.
 */
export function parseMagentoQueryParams(
  searchParams: URLSearchParams
): {
  filters: Record<string, string[]>,
  page: number,
  sortBy: string
} {
  const filters: Record<string, string[]> = {};
  let page = 1;
  let sortBy = "none";
  const reserved = ["categoryId", "page", "pageSize", "sortBy", "is_ajax"];

  searchParams.forEach((value, key) => {
    if (key === "page") {
      page = Number(value) || 1;
    } else if (key === "sortBy") {
      sortBy = value;
    } else if (!reserved.includes(key)) {
      const baseKey = key.includes("[") ? key.split("[")[0] : key;
      if (!filters[baseKey]) {
        filters[baseKey] = [];
      }
      if (!filters[baseKey].includes(value)) {
        filters[baseKey].push(value);
      }
    }
  });

  return { filters, page, sortBy };
}