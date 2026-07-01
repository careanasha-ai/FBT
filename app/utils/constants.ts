// ─── App ──────────────────────────────────────────────────────────────────────
export const APP_NAME = "Frequently Bought Together";
export const APP_VERSION = "0.2.0";

// ─── Shopify ──────────────────────────────────────────────────────────────────
export const SHOPIFY_API_VERSION = "2024-07";

export const SHOPIFY_SCOPES = [
  "read_products",
  "write_products",
  "read_discounts",
  "write_discounts",
  "read_orders",
] as const;

// ─── Bundle Types ─────────────────────────────────────────────────────────────
export const BUNDLE_TYPES = {
  FIXED:    "fixed",
  FLEXIBLE: "flexible",
  VOLUME:   "volume",
} as const;

export type BundleType = (typeof BUNDLE_TYPES)[keyof typeof BUNDLE_TYPES];

// ─── Display Modes ────────────────────────────────────────────────────────────
export const DISPLAY_MODES = {
  INLINE: "inline",
  POPUP:  "popup",
  BOTH:   "both",
} as const;

export type DisplayMode = (typeof DISPLAY_MODES)[keyof typeof DISPLAY_MODES];

// ─── Discount ─────────────────────────────────────────────────────────────────
export const DISCOUNT_TYPES = {
  PERCENTAGE: "percentage",
  FIXED:      "fixed",
  PRICE:      "price",    // flat bundle price
  NONE:       "none",
} as const;

export type DiscountType = (typeof DISCOUNT_TYPES)[keyof typeof DISCOUNT_TYPES];

// ─── Gift Rules ───────────────────────────────────────────────────────────────
export const THRESHOLD_TYPES = {
  CART_VALUE:  "cart_value",
  ITEM_COUNT:  "item_count",
  FBT_ADD:     "fbt_add",
} as const;

export type ThresholdType = (typeof THRESHOLD_TYPES)[keyof typeof THRESHOLD_TYPES];

// ─── Analytics ────────────────────────────────────────────────────────────────
export const ANALYTICS_EVENT_TYPES = {
  VIEW:             "view",
  CLICK:            "click",
  ADD_TO_CART:      "add_to_cart",
  PURCHASE:         "purchase",
  GIFT_UNLOCKED:    "gift_unlocked",
  POPUP_SHOWN:      "popup_shown",
  POPUP_DISMISSED:  "popup_dismissed",
} as const;

export type AnalyticsEventType =
  (typeof ANALYTICS_EVENT_TYPES)[keyof typeof ANALYTICS_EVENT_TYPES];

// ─── FBT Limits ───────────────────────────────────────────────────────────────
export const FBT_MAX_POOL_SIZE  = 12;   // max products in flexible pool
export const FBT_MAX_TIERS      = 5;    // max discount tiers per group

// ─── Widget ───────────────────────────────────────────────────────────────────
export const WIDGET_DEFAULT_TITLE = "Frequently Bought Together";
export const WIDGET_DEFAULT_CTA   = "Add All to Cart";

// ─── AI ───────────────────────────────────────────────────────────────────────
export const AI_MODEL             = "gpt-4o";
export const AI_MAX_PRODUCTS      = 250;   // max products sent to AI per analysis
export const AI_COST_PER_ANALYSIS = 1;     // credits per analysis run
export const AI_MIN_BUNDLE_SIZE   = 2;
export const AI_MAX_BUNDLE_SIZE   = 5;

// ─── Pagination ───────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE    = 20;
export const ANALYTICS_PAGE_SIZE  = 50;