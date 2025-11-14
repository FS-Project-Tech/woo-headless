/**
 * Formatting Utilities
 * Standardized formatting functions for prices and currency
 */

/**
 * Format price to 2 decimal places with $ prefix
 */
export function formatPrice(price: string | number | null | undefined): string {
  const num = typeof price === "string" ? parseFloat(price) : (price || 0);
  if (!isFinite(num) || num <= 0) return "$0.00";
  return `$${num.toFixed(2)}`;
}

/**
 * Format currency amount to 2 decimal places
 */
export function formatCurrency(amount: number): string {
  if (!isFinite(amount) || amount <= 0) return "$0.00";
  return `$${amount.toFixed(2)}`;
}

/**
 * Format price without currency symbol (for calculations)
 */
export function formatPriceNumber(price: string | number | null | undefined): number {
  const num = typeof price === "string" ? parseFloat(price) : (price || 0);
  return isFinite(num) && num > 0 ? Number(num.toFixed(2)) : 0;
}

