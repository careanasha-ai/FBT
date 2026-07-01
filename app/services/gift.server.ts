import { prisma } from "~/db/client";
import type { GiftRuleInput } from "~/utils/validation";

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function listGiftRules(shopId: number) {
  return prisma.giftRule.findMany({
    where: { shopId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getGiftRule(ruleId: number, shopId: number) {
  return prisma.giftRule.findFirst({
    where: { id: ruleId, shopId },
  });
}

/**
 * Get all active gift rules for a shop — used by widget to evaluate eligibility.
 */
export async function getActiveGiftRules(shopId: number) {
  return prisma.giftRule.findMany({
    where: { shopId, isActive: true },
    orderBy: { thresholdValue: "asc" },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createGiftRule(shopId: number, input: GiftRuleInput) {
  return prisma.giftRule.create({
    data: {
      shopId,
      name: input.name,
      thresholdType: input.thresholdType,
      thresholdValue: input.thresholdValue,
      giftProductId: input.giftProductId,
      giftVariantId: input.giftVariantId,
      giftTitle: input.giftTitle,
      giftImageUrl: input.giftImageUrl || null,
      maxPerOrder: input.maxPerOrder ?? 1,
      showProgressBar: input.showProgressBar ?? true,
      progressMessage:
        input.progressMessage ??
        "You're {amount} away from a free {gift}!",
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateGiftRule(
  ruleId: number,
  shopId: number,
  input: GiftRuleInput
) {
  return prisma.giftRule.update({
    where: { id: ruleId, shopId },
    data: {
      name: input.name,
      thresholdType: input.thresholdType,
      thresholdValue: input.thresholdValue,
      giftProductId: input.giftProductId,
      giftVariantId: input.giftVariantId,
      giftTitle: input.giftTitle,
      giftImageUrl: input.giftImageUrl || null,
      maxPerOrder: input.maxPerOrder ?? 1,
      showProgressBar: input.showProgressBar ?? true,
      progressMessage: input.progressMessage,
      isActive: input.isActive ?? true,
      updatedAt: new Date(),
    },
  });
}

export async function toggleGiftRule(
  ruleId: number,
  shopId: number,
  isActive: boolean
) {
  return prisma.giftRule.update({
    where: { id: ruleId, shopId },
    data: { isActive, updatedAt: new Date() },
  });
}

export async function deleteGiftRule(ruleId: number, shopId: number) {
  return prisma.giftRule.delete({ where: { id: ruleId, shopId } });
}

// ─── Gift Eligibility ─────────────────────────────────────────────────────────

export interface GiftEligibility {
  ruleId: number;
  giftVariantId: string;
  giftTitle: string;
  giftImageUrl: string | null;
  isEligible: boolean;
  progressPercent: number;   // 0–100
  amountRemaining: number;   // in dollars, 0 if eligible
  progressMessage: string;
}

/**
 * Evaluate gift rule eligibility for a given cart state.
 * Called by the widget API to include gift progress in the response.
 */
export function evaluateGiftEligibility(
  rules: Awaited<ReturnType<typeof getActiveGiftRules>>,
  cartSubtotalDollars: number,
  cartItemCount: number
): GiftEligibility[] {
  return rules.map((rule) => {
    const threshold = Number(rule.thresholdValue);
    let current = 0;

    if (rule.thresholdType === "cart_value") {
      current = cartSubtotalDollars;
    } else if (rule.thresholdType === "item_count") {
      current = cartItemCount;
    }

    const isEligible = current >= threshold;
    const amountRemaining = Math.max(0, threshold - current);
    const progressPercent = Math.min(100, Math.round((current / threshold) * 100));

    const message = rule.progressMessage
      .replace(
        "{amount}",
        rule.thresholdType === "cart_value"
          ? `$${amountRemaining.toFixed(2)}`
          : `${amountRemaining} item${amountRemaining !== 1 ? "s" : ""}`
      )
      .replace("{gift}", rule.giftTitle ?? "gift");

    return {
      ruleId: rule.id,
      giftVariantId: rule.giftVariantId,
      giftTitle: rule.giftTitle ?? "Gift",
      giftImageUrl: rule.giftImageUrl,
      isEligible,
      progressPercent,
      amountRemaining,
      progressMessage: isEligible
        ? `🎁 Your free ${rule.giftTitle ?? "gift"} has been added!`
        : message,
    };
  });
}