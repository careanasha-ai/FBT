/**
 * Widget DOM rendering — pure vanilla JS, no framework dependencies.
 */

import type { WidgetConfig, ProductItem } from "./types";
import { fetchProductData, sendAnalyticsEvent } from "./api";
import { addBundleToCart } from "./cart";
import { injectStyles } from "./styles";
import { getSessionId, findInsertionPoint } from "./utils";
import { formatPrice, calculateBundleTotal, applyDiscount } from "./currency";

const WIDGET_ID = "fbt-widget-root";

export async function renderWidget(
  config: WidgetConfig,
  shopDomain: string
): Promise<void> {
  // Avoid double-render
  if (document.getElementById(WIDGET_ID)) return;

  // Inject CSS
  injectStyles();

  // Fetch product data for all FBT products
  const allProductIds = [config.mainProductId, ...config.fbtProductIds];
  const productData = await fetchProductData(allProductIds);

  if (productData.length < 2) return; // Need at least main + 1 FBT product

  const products: ProductItem[] = productData.map((p) => ({
    ...p,
    isMain: p.id === config.mainProductId,
  }));

  // Track selected products (all selected by default)
  const selectedIds = new Set(products.map((p) => p.id));

  // Build widget DOM
  const container = buildContainer(config, products, selectedIds, shopDomain);

  // Insert into page
  const insertAfter = findInsertionPoint();
  if (insertAfter) {
    insertAfter.insertAdjacentElement("afterend", container);
  } else {
    document.body.appendChild(container);
  }

  // Fire view event
  sendAnalyticsEvent(shopDomain, {
    eventType: "view",
    groupId: config.groupId,
    productId: config.mainProductId,
    sessionId: getSessionId(),
  });
}

function buildContainer(
  config: WidgetConfig,
  products: ProductItem[],
  selectedIds: Set<string>,
  shopDomain: string
): HTMLElement {
  const root = document.createElement("div");
  root.id = WIDGET_ID;
  root.className = "fbt-widget";

  function rerender() {
    root.innerHTML = "";
    root.appendChild(buildInner(config, products, selectedIds, shopDomain, rerender));
  }

  root.appendChild(buildInner(config, products, selectedIds, shopDomain, rerender));
  return root;
}

function buildInner(
  config: WidgetConfig,
  products: ProductItem[],
  selectedIds: Set<string>,
  shopDomain: string,
  rerender: () => void
): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "fbt-inner";

  // Title
  const title = document.createElement("h3");
  title.className = "fbt-title";
  title.textContent = config.widgetTitle;
  wrap.appendChild(title);

  // Products row
  const row = document.createElement("div");
  row.className = "fbt-products-row";

  products.forEach((product, index) => {
    if (index > 0) {
      const plus = document.createElement("span");
      plus.className = "fbt-plus";
      plus.textContent = "+";
      row.appendChild(plus);
    }

    const card = buildProductCard(product, selectedIds, shopDomain, config, rerender);
    row.appendChild(card);
  });

  wrap.appendChild(row);

  // Summary + CTA
  const footer = buildFooter(config, products, selectedIds, shopDomain);
  wrap.appendChild(footer);

  return wrap;
}

function buildProductCard(
  product: ProductItem,
  selectedIds: Set<string>,
  shopDomain: string,
  config: WidgetConfig,
  rerender: () => void
): HTMLElement {
  const card = document.createElement("div");
  card.className = `fbt-product-card ${selectedIds.has(product.id) ? "fbt-selected" : ""}`;

  // Checkbox (main product is always checked and disabled)
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "fbt-checkbox";
  checkbox.checked = selectedIds.has(product.id);
  checkbox.disabled = product.isMain;

  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      selectedIds.add(product.id);
    } else {
      selectedIds.delete(product.id);
    }
    sendAnalyticsEvent(shopDomain, {
      eventType: "click",
      groupId: config.groupId,
      productId: product.id,
      sessionId: getSessionId(),
    });
    rerender();
  });

  card.appendChild(checkbox);

  // Image
  if (product.image) {
    const img = document.createElement("img");
    img.src = product.image;
    img.alt = product.title;
    img.className = "fbt-product-image";
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

  // Main badge
  if (product.isMain) {
    const badge = document.createElement("span");
    badge.className = "fbt-main-badge";
    badge.textContent = "This item";
    card.appendChild(badge);
  }

  return card;
}

function buildFooter(
  config: WidgetConfig,
  products: ProductItem[],
  selectedIds: Set<string>,
  shopDomain: string
): HTMLElement {
  const footer = document.createElement("div");
  footer.className = "fbt-footer";

  const selectedProducts = products.filter((p) => selectedIds.has(p.id));
  const totalCents = calculateBundleTotal(selectedProducts.map((p) => p.price));
  const totalDollars = totalCents / 100;

  // Pricing summary
  const priceWrap = document.createElement("div");
  priceWrap.className = "fbt-price-summary";

  if (
    config.discount &&
    config.discount.type !== "none" &&
    selectedIds.size >= config.discount.minItems
  ) {
    const discounted = applyDiscount(
      totalDollars,
      config.discount.type,
      config.discount.value
    );
    const savings = totalDollars - discounted;

    priceWrap.innerHTML = `
      <span class="fbt-price-original">${formatPrice(totalDollars, "USD")}</span>
      <span class="fbt-price-discounted">${formatPrice(discounted, "USD")}</span>
      <span class="fbt-savings">Save ${formatPrice(savings, "USD")}</span>
    `;
  } else {
    priceWrap.innerHTML = `
      <span class="fbt-price-total">Total: ${formatPrice(totalDollars, "USD")}</span>
    `;
  }

  footer.appendChild(priceWrap);

  // CTA Button
  const btn = document.createElement("button");
  btn.className = "fbt-cta-btn";
  btn.textContent = config.ctaText;
  btn.disabled = selectedIds.size === 0;

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "Adding...";

    const toAdd = products.filter((p) => selectedIds.has(p.id));

    try {
      await addBundleToCart(toAdd, config);
      sendAnalyticsEvent(shopDomain, {
        eventType: "add_to_cart",
        groupId: config.groupId,
        productId: config.mainProductId,
        sessionId: getSessionId(),
        metadata: { productCount: toAdd.length },
      });
      btn.textContent = "Added! ✓";
      setTimeout(() => {
        btn.textContent = config.ctaText;
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