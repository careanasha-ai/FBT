// ─── App ──────────────────────────────────────────────────────────────────────
export const APP_NAME = "Frequently Bought Together";
export const APP_VERSION = "0.1.0";

// ─── Shopify ──────────────────────────────────────────────────────────────────
export const SHOPIFY_API_VERSION = "2024-07";

export const SHOPIFY_SCOPES = [
  "read_products",
  "write_products",
  "read_script_tags",
  "write_script_tags",
  "read_discounts",
  "write_discounts",
  "read_orders",
] as const;

// ─── FBT ──────────────────────────────────────────────────────────────────────
export const FBT_MAX_PRODUCTS = 4;       // Max linked products per group
export const FBT_MIN_PRODUCTS = 1;       // Min linked products per group

// ─── Discount ─────────────────────────────────────────────────────────────────
export const DISCOUNT_TYPES = {
  PERCENTAGE: "percentage",
  FIXED: "fixed",
  NONE: "none",
} as const;

export type DiscountType = (typeof DISCOUNT_TYPES)[keyof typeof DISCOUNT_TYPES];

// ─── Analytics ────────────────────────────────────────────────────────────────
export const ANALYTICS_EVENT_TYPES = {
  VIEW: "view",
  CLICK: "click",
  ADD_TO_CART: "add_to_cart",
  PURCHASE: "purchase",
} as const;

export type AnalyticsEventType =
  (typeof ANALYTICS_EVENT_TYPES)[keyof typeof ANALYTICS_EVENT_TYPES];

// ─── Widget ───────────────────────────────────────────────────────────────────
export const WIDGET_SCRIPT_PATH = "/widget/fbt-widget.js";
export const WIDGET_DEFAULT_TITLE = "Frequently Bought Together";
export const WIDGET_DEFAULT_CTA = "Add All to Cart";

// ─── Pagination ───────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const ANALYTICS_PAGE_SIZE = 50;