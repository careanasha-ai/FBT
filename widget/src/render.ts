/**
 * Widget DOM rendering — Phase 1.5
 *
 * Supports:
 * - Fixed bundles (exact products, customer can deselect)
 * - Flexible bundles (pick N from pool, with min/max enforcement)
 * - Tiered discounts (live recalculation + nudge messages)
 * - Gift with purchase progress bar
 * - Popup display mode (post-ATC modal)
 * - AI theme badge
 */

import type { WidgetConfig, ProductItem, BlockSettings, GiftState } from "./types";
import { fetchProductData, sendAnalyticsEvent } from "./api";
import { addBundleToCart } from "./cart";
import { injectStyles } from "./styles";
import { getSessionId } from "./utils";
import {
  formatPrice,
  calculateBundleTotal,
  computeDiscountState,
  evaluateGiftProgress,
} from "./currency";

// ─── Entry ────────────────────────────────────────────────────────────────────

export async function renderWidget(
  root: HTMLElement,
  config: WidgetConfig,
  settings: BlockSettings
): Promise<void> {
  injectStyles(settings.buttonColor);

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

  // Initial selection: all products selected
  const selectedIds = new Set(products.map((p) => p.id));

  // Inline widget
  if (config.displayMode === "inline" || config.displayMode === "both") {
    mountInline(root, config, products, selectedIds, settings);
  }

  // Popup mode: intercept ATC form submit
  if (config.displayMode === "popup" || config.displayMode === "both") {
    setupPopupTrigger(config, products, selectedIds, settings);
  }

  sendAnalyticsEvent(settings.appUrl, settings.shopDomain, {
    eventType: "view",
    groupId: config.groupId,
    productId: config.mainProductId,
    sessionId: getSessionId(),
  });
}

// ─── Inline Widget ────────────────────────────────────────────────────────────

function mountInline(
  root: HTMLElement,
  config: WidgetConfig,
  products: ProductItem[],
  selectedIds: Set<string>,
  settings: BlockSettings
): void {
  root.innerHTML = "";
  const inner = buildWidgetInner(config, products, selectedIds, settings, () =>
    mountInline(root, config, products, selectedIds, settings)
  );
  root.appendChild(inner);
}

// ─── Popup Widget ─────────────────────────────────────────────────────────────

function setupPopupTrigger(
  config: WidgetConfig,
  products: ProductItem[],
  selectedIds: Set<string>,
  settings: BlockSettings
): void {
  const atcForm = document.querySelector<HTMLFormElement>('form[action="/cart/add"]');
  if (!atcForm) return;

  atcForm.addEventListener(
    "submit",
    (e) => {
      // Only intercept if FBT products exist and popup not already open
      if (document.getElementById("fbt-popup-overlay")) return;
      e.preventDefault();
      e.stopPropagation();

      sendAnalyticsEvent(settings.appUrl, settings.shopDomain, {
        eventType: "popup_shown",
        groupId: config.groupId,
        productId: config.mainProductId,
        sessionId: getSessionId(),
      });

      showPopup(atcForm, config, products, selectedIds, settings);
    },
    { once: false }
  );
}

function showPopup(
  atcForm: HTMLFormElement,
  config: WidgetConfig,
  products: ProductItem[],
  selectedIds: Set<string>,
  settings: BlockSettings
): void {
  // Overlay
  const overlay = document.createElement("div");
  overlay.id = "fbt-popup-overlay";
  overlay.className = "fbt-popup-overlay";

  // Modal
  const modal = document.createElement("div");
  modal.className = "fbt-popup-modal";

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.className = "fbt-popup-close";
  closeBtn.textContent = "✕";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.addEventListener("click", () => {
    overlay.remove();
    sendAnalyticsEvent(settings.appUrl, settings.shopDomain, {
      eventType: "popup_dismissed",
      groupId: config.groupId,
      productId: config.mainProductId,
      sessionId: getSessionId(),
    });
    // Submit the original ATC form after dismissal
    atcForm.submit();
  });

  // "No thanks" link
  const noThanks = document.createElement("button");
  noThanks.className = "fbt-popup-nothanks";
  noThanks.textContent = "No thanks, just add the main item";
  noThanks.addEventListener("click", () => {
    overlay.remove();
    atcForm.submit();
  });

  const rerender = () => {
    const content = modal.querySelector(".fbt-popup-content");
    if (content) {
      content.replaceWith(
        buildWidgetInner(config, products, selectedIds, settings, rerender)
      );
    }
  };

  const content = buildWidgetInner(config, products, selectedIds, settings, rerender);
  content.classList.add("fbt-popup-content");

  modal.appendChild(closeBtn);
  modal.appendChild(content);
  modal.appendChild(noThanks);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Close on backdrop click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
      atcForm.submit();
    }
  });
}

// ─── Shared Widget Inner ──────────────────────────────────────────────────────

function buildWidgetInner(
  config: WidgetConfig,
  products: ProductItem[],
  selectedIds: Set<string>,
  settings: BlockSettings,
  rerender: () => void
): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "fbt-inner";

  // AI theme badge
  if (config.aiTheme) {
    const badge = document.createElement("div");
    badge.className = "fbt-ai-badge";
    badge.innerHTML = `🤖 <strong>AI Suggested:</strong> ${config.aiTheme}`;
    wrap.appendChild(badge);
  }

  // Title
  const title = document.createElement("h3");
  title.className = "fbt-title";
  title.textContent = settings.widgetTitle;
  wrap.appendChild(title);

  // Flexible bundle instruction
  if (config.bundleType === "flexible") {
    const instruction = document.createElement("p");
    instruction.className = "fbt-flex-instruction";
    const selected = [...selectedIds].filter((id) => id !== config.mainProductId).length;
    instruction.textContent = `Choose ${config.minSelect}–${config.maxSelect} products (${selected} selected)`;
    wrap.appendChild(instruction);
  }

  // Products row
  wrap.appendChild(
    buildProductsRow(config, products, selectedIds, settings, rerender)
  );

  // Discount nudge message
  const selected = products.filter((p) => selectedIds.has(p.id));
  const subtotalCents = calculateBundleTotal(selected.map((p) => p.price));
  const discountState = computeDiscountState(
    config.discountTiers,
    selectedIds.size,
    subtotalCents
  );

  if (discountState.nudgeMessage) {
    const nudge = document.createElement("div");
    nudge.className = "fbt-nudge";
    nudge.textContent = `🎯 ${discountState.nudgeMessage}`;
    wrap.appendChild(nudge);
  }

  // Gift progress bars
  if (config.giftRules.length > 0) {
    const giftSection = buildGiftSection(config, settings);
    if (giftSection) wrap.appendChild(giftSection);
  }

  // Footer (pricing + CTA)
  wrap.appendChild(
    buildFooter(config, products, selectedIds, settings, discountState)
  );

  return wrap;
}

// ─── Products Row ─────────────────────────────────────────────────────────────

function buildProductsRow(
  config: WidgetConfig,
  products: ProductItem[],
  selectedIds: Set<string>,
  settings: BlockSettings,
  rerender: () => void
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
      buildProductCard(config, product, products, selectedIds, settings, rerender)
    );
  });

  return row;
}

function buildProductCard(
  config: WidgetConfig,
  product: ProductItem,
  allProducts: ProductItem[],
  selectedIds: Set<string>,
  settings: BlockSettings,
  rerender: () => void
): HTMLElement {
  const isSelected = selectedIds.has(product.id);
  const card = document.createElement("div");
  card.className = `fbt-product-card${isSelected ? " fbt-selected" : ""}`;

  // Checkbox
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "fbt-checkbox";
  checkbox.checked = isSelected;
  checkbox.disabled = product.isMain; // Main product always included
  checkbox.setAttribute("aria-label", `Include ${product.title}`);

  checkbox.addEventListener("change", () => {
    if (config.bundleType === "flexible" && !product.isMain) {
      // Enforce maxSelect for flexible bundles
      const nonMainSelected = [...selectedIds].filter(
        (id) => id !== config.mainProductId
      ).length;

      if (checkbox.checked && nonMainSelected >= config.maxSelect) {
        checkbox.checked = false;
        return; // Silently block — UI shows the limit
      }
    }

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

    rerender();
  });

  card.appendChild(checkbox);

  if (product.image) {
    const img = document.createElement("img");
    img.src = product.image;
    img.alt = product.title;
    img.className = "fbt-product-image";
    img.loading = "lazy";
    card.appendChild(img);
  }

  const titleEl = document.createElement("p");
  titleEl.className = "fbt-product-title";
  titleEl.textContent = product.title;
  card.appendChild(titleEl);

  const priceEl = document.createElement("p");
  priceEl.className = "fbt-product-price";
  priceEl.textContent = formatPrice(product.price / 100, product.currencyCode);
  card.appendChild(priceEl);

  if (product.isMain) {
    const badge = document.createElement("span");
    badge.className = "fbt-main-badge";
    badge.textContent = "This item";
    card.appendChild(badge);
  }

  return card;
}

// ─── Gift Progress Section ────────────────────────────────────────────────────

function buildGiftSection(
  config: WidgetConfig,
  settings: BlockSettings
): HTMLElement | null {
  const visibleRules = config.giftRules.filter((r) => r.showProgressBar);
  if (visibleRules.length === 0) return null;

  const section = document.createElement("div");
  section.className = "fbt-gift-section";

  visibleRules.forEach((rule) => {
    // We don't have live cart data in the widget — show a static progress bar
    // that updates when the cart changes. For now, show the threshold message.
    const giftBar = document.createElement("div");
    giftBar.className = "fbt-gift-bar";
    giftBar.dataset.ruleId = String(rule.ruleId);

    const message = document.createElement("p");
    message.className = "fbt-gift-message";
    message.textContent = rule.progressMessage
      .replace(
        "{amount}",
        rule.thresholdType === "cart_value"
          ? `$${rule.thresholdValue.toFixed(2)}`
          : `${rule.thresholdValue} items`
      )
      .replace("{gift}", rule.giftTitle);

    const track = document.createElement("div");
    track.className = "fbt-gift-track";
    const fill = document.createElement("div");
    fill.className = "fbt-gift-fill";
    fill.style.width = "0%"; // Updated by cart listener
    track.appendChild(fill);

    giftBar.appendChild(message);
    giftBar.appendChild(track);
    section.appendChild(giftBar);
  });

  // Listen for cart updates to refresh gift progress
  document.addEventListener("cart:updated", () => {
    updateGiftProgress(section, config, settings);
  });

  // Initial fetch
  updateGiftProgress(section, config, settings);

  return section;
}

async function updateGiftProgress(
  section: HTMLElement,
  config: WidgetConfig,
  settings: BlockSettings
): Promise<void> {
  try {
    const res = await fetch("/cart.js");
    if (!res.ok) return;
    const cart = await res.json();
    const subtotalDollars = cart.total_price / 100;
    const itemCount = cart.item_count;

    config.giftRules.forEach((rule) => {
      const bar = section.querySelector<HTMLElement>(
        `[data-rule-id="${rule.ruleId}"]`
      );
      if (!bar) return;

      const progress = evaluateGiftProgress(
        rule.thresholdType,
        rule.thresholdValue,
        subtotalDollars,
        itemCount,
        rule.giftTitle,
        rule.progressMessage
      );

      const message = bar.querySelector(".fbt-gift-message");
      const fill = bar.querySelector<HTMLElement>(".fbt-gift-fill");

      if (message) message.textContent = progress.message;
      if (fill) fill.style.width = `${progress.progressPercent}%`;

      if (progress.isEligible) {
        bar.classList.add("fbt-gift-eligible");
        sendAnalyticsEvent(settings.appUrl, settings.shopDomain, {
          eventType: "gift_unlocked",
          groupId: config.groupId,
          sessionId: getSessionId(),
          metadata: { ruleId: rule.ruleId, giftTitle: rule.giftTitle },
        });
      }
    });
  } catch {
    // Non-fatal
  }
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function buildFooter(
  config: WidgetConfig,
  products: ProductItem[],
  selectedIds: Set<string>,
  settings: BlockSettings,
  discountState: ReturnType<typeof computeDiscountState>
): HTMLElement {
  const footer = document.createElement("div");
  footer.className = "fbt-footer";

  const selected = products.filter((p) => selectedIds.has(p.id));
  const currency = selected[0]?.currencyCode ?? "USD";

  // Price summary
  const priceWrap = document.createElement("div");
  priceWrap.className = "fbt-price-summary";

  const subtotalDollars = calculateBundleTotal(selected.map((p) => p.price)) / 100;

  if (settings.showSavings && discountState.savingsCents > 0) {
    const original = document.createElement("span");
    original.className = "fbt-price-original";
    original.textContent = formatPrice(subtotalDollars, currency);

    const discounted = document.createElement("span");
    discounted.className = "fbt-price-discounted";
    discounted.textContent = formatPrice(
      discountState.discountedTotalCents / 100,
      currency
    );

    const savings = document.createElement("span");
    savings.className = "fbt-savings";
    savings.textContent = `Save ${formatPrice(discountState.savingsCents / 100, currency)}`;

    priceWrap.appendChild(original);
    priceWrap.appendChild(discounted);
    priceWrap.appendChild(savings);
  } else {
    const total = document.createElement("span");
    total.className = "fbt-price-total";
    total.textContent = `Total: ${formatPrice(subtotalDollars, currency)}`;
    priceWrap.appendChild(total);
  }

  footer.appendChild(priceWrap);

  // Validate flexible bundle min selection
  const nonMainSelected = [...selectedIds].filter(
    (id) => id !== config.mainProductId
  ).length;
  const meetsMinSelect =
    config.bundleType !== "flexible" || nonMainSelected >= config.minSelect;

  // CTA button
  const btn = document.createElement("button");
  btn.className = "fbt-cta-btn";
  btn.textContent = settings.ctaText;
  btn.disabled = selectedIds.size === 0 || !meetsMinSelect;
  btn.style.setProperty("--fbt-btn-color", settings.buttonColor);

  if (!meetsMinSelect) {
    const hint = document.createElement("p");
    hint.className = "fbt-min-hint";
    hint.textContent = `Select at least ${config.minSelect} product${config.minSelect !== 1 ? "s" : ""} to continue`;
    footer.appendChild(hint);
  }

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
        metadata: {
          productCount: toAdd.length,
          bundleType: config.bundleType,
          discountType: discountState.activeTier?.discountType ?? "none",
        },
      });

      // Dispatch cart update event for gift progress bars
      document.dispatchEvent(new CustomEvent("cart:updated"));

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