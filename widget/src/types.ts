/**
 * Shared types for the FBT widget — Phase 1.5
 */

// ─── Server config (from /api/widget) ────────────────────────────────────────

export interface DiscountTierConfig {
  minItems: number;
  discountType: "percentage" | "fixed" | "price" | "none";
  discountValue: number;
}

export interface GiftRuleConfig {
  ruleId: number;
  giftVariantId: string;
  giftTitle: string;
  giftImageUrl: string | null;
  thresholdType: "cart_value" | "item_count" | "fbt_add";
  thresholdValue: number;
  showProgressBar: boolean;
  progressMessage: string;
}

export interface WidgetConfig {
  groupId: number;
  bundleType: "fixed" | "flexible" | "volume";
  displayMode: "inline" | "popup" | "both";
  mainProductId: string;
  fbtProductIds: string[];
  minSelect: number;
  maxSelect: number;
  discountTiers: DiscountTierConfig[];
  giftRules: GiftRuleConfig[];
  widgetTitle: string;
  ctaText: string;
  aiTheme: string | null;
  aiRationale: string | null;
}

// ─── Block settings (from Liquid data-* attrs) ────────────────────────────────

export interface BlockSettings {
  appUrl: string;
  shopDomain: string;
  productId: string;
  widgetTitle: string;
  ctaText: string;
  buttonColor: string;
  showSavings: boolean;
  maxProducts: number;
}

// ─── Widget state ─────────────────────────────────────────────────────────────

export interface ProductItem {
  id: string;
  variantId: string;
  title: string;
  handle: string;
  image: string | null;
  price: number;            // cents
  currencyCode: string;
  availableForSale: boolean;
  isMain: boolean;
}

export interface DiscountState {
  activeTier: DiscountTierConfig | null;
  nextTier: DiscountTierConfig | null;
  nudgeMessage: string | null;
  discountedTotalCents: number;
  savingsCents: number;
}

export interface GiftState {
  ruleId: number;
  giftTitle: string;
  giftImageUrl: string | null;
  isEligible: boolean;
  progressPercent: number;
  amountRemaining: number;
  progressMessage: string;
}