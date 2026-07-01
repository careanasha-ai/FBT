/**
 * Storefront utility helpers
 */

/**
 * Get the current Shopify shop domain from the page.
 * Shopify exposes this via the global `Shopify` object on all storefronts.
 */
export function getShopDomain(): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shopify = (window as any).Shopify;
  return shopify?.shop ?? null;
}

/**
 * Get the current product's GID from the page.
 * Shopify exposes product data via `ShopifyAnalytics.meta` on product pages.
 */
export function getCurrentProductId(): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta = (window as any).ShopifyAnalytics?.meta;
  const numericId = meta?.product?.id;

  if (!numericId) return null;

  return `gid://shopify/Product/${numericId}`;
}

/**
 * Generate a simple session ID for analytics tracking.
 * Persisted in sessionStorage so it survives page navigation within a session.
 */
export function getSessionId(): string {
  const key = "_fbt_sid";
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

/**
 * Find the "Add to Cart" form on the current product page.
 * Works with most Shopify themes.
 */
export function findAddToCartForm(): HTMLFormElement | null {
  return (
    document.querySelector<HTMLFormElement>('form[action="/cart/add"]') ?? null
  );
}

/**
 * Find a good insertion point for the FBT widget.
 * Inserts after the Add to Cart form, or before </main> as fallback.
 */
export function findInsertionPoint(): Element | null {
  const form = findAddToCartForm();
  if (form) return form;

  return (
    document.querySelector(".product-form") ??
    document.querySelector(".product__info-container") ??
    document.querySelector("main") ??
    null
  );
}