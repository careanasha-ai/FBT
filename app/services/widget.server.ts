import { prisma } from "~/db/client";
import { getFbtGroupByProduct } from "./fbt.server";
import { getActiveGiftRules } from "./gift.server";

// ─── Widget Config Response ───────────────────────────────────────────────────

export interface DiscountTierConfig {
  minItems: number;
  discountType: string;
  discountValue: number;
}

export interface GiftRuleConfig {
  ruleId: number;
  giftVariantId: string;
  giftTitle: string;
  giftImageUrl: string | null;
  thresholdType: string;
  thresholdValue: number;
  showProgressBar: boolean;
  progressMessage: string;
}

export interface WidgetConfig {
  groupId: number;
  bundleType: string;           // 'fixed' | 'flexible' | 'volume'
  displayMode: string;          // 'inline' | 'popup' | 'both'
  mainProductId: string;
  fbtProductIds: string[];
  minSelect: number;
  maxSelect: number;
  discountTiers: DiscountTierConfig[];
  giftRules: GiftRuleConfig[];
  widgetTitle: string;
  ctaText: string;
  // AI metadata (shown in widget if present)
  aiTheme: string | null;
  aiRationale: string | null;
}

/**
 * Build the full widget configuration payload for a given shop + product.
 * Returns null if no active FBT group exists for the product.
 */
export async function buildWidgetConfig(
  shopDomain: string,
  productId: string
): Promise<WidgetConfig | null> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true },
  });
  if (!shop) return null;

  const [group, giftRules] = await Promise.all([
    getFbtGroupByProduct(shop.id, productId),
    getActiveGiftRules(shop.id),
  ]);

  if (!group || !group.isActive) return null;

  return {
    groupId: group.id,
    bundleType: group.bundleType,
    displayMode: group.displayMode,
    mainProductId: group.productId,
    fbtProductIds: group.fbtProducts.map((p) => p.productId),
    minSelect: group.minSelect,
    maxSelect: group.maxSelect,
    discountTiers: group.discountTiers.map((t) => ({
      minItems: t.minItems,
      discountType: t.discountType,
      discountValue: Number(t.discountValue),
    })),
    giftRules: giftRules.map((r) => ({
      ruleId: r.id,
      giftVariantId: r.giftVariantId,
      giftTitle: r.giftTitle ?? "Gift",
      giftImageUrl: r.giftImageUrl,
      thresholdType: r.thresholdType,
      thresholdValue: Number(r.thresholdValue),
      showProgressBar: r.showProgressBar,
      progressMessage: r.progressMessage,
    })),
    widgetTitle: "Frequently Bought Together",
    ctaText: "Add All to Cart",
    aiTheme: group.aiTheme,
    aiRationale: group.aiRationale,
  };
}