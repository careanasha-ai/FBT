/**
 * FBT Widget — Entry Point
 *
 * Self-executing script injected via Shopify ScriptTag.
 * Detects the current product page, fetches FBT config,
 * and renders the widget.
 */

import { fetchWidgetConfig } from "./api";
import { renderWidget } from "./render";
import { getShopDomain, getCurrentProductId } from "./utils";

async function init() {
  // Only run on product pages
  const productId = getCurrentProductId();
  if (!productId) return;

  const shopDomain = getShopDomain();
  if (!shopDomain) return;

  try {
    const config = await fetchWidgetConfig(shopDomain, productId);
    if (!config) return;

    renderWidget(config, shopDomain);
  } catch (err) {
    // Fail silently — never break the storefront
    console.warn("[FBT Widget] Failed to load:", err);
  }
}

// Run after DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}