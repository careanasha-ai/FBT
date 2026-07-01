/**
 * Price formatting and discount calculation for the widget
 */

export function formatPrice(amount: number, currencyCode = "USD"): string {
  // Use Shopify's currency if available on the storefront
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currency = (window as any).Shopify?.currency?.active ?? currencyCode;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function calculateBundleTotal(prices: number[]): number {
  return prices.reduce((sum, p) => sum + p, 0);
}

export function applyDiscount(
  total: number,
  type: "percentage" | "fixed" | "none",
  value: number
): number {
  if (type === "percentage") return total * (1 - value / 100);
  if (type === "fixed") return Math.max(0, total - value);
  return total;
}