/**
 * Shared types for the FBT widget — Theme App Extension version
 */

export interface WidgetConfig {
  groupId: number;
  mainProductId: string;
  fbtProductIds: string[];
  discount: {
    type: "percentage" | "fixed" | "none";
    value: number;
    minItems: number;
  } | null;
  widgetTitle: string;
  ctaText: string;
}

/**
 * Settings read from the Liquid block's data attributes.
 * These are set by the merchant in the Shopify theme editor.
 */
export interface BlockSettings {
  appUrl: string;           // data-app-url — Railway app base URL
  shopDomain: string;       // data-shop — e.g. mystore.myshopify.com
  productId: string;        // data-product — gid://shopify/Product/123
  widgetTitle: string;      // data-widget-title
  ctaText: string;          // data-cta-text
  buttonColor: string;      // data-button-color — hex colour
  showSavings: boolean;     // data-show-savings
  maxProducts: number;      // data-max-products — 1–4
}

export interface WidgetState {
  config: WidgetConfig;
  products: ProductItem[];
  selectedIds: Set<string>;
  isLoading: boolean;
  isAddingToCart: boolean;
}

export interface ProductItem {
  id: string;               // GID
  variantId: string;        // GID
  title: string;
  handle: string;
  image: string | null;
  price: number;            // cents
  currencyCode: string;
  availableForSale: boolean;
  isMain: boolean;
}