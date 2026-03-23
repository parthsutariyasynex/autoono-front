/**
 * Formats a number or string price into Saudi Riyal (SAR) currency format.
 * Requirement: ﷼ 1,650.00
 * 
 * @param price - The numeric or string value to format
 * @returns A formatted string with SAR symbol, thousands separator, and 2 decimal places.
 */
export function formatPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined || price === "") return "﷼ 0.00";

  const numericPrice = typeof price === "string" ? parseFloat(price) : price;

  if (isNaN(numericPrice)) return "﷼ 0.00";

  // Using Intl.NumberFormat for thousand separators and 2 decimal places
  const formattedNumber = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericPrice);

  // Return with the requested Saudi Riyal symbol (﷼)
  return `﷼ ${formattedNumber}`;
}