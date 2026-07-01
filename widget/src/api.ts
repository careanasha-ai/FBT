/**
 * Widget API client — Theme App Extension version.
 *
 * APP_URL is no longer a build-time constant — it is read from the
 * data-app-url attribute on the block root, set by Liquid at render time.
 * This means the same widget JS works across dev, staging, and production
 * without a rebuild.
 */

import type { WidgetConfig } from "./types";

// ─── FBT Config ───────────────────────────────────────────────────────────────

/**
 * Fetch FBT widget configuration for the current product.
 * Returns null if no active FBT group is configured for this product.
 *
 * @param appUrl   - Base URL of the Railway app (from data-app-url)
 * @param shopDomain - Shopify shop domain (from data-shop)
 * @param productId  - Shopify product GID (from data-product)
 */
export async function fetchWidgetConfig(
  appUrl: string,
  shopDomain: string,
  productId: string
): Promise<WidgetConfig | null> {
  const url = `${appUrl}/api/widget?shop=${encodeURIComponent(shopDomain)}&product=${encodeURIComponent(productId)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok || res.status === 404) return null;

  const data = await res.json();
  return data.found ? (data.config as WidgetConfig) : null;
}

// ─── Product Data ─────────────────────────────────────────────────────────────

export interface ShopifyProductData {
  id: string;               // GID
  title: string;
  handle: string;
  image: string | null;
  price: number;            // cents
  currencyCode: string;
  variantId: string;        // GID
  availableForSale: boolean;
}

/**
 * Fetch Shopify product data via the Storefront AJAX API.
 * Available on all storefronts without authentication.
 * Runs in parallel for all product IDs.
 */
export async function fetchProductData(
  productIds: string[]
): Promise<ShopifyProductData[]> {
  const results = await Promise.allSettled(
    productIds.map((gid) => fetchSingleProduct(gid))
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<ShopifyProductData> =>
        r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value);
}

async function fetchSingleProduct(
  gid: string
): Promise<ShopifyProductData> {
  const numericId = gid.split("/").pop()!;
  const res = await fetch(`/products.json?ids=${numericId}&limit=1`);

  if (!res.ok) throw new Error(`Product fetch failed: ${res.status}`);

  const data = await res.json();
  const raw = data.products?.[0];
  if (!raw) throw new Error(`Product not found: ${numericId}`);

  return normalizeProduct(raw);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeProduct(raw: any): ShopifyProductData {
  const variant = raw.variants?.[0];
  // Use Shopify's storefront currency if available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currency = (window as any).Shopify?.currency?.active ?? "USD";

  return {
    id: `gid://shopify/Product/${raw.id}`,
    title: raw.title,
    handle: raw.handle,
    image: raw.images?.[0]?.src ?? null,
    price: Math.round(parseFloat(variant?.price ?? "0") * 100),
    currencyCode: currency,
    variantId: `gid://shopify/ProductVariant/${variant?.id}`,
    availableForSale: variant?.available ?? false,
  };
}

// ─── Analytics ────────────────────────────────────────────────────────────────

/**
 * Send an analytics event to the app server.
 * Fire-and-forget — failures are silently swallowed.
 */
export async function sendAnalyticsEvent(
  appUrl: string,
  shopDomain: string,
  event: {
    eventType: string;
    groupId?: number;
    productId?: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await fetch(`${appUrl}/api/analytics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shop: shopDomain, ...event }),
      keepalive: true,
    });
  } catch {
    // Analytics failures are non-fatal
  }
}