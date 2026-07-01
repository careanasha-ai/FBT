/**
 * Price formatting and discount calculation — Phase 1.5
 */

import type { DiscountTierConfig, DiscountState } from "./types";

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatPrice(amount: number, currencyCode = "USD"): string {
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

// ─── Tier Resolution ──────────────────────────────────────────────────────────

/**
 * Find the best applicable discount tier for a given item count.
 */
export function resolveActiveTier(
  tiers: DiscountTierConfig[],
  itemCount: number
): DiscountTierConfig | null {
  return (
    [...tiers]
      .filter((t) => itemCount >= t.minItems)
      .sort((a, b) => b.minItems - a.minItems)[0] ?? null
  );
}

/**
 * Find the next tier the customer hasn't reached yet.
 */
export function resolveNextTier(
  tiers: DiscountTierConfig[],
  itemCount: number
): DiscountTierConfig | null {
  return (
    [...tiers]
      .filter((t) => t.minItems > itemCount)
      .sort((a, b) => a.minItems - b.minItems)[0] ?? null
  );
}

/**
 * Apply a discount tier to a subtotal (in cents).
 */
export function applyTier(
  subtotalCents: number,
  tier: DiscountTierConfig | null
): { discountedTotalCents: number; savingsCents: number } {
  if (!tier || tier.discountType === "none") {
    return { discountedTotalCents: subtotalCents, savingsCents: 0 };
  }

  const value = tier.discountValue;

  if (tier.discountType === "percentage") {
    const savings = Math.round(subtotalCents * (value / 100));
    return { discountedTotalCents: subtotalCents - savings, savingsCents: savings };
  }

  if (tier.discountType === "fixed") {
    const savings = Math.min(Math.round(value * 100), subtotalCents);
    return { discountedTotalCents: subtotalCents - savings, savingsCents: savings };
  }

  if (tier.discountType === "price") {
    // Flat bundle price in dollars
    const bundlePriceCents = Math.round(value * 100);
    const savings = Math.max(0, subtotalCents - bundlePriceCents);
    return { discountedTotalCents: bundlePriceCents, savingsCents: savings };
  }

  return { discountedTotalCents: subtotalCents, savingsCents: 0 };
}

/**
 * Build the nudge message for the next tier.
 * e.g. "Add 1 more item to save 20%!"
 */
export function buildNudgeMessage(
  nextTier: DiscountTierConfig | null,
  currentItemCount: number
): string | null {
  if (!nextTier) return null;

  const needed = nextTier.minItems - currentItemCount;
  const label =
    nextTier.discountType === "percentage"
      ? `${nextTier.discountValue}% off`
      : nextTier.discountType === "fixed"
      ? `$${nextTier.discountValue} off`
      : nextTier.discountType === "price"
      ? `bundle price of $${nextTier.discountValue}`
      : "a discount";

  return `Add ${needed} more item${needed !== 1 ? "s" : ""} to save ${label}!`;
}

/**
 * Compute the full discount state for the current selection.
 */
export function computeDiscountState(
  tiers: DiscountTierConfig[],
  selectedCount: number,
  subtotalCents: number
): DiscountState {
  const activeTier = resolveActiveTier(tiers, selectedCount);
  const nextTier = resolveNextTier(tiers, selectedCount);
  const { discountedTotalCents, savingsCents } = applyTier(subtotalCents, activeTier);
  const nudgeMessage = buildNudgeMessage(nextTier, selectedCount);

  return {
    activeTier,
    nextTier,
    nudgeMessage,
    discountedTotalCents,
    savingsCents,
  };
}

// ─── Gift progress ────────────────────────────────────────────────────────────

/**
 * Evaluate gift rule progress from the client side.
 * cartSubtotalDollars is read from Shopify's cart AJAX API.
 */
export function evaluateGiftProgress(
  thresholdType: string,
  thresholdValue: number,
  cartSubtotalDollars: number,
  cartItemCount: number,
  giftTitle: string,
  progressMessage: string
): { isEligible: boolean; progressPercent: number; amountRemaining: number; message: string } {
  let current = 0;
  if (thresholdType === "cart_value") current = cartSubtotalDollars;
  else if (thresholdType === "item_count") current = cartItemCount;

  const isEligible = current >= thresholdValue;
  const amountRemaining = Math.max(0, thresholdValue - current);
  const progressPercent = Math.min(100, Math.round((current / thresholdValue) * 100));

  const message = isEligible
    ? `🎁 Your free ${giftTitle} has been added!`
    : progressMessage
        .replace(
          "{amount}",
          thresholdType === "cart_value"
            ? `$${amountRemaining.toFixed(2)}`
            : `${amountRemaining} item${amountRemaining !== 1 ? "s" : ""}`
        )
        .replace("{gift}", giftTitle);

  return { isEligible, progressPercent, amountRemaining, message };
}

// ─── Legacy compat ────────────────────────────────────────────────────────────

/** Simple apply for non-tiered use (kept for cart.ts compat) */
export function applyDiscount(
  total: number,
  type: "percentage" | "fixed" | "none" | "price",
  value: number
): number {
  if (type === "percentage") return total * (1 - value / 100);
  if (type === "fixed") return Math.max(0, total - value);
  if (type === "price") return value;
  return total;
}