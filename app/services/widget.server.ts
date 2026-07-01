import { prisma } from "~/db/client";
import { getFbtGroupByProduct } from "./fbt.server";

// ─── Widget Config Response ───────────────────────────────────────────────────

export interface WidgetConfig {
  groupId: number;
  mainProductId: string;
  fbtProductIds: string[];
  discount: {
    type: string;
    value: number;
    minItems: number;
  } | null;
  widgetTitle: string;
  ctaText: string;
}

/**
 * Build the widget configuration payload for a given shop + product.
 * Returns null if no active FBT group exists for the product.
 */
export async function buildWidgetConfig(
  shopDomain: string,
  productId: string
): Promise<WidgetConfig | null> {
  // Look up shop
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true },
  });

  if (!shop) return null;

  // Look up FBT group
  const group = await getFbtGroupByProduct(shop.id, productId);
  if (!group || !group.isActive) return null;

  return {
    groupId: group.id,
    mainProductId: group.productId,
    fbtProductIds: group.fbtProducts.map((p) => p.productId),
    discount: group.discountRule
      ? {
          type: group.discountRule.discountType,
          value: Number(group.discountRule.discountValue),
          minItems: group.discountRule.minItems,
        }
      : null,
    widgetTitle: "Frequently Bought Together",
    ctaText: "Add All to Cart",
  };
}