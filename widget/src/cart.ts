/**
 * Shopify AJAX Cart API integration
 */

import type { ProductItem, WidgetConfig } from "./types";

/**
 * Add all selected FBT products to the Shopify cart.
 * Uses the AJAX Cart API (/cart/add.js) — available on all storefronts.
 */
export async function addBundleToCart(
  products: ProductItem[],
  config: WidgetConfig
): Promise<void> {
  const items = products
    .filter((p) => p.availableForSale)
    .map((p) => ({
      id: extractVariantId(p.variantId),
      quantity: 1,
    }));

  if (items.length === 0) return;

  // Cart attributes to track FBT bundle (used for analytics on order-paid webhook)
  const properties: Record<string, string> = {
    _fbt_group_id: String(config.groupId),
    _fbt_bundle: "true",
  };

  const response = await fetch("/cart/add.js", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items,
      // Attach FBT metadata to first item's properties
      sections_url: "/cart",
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.description ?? "Failed to add to cart");
  }

  // Also update cart attributes to track the bundle group
  await fetch("/cart/update.js", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attributes: properties }),
  });

  // Open cart drawer / redirect to cart (theme-dependent)
  openCart();
}

/**
 * Extract numeric variant ID from a Shopify GID
 */
function extractVariantId(gid: string): number {
  const parts = gid.split("/");
  return parseInt(parts[parts.length - 1], 10);
}

/**
 * Attempt to open the cart — works with most Shopify themes.
 * Falls back to redirecting to /cart if no drawer is found.
 */
function openCart(): void {
  // Try Dawn / common theme cart drawer triggers
  const drawerTrigger =
    document.querySelector<HTMLElement>("[data-cart-toggle]") ??
    document.querySelector<HTMLElement>("[data-open-cart]") ??
    document.querySelector<HTMLElement>(".cart-toggle") ??
    document.querySelector<HTMLElement>("#cart-icon-bubble");

  if (drawerTrigger) {
    drawerTrigger.click();
  } else {
    // Fallback: dispatch custom event (some themes listen for this)
    document.dispatchEvent(new CustomEvent("cart:open"));
  }
}