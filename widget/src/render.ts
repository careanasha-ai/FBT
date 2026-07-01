/**
 * Widget DOM rendering — Theme App Extension version.
 *
 * Key changes from ScriptTag version:
 * - Renders INTO the existing #fbt-widget-root div (placed by Liquid block)
 * - No findInsertionPoint() — placement is handled by the theme editor
 * - Reads button colour from BlockSettings (merchant-configurable)
 * - appUrl threaded through for analytics calls
 * - showSavings and maxProducts respect merchant theme editor settings
 */

import type { WidgetConfig, ProductItem, BlockSettings } from "./types";
import { fetchProductData, sendAnalyticsEvent } from "./api";
import { addBundleToCart } from "./cart";
import { injectStyles } from "./styles";
import { getSessionId } from "./utils";
import { formatPrice, calculateBundleTotal, applyDiscount } from "./currency";

export async function renderWidget(
  root: HTMLElement,
  config: WidgetConfig,
  settings: BlockSettings
): Promise<void> {
  // Inject scoped CSS (idempotent)
  injectStyles(settings.buttonColor);

  // Collect all product IDs — main first, then FBT products (capped by maxProducts)
  const fbtIds = config.fbtProductIds.slice(0, settings.maxProducts);
  const allIds = [config.mainProductId, ...fbtIds];

  const productData = await fetchProductData(allIds);
  if (productData.length < 2) {
    root.style.display = "none";
    return;
  }

  const products: ProductItem[] = productData.map((p) => ({
    ...p,
    isMain: p.id === config.mainProductId,
  }));

  // All products selected by default
  const selectedIds = new Set(products.map((p) => p.id));

  // Initial render
  mount(root, config, products, selectedIds, settings);

  // Fire view analytics event
  sendAnalyticsEvent(settings.appUrl, settings.shopDomain, {
    eventType: "view",
    groupId: config.groupId,
    productId: config.mainProductId,
    sessionId: getSessionId(),
  });
}

// ─── Mount / Re-render ────────────────────────────────────────────────────────

function mount(
  root: HTMLElement,
  config: WidgetConfig,
  products: ProductItem[],
  selectedIds: Set<string>,
  settings: BlockSettings
): void {
  root.innerHTML = "";

  const inner = document.createElement("div");
  inner.className = "fbt-inner";

  // Title
  const title = document.createElement("h3");
  title.className = "fbt-title";
  title.textContent = settings.widgetTitle;
  inner.appendChild(title);

  // Products row
  inner.appendChild(
    buildProductsRow(root, config, products, selectedIds, settings)
  );

  // Footer (pricing + CTA)
  inner.appendChild(buildFooter(root, config, products, selectedIds, settings));

  root.appendChild(inner);
}

// ─── Products Row ─────────────────────────────────────────────────────────────

function buildProductsRow(
  root: HTMLElement,
  config: WidgetConfig,
  products: ProductItem[],
  selectedIds: Set<string>,
  settings: BlockSettings
): HTMLElement {
  const row = document.createElement("div");
  row.className = "fbt-products-row";

  products.forEach((product, index) => {
    if (index > 0) {
      const plus = document.createElement("span");
      plus.className = "fbt-plus";
      plus.textContent = "+";
      row.appendChild(plus);
    }
    row.appendChild(
      buildProductCard(root, config, product, selectedIds, settings)
    );
  });

  return row;
}

function buildProductCard(
  root: HTMLElement,
  config: WidgetConfig,
  product: ProductItem,
  selectedIds: Set<string>,
  settings: BlockSettings
): HTMLElement {
  const card = document.createElement("div");
  card.className = `fbt-product-card${selectedIds.has(product.id) ? " fbt-selected" : ""}`;

  // Checkbox — main product always checked + disabled
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "fbt-checkbox";
  checkbox.checked = selectedIds.has(product.id);
  checkbox.disabled = product.isMain;
  checkbox.setAttribute("aria-label", `Include ${product.title}`);

  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      selectedIds.add(product.id);
    } else {
      selectedIds.delete(product.id);
    }

    sendAnalyticsEvent(settings.appUrl, settings.shopDomain, {
      eventType: "click",
      groupId: config.groupId,
      productId: product.id,
      sessionId: getSessionId(),
    });

    // Re-render in place
    mount(root, config, products(root), selectedIds, settings);
  });

  card.appendChild(checkbox);

  // Product image
  if (product.image) {
    const img = document.createElement("img");
    img.src = product.image;
    img.alt = product.title;
    img.className = "fbt-product-image";
    img.loading = "lazy";
    card.appendChild(img);
  }

  // Title
  const titleEl = document.createElement("p");
  titleEl.className = "fbt-product-title";
  titleEl.textContent = product.title;
  card.appendChild(titleEl);

  // Price
  const priceEl = document.createElement("p");
  priceEl.className = "fbt-product-price";
  priceEl.textContent = formatPrice(product.price / 100, product.currencyCode);
  card.appendChild(priceEl);

  // "This item" badge on main product
  if (product.isMain) {
    const badge = document.createElement("span");
    badge.className = "fbt-main-badge";
    badge.textContent = "This item";
    card.appendChild(badge);
  }

  return card;
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function buildFooter(
  root: HTMLElement,
  config: WidgetConfig,
  products: ProductItem[],
  selectedIds: Set<string>,
  settings: BlockSettings
): HTMLElement {
  const footer = document.createElement("div");
  footer.className = "fbt-footer";

  const selected = products.filter((p) => selectedIds.has(p.id));
  const totalCents = calculateBundleTotal(selected.map((p) => p.price));
  const totalDollars = totalCents / 100;

  const hasDiscount =
    settings.showSavings &&
    config.discount &&
    config.discount.type !== "none" &&
    selectedIds.size >= config.discount.minItems;

  // Price summary
  const priceWrap = document.createElement("div");
  priceWrap.className = "fbt-price-summary";

  if (hasDiscount && config.discount) {
    const discounted = applyDiscount(
      totalDollars,
      config.discount.type,
      config.discount.value
    );
    const savings = totalDollars - discounted;

    const original = document.createElement("span");
    original.className = "fbt-price-original";
    original.textContent = formatPrice(totalDollars, selected[0]?.currencyCode ?? "USD");

    const discountedEl = document.createElement("span");
    discountedEl.className = "fbt-price-discounted";
    discountedEl.textContent = formatPrice(discounted, selected[0]?.currencyCode ?? "USD");

    const savingsEl = document.createElement("span");
    savingsEl.className = "fbt-savings";
    savingsEl.textContent = `Save ${formatPrice(savings, selected[0]?.currencyCode ?? "USD")}`;

    priceWrap.appendChild(original);
    priceWrap.appendChild(discountedEl);
    priceWrap.appendChild(savingsEl);
  } else {
    const totalEl = document.createElement("span");
    totalEl.className = "fbt-price-total";
    totalEl.textContent = `Total: ${formatPrice(totalDollars, selected[0]?.currencyCode ?? "USD")}`;
    priceWrap.appendChild(totalEl);
  }

  footer.appendChild(priceWrap);

  // CTA button
  const btn = document.createElement("button");
  btn.className = "fbt-cta-btn";
  btn.textContent = settings.ctaText;
  btn.disabled = selectedIds.size === 0;
  btn.style.setProperty("--fbt-btn-color", settings.buttonColor);

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "Adding…";

    const toAdd = products.filter((p) => selectedIds.has(p.id));

    try {
      await addBundleToCart(toAdd, config);

      sendAnalyticsEvent(settings.appUrl, settings.shopDomain, {
        eventType: "add_to_cart",
        groupId: config.groupId,
        productId: config.mainProductId,
        sessionId: getSessionId(),
        metadata: { productCount: toAdd.length },
      });

      btn.textContent = "Added ✓";
      setTimeout(() => {
        btn.textContent = settings.ctaText;
        btn.disabled = false;
      }, 2000);
    } catch {
      btn.textContent = "Error — try again";
      btn.disabled = false;
    }
  });

  footer.appendChild(btn);
  return footer;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Re-read current products from the rendered cards.
 * Used to preserve product list across re-renders triggered by checkbox changes.
 * In practice the product list is stable — this avoids closing over a stale array.
 */
function products(root: HTMLElement): ProductItem[] {
  // Products are stored as data on the card elements
  return Array.from(root.querySelectorAll<HTMLElement>(".fbt-product-card")).map(
    (card) => JSON.parse(card.dataset.product ?? "{}")
  );
}