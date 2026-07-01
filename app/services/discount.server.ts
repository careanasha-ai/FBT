import { prisma } from "~/db/client";
import type { DiscountRuleInput } from "~/utils/validation";

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Get the discount rule for an FBT group
 */
export async function getDiscountRule(groupId: number) {
  return prisma.discountRule.findUnique({
    where: { groupId },
  });
}

/**
 * List all discount rules for a shop (via groups)
 */
export async function listDiscountRules(shopId: number) {
  return prisma.discountRule.findMany({
    where: {
      group: { shopId },
    },
    include: {
      group: {
        select: { id: true, productId: true, title: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Upsert a discount rule for an FBT group
 */
export async function upsertDiscountRule(
  groupId: number,
  input: DiscountRuleInput
) {
  return prisma.discountRule.upsert({
    where: { groupId },
    update: {
      discountType: input.discountType,
      discountValue: input.discountValue,
      minItems: input.minItems,
      updatedAt: new Date(),
    },
    create: {
      groupId,
      discountType: input.discountType,
      discountValue: input.discountValue,
      minItems: input.minItems,
    },
  });
}

/**
 * Delete a discount rule
 */
export async function deleteDiscountRule(groupId: number) {
  return prisma.discountRule.delete({
    where: { groupId },
  }).catch(() => null); // Ignore if not found
}

// ─── Discount Code Generation ─────────────────────────────────────────────────

/**
 * Generate a unique discount code for a bundle session.
 * In Phase 1 we use cart attributes + automatic discounts via Shopify.
 * This helper generates a deterministic code for the session.
 */
export function generateBundleDiscountCode(
  shopDomain: string,
  groupId: number,
  sessionId: string
): string {
  const prefix = "FBT";
  const suffix = `${groupId}-${sessionId.slice(0, 6).toUpperCase()}`;
  return `${prefix}-${suffix}`;
}

/**
 * Format discount label for display
 */
export function formatDiscountLabel(
  discountType: string,
  discountValue: number
): string {
  if (discountType === "percentage") {
    return `${discountValue}% off`;
  }
  if (discountType === "fixed") {
    return `$${discountValue} off`;
  }
  return "No discount";
}