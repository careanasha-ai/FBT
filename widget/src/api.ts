/**
 * Widget API client — fetches FBT config and product data from the app server.
 */

import type { WidgetConfig } from "./types";

const APP_URL = "__APP_URL__"; // Replaced at build time via Vite define

/**
 * Fetch FBT widget configuration for the current product.
 * Returns null if no FBT group is configured for this product.
 */
export async function fetchWidgetConfig(
  shopDomain: string,
  productId: string
): Promise<WidgetConfig | null> {
  const url = `${APP_URL}/api/widget?shop=${encodeURIComponent(shopDomain)}&product=${encodeURIComponent(productId)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok || res.status === 404) return null;

  const data = await res.json();
  return data.found ? data.config : null;
}

/**
 * Fetch Shopify product data via the Storefront API (AJAX).
 * Used to get titles, images, and prices for FBT products.
 */
export async function fetchProductData(
  productIds: string[]
): Promise<ShopifyProductData[]> {
  // Use Shopify's AJAX API — available on all storefronts without auth
  const numericIds = productIds.map((gid) => gid.split("/").pop()!);

  const results: ShopifyProductData[] = [];

  await Promise.all(
    numericIds.map(async (id) => {
      try {
        const res = await fetch(`/products.json?ids=${id}&limit=1`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.products?.[0]) {
          results.push(normalizeProduct(data.products[0]));
        }
      } catch {
        // Skip failed products silently
      }
    })
  );

  return results;
}

/**
 * Send an analytics event to the app server.
 */
export async function sendAnalyticsEvent(
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
    await fetch(`${APP_URL}/api/analytics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shop: shopDomain, ...event }),
      keepalive: true, // Ensures request completes even if page navigates away
    });
  } catch {
    // Analytics failures are non-fatal
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShopifyProductData {
  id: string; // GID
  title: string;
  handle: string;
  image: string | null;
  price: number; // in cents
  currencyCode: string;
  variantId: string;
  availableForSale: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeProduct(raw: any): ShopifyProductData {
  const variant = raw.variants?.[0];
  return {
    id: `gid://shopify/Product/${raw.id}`,
    title: raw.title,
    handle: raw.handle,
    image: raw.images?.[0]?.src ?? null,
    price: Math.round(parseFloat(variant?.price ?? "0") * 100),
    currencyCode: "USD", // AJAX API doesn't return currency; use Shopify.currency
    variantId: `gid://shopify/ProductVariant/${variant?.id}`,
    availableForSale: variant?.available ?? false,
  };
}