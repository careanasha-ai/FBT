/**
 * Shared types for the FBT widget
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

export interface WidgetState {
  config: WidgetConfig;
  products: ProductItem[];
  selectedIds: Set<string>;
  isLoading: boolean;
  isAddingToCart: boolean;
}

export interface ProductItem {
  id: string;           // GID
  variantId: string;    // GID
  title: string;
  handle: string;
  image: string | null;
  price: number;        // cents
  currencyCode: string;
  availableForSale: boolean;
  isMain: boolean;
}