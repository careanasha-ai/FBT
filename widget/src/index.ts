/**
 * FBT Widget — Entry Point (Theme App Extension)
 *
 * Delivered via Shopify's CDN as a theme extension asset.
 * The Liquid block pre-populates all context via data attributes,
 * so there is no DOM traversal or ShopifyAnalytics dependency.
 *
 * Data flow:
 *   Liquid renders <div id="fbt-widget-root" data-shop="..." data-product="..." ...>
 *   → This script reads those attrs
 *   → Fetches FBT product list from /api/widget
 *   → Renders the widget in-place
 */

import { fetchWidgetConfig } from "./api";
import { renderWidget } from "./render";
import type { BlockSettings } from "./types";

function getBlockSettings(root: HTMLElement): BlockSettings {
  return {
    appUrl: root.dataset.appUrl ?? "",
    shopDomain: root.dataset.shop ?? "",
    productId: root.dataset.product ?? "",
    widgetTitle: root.dataset.widgetTitle ?? "Frequently Bought Together",
    ctaText: root.dataset.ctaText ?? "Add All to Cart",
    buttonColor: root.dataset.buttonColor ?? "#008060",
    showSavings: root.dataset.showSavings !== "false",
    maxProducts: parseInt(root.dataset.maxProducts ?? "3", 10),
  };
}

async function init() {
  const root = document.getElementById("fbt-widget-root") as HTMLElement | null;
  if (!root) return;

  const settings = getBlockSettings(root);

  if (!settings.shopDomain || !settings.productId || !settings.appUrl) {
    console.warn("[FBT Widget] Missing required data attributes on #fbt-widget-root");
    return;
  }

  try {
    const config = await fetchWidgetConfig(
      settings.appUrl,
      settings.shopDomain,
      settings.productId
    );

    if (!config) {
      // No FBT group configured for this product — hide the block cleanly
      root.style.display = "none";
      return;
    }

    // Remove skeleton loader
    root.innerHTML = "";

    // Render widget into the block root
    await renderWidget(root, config, settings);
  } catch (err) {
    // Never break the storefront
    console.warn("[FBT Widget] Failed to load:", err);
    root.style.display = "none";
  }
}

// Theme App Extensions load deferred — DOM is always ready
init();