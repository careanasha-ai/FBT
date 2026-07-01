/**
 * Widget CSS — injected as a <style> tag into the storefront.
 * Scoped under .fbt-widget to avoid conflicts with theme styles.
 */

const CSS = `
.fbt-widget {
  margin: 24px 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  color: #202223;
}

.fbt-inner {
  border: 1px solid #e1e3e5;
  border-radius: 8px;
  padding: 20px;
  background: #ffffff;
}

.fbt-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #202223;
}

/* Products row */
.fbt-products-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.fbt-plus {
  font-size: 20px;
  font-weight: 300;
  color: #6d7175;
  align-self: center;
  padding: 0 4px;
}

/* Product card */
.fbt-product-card {
  position: relative;
  border: 2px solid #e1e3e5;
  border-radius: 6px;
  padding: 10px;
  width: 130px;
  cursor: pointer;
  transition: border-color 0.15s;
  background: #fff;
}

.fbt-product-card.fbt-selected {
  border-color: #008060;
}

.fbt-checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 16px;
  height: 16px;
  accent-color: #008060;
  cursor: pointer;
}

.fbt-product-image {
  width: 100%;
  height: 90px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 8px;
  margin-top: 4px;
}

.fbt-product-title {
  font-size: 12px;
  font-weight: 500;
  margin: 0 0 4px 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.fbt-product-price {
  font-size: 13px;
  font-weight: 600;
  color: #202223;
  margin: 0;
}

.fbt-main-badge {
  display: inline-block;
  margin-top: 4px;
  font-size: 10px;
  background: #e4e5e7;
  color: #6d7175;
  padding: 1px 6px;
  border-radius: 9999px;
}

/* Footer */
.fbt-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid #e1e3e5;
}

.fbt-price-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.fbt-price-total {
  font-size: 15px;
  font-weight: 600;
}

.fbt-price-original {
  font-size: 14px;
  color: #6d7175;
  text-decoration: line-through;
}

.fbt-price-discounted {
  font-size: 15px;
  font-weight: 700;
  color: #008060;
}

.fbt-savings {
  font-size: 12px;
  background: #aee9d1;
  color: #003d2b;
  padding: 2px 8px;
  border-radius: 9999px;
  font-weight: 500;
}

/* CTA Button */
.fbt-cta-btn {
  padding: 10px 20px;
  background: #008060;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}

.fbt-cta-btn:hover:not(:disabled) {
  background: #004c3f;
}

.fbt-cta-btn:disabled {
  background: #c9cccf;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 480px) {
  .fbt-products-row {
    gap: 6px;
  }
  .fbt-product-card {
    width: 100px;
  }
  .fbt-product-image {
    height: 70px;
  }
}
`;

let injected = false;

export function injectStyles(): void {
  if (injected) return;
  const style = document.createElement("style");
  style.id = "fbt-widget-styles";
  style.textContent = CSS;
  document.head.appendChild(style);
  injected = true;
}