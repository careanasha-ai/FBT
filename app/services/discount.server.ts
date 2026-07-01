import type { DiscountTier } from "@prisma/client";

// ─── Tier Resolution ──────────────────────────────────────────────────────────

/**
 * Find the best applicable discount tier for a given item count.
 * Tiers are sorted by minItems descending — highest qualifying tier wins.
 */
export function resolveDiscountTier(
  tiers: DiscountTier[],
  itemCount: number
): DiscountTier | null {
  const sorted = [...tiers]
    .filter((t) => itemCount >= t.minItems)
    .sort((a, b) => b.minItems - a.minItems);
  return sorted[0] ?? null;
}

/**
 * Calculate the discounted total for a bundle.
 */
export function calculateDiscountedTotal(
  subtotalCents: number,
  tier: DiscountTier | null
): { discountedTotal: number; savingsCents: number } {
  if (!tier || tier.discountType === "none") {
    return { discountedTotal: subtotalCents, savingsCents: 0 };
  }

  const value = Number(tier.discountValue);

  if (tier.discountType === "percentage") {
    const savings = Math.round(subtotalCents * (value / 100));
    return { discountedTotal: subtotalCents - savings, savingsCents: savings };
  }

  if (tier.discountType === "fixed") {
    const savings = Math.min(Math.round(value * 100), subtotalCents);
    return { discountedTotal: subtotalCents - savings, savingsCents: savings };
  }

  if (tier.discountType === "price") {
    // Flat bundle price — value is in dollars
    const bundlePriceCents = Math.round(value * 100);
    const savings = Math.max(0, subtotalCents - bundlePriceCents);
    return { discountedTotal: bundlePriceCents, savingsCents: savings };
  }

  return { discountedTotal: subtotalCents, savingsCents: 0 };
}

/**
 * Build the "next tier nudge" message shown in the widget.
 * e.g. "Add 1 more item to save 20%!"
 */
export function buildNudgeMessage(
  tiers: DiscountTier[],
  currentItemCount: number
): string | null {
  const nextTier = tiers
    .filter((t) => t.minItems > currentItemCount)
    .sort((a, b) => a.minItems - b.minItems)[0];

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

  return `Add ${needed} more item${needed > 1 ? "s" : ""} to save ${label}!`;
}

/**
 * Format a discount tier for display in the admin UI.
 */
export function formatTierLabel(tier: DiscountTier): string {
  const value = Number(tier.discountValue);
  if (tier.discountType === "percentage") return `${value}% off`;
  if (tier.discountType === "fixed") return `$${value} off`;
  if (tier.discountType === "price") return `Bundle price: $${value}`;
  return "No discount";
}

/**
 * Generate a unique discount code for a bundle session (Phase 1 cart attributes approach).
 */
export function generateBundleDiscountCode(
  groupId: number,
  sessionId: string
): string {
  return `FBT-${groupId}-${sessionId.slice(0, 6).toUpperCase()}`;
}