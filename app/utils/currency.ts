/**
 * Currency and price formatting utilities
 */

/**
 * Format a numeric price for display
 */
export function formatPrice(
  amount: number | string,
  currencyCode = "USD",
  locale = "en-US"
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Calculate discounted price
 */
export function applyDiscount(
  price: number,
  discountType: "percentage" | "fixed" | "none",
  discountValue: number
): number {
  if (discountType === "percentage") {
    return price * (1 - discountValue / 100);
  }
  if (discountType === "fixed") {
    return Math.max(0, price - discountValue);
  }
  return price;
}

/**
 * Calculate total price for a bundle
 */
export function calculateBundleTotal(prices: number[]): number {
  return prices.reduce((sum, price) => sum + price, 0);
}

/**
 * Calculate savings amount
 */
export function calculateSavings(
  originalTotal: number,
  discountType: "percentage" | "fixed" | "none",
  discountValue: number
): number {
  if (discountType === "percentage") {
    return originalTotal * (discountValue / 100);
  }
  if (discountType === "fixed") {
    return Math.min(discountValue, originalTotal);
  }
  return 0;
}