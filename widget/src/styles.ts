/**
 * Widget CSS — Phase 1.5
 * New: popup overlay, flexible bundle instruction, tiered nudge,
 *      gift progress bar, AI badge, min-select hint.
 */

const CSS = `
/* ── Base ────────────────────────────────────────────────────────────────── */

#fbt-widget-root {
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

/* ── AI badge ────────────────────────────────────────────────────────────── */

.fbt-ai-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  background: #f0f4ff;
  color: #3b5bdb;
  border: 1px solid #c5d0fa;
  padding: 3px 10px;
  border-radius: 9999px;
  margin-bottom: 12px;
}

/* ── Title ───────────────────────────────────────────────────────────────── */

.fbt-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #202223;
}

/* ── Flexible bundle instruction ─────────────────────────────────────────── */

.fbt-flex-instruction {
  font-size: 13px;
  color: #6d7175;
  margin: 0 0 12px 0;
  padding: 6px 10px;
  background: #f6f6f7;
  border-radius: 4px;
}

/* ── Products row ────────────────────────────────────────────────────────── */

.fbt-products-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.fbt-plus {
  font-size: 20px;
  font-weight: 300;
  color: #6d7175;
  align-self: center;
  padding: 0 4px;
  user-select: none;
}

/* ── Product card ────────────────────────────────────────────────────────── */

.fbt-product-card {
  position: relative;
  border: 2px solid #e1e3e5;
  border-radius: 6px;
  padding: 10px;
  width: 130px;
  transition: border-color 0.15s;
  background: #fff;
}

.fbt-product-card.fbt-selected {
  border-color: var(--fbt-btn-color, #008060);
}

.fbt-checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 16px;
  height: 16px;
  accent-color: var(--fbt-btn-color, #008060);
  cursor: pointer;
}

.fbt-product-image {
  width: 100%;
  height: 90px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 8px;
  margin-top: 4px;
  display: block;
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

/* ── Discount nudge ──────────────────────────────────────────────────────── */

.fbt-nudge {
  font-size: 12px;
  color: #008060;
  background: #f0faf6;
  border: 1px solid #aee9d1;
  border-radius: 4px;
  padding: 6px 10px;
  margin-bottom: 12px;
  font-weight: 500;
}

/* ── Gift progress bar ───────────────────────────────────────────────────── */

.fbt-gift-section {
  margin-bottom: 14px;
}

.fbt-gift-bar {
  padding: 10px 12px;
  background: #fff8f0;
  border: 1px solid #ffd79d;
  border-radius: 6px;
  margin-bottom: 8px;
}

.fbt-gift-bar.fbt-gift-eligible {
  background: #f0faf6;
  border-color: #aee9d1;
}

.fbt-gift-message {
  font-size: 12px;
  color: #4a1504;
  margin: 0 0 6px 0;
  font-weight: 500;
}

.fbt-gift-bar.fbt-gift-eligible .fbt-gift-message {
  color: #003d2b;
}

.fbt-gift-track {
  height: 6px;
  background: #ffd79d;
  border-radius: 9999px;
  overflow: hidden;
}

.fbt-gift-bar.fbt-gift-eligible .fbt-gift-track {
  background: #aee9d1;
}

.fbt-gift-fill {
  height: 100%;
  background: #e67e00;
  border-radius: 9999px;
  transition: width 0.4s ease;
}

.fbt-gift-bar.fbt-gift-eligible .fbt-gift-fill {
  background: #008060;
  width: 100% !important;
}

/* ── Footer ──────────────────────────────────────────────────────────────── */

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
  color: var(--fbt-btn-color, #008060);
}

.fbt-savings {
  font-size: 12px;
  background: #aee9d1;
  color: #003d2b;
  padding: 2px 8px;
  border-radius: 9999px;
  font-weight: 500;
}

.fbt-min-hint {
  font-size: 11px;
  color: #6d7175;
  margin: 0;
  width: 100%;
}

/* ── CTA Button ──────────────────────────────────────────────────────────── */

.fbt-cta-btn {
  padding: 10px 20px;
  background: var(--fbt-btn-color, #008060);
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s;
  white-space: nowrap;
}

.fbt-cta-btn:hover:not(:disabled) {
  filter: brightness(0.88);
}

.fbt-cta-btn:disabled {
  background: #c9cccf !important;
  cursor: not-allowed;
}

/* ── Popup overlay ───────────────────────────────────────────────────────── */

.fbt-popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: fbt-fade-in 0.2s ease;
}

@keyframes fbt-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.fbt-popup-modal {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  max-width: 560px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: fbt-slide-up 0.25s ease;
}

@keyframes fbt-slide-up {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

.fbt-popup-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #f6f6f7;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6d7175;
  transition: background 0.15s;
}

.fbt-popup-close:hover {
  background: #e1e3e5;
}

.fbt-popup-nothanks {
  display: block;
  width: 100%;
  margin-top: 12px;
  background: none;
  border: none;
  color: #6d7175;
  font-size: 13px;
  cursor: pointer;
  text-align: center;
  text-decoration: underline;
  padding: 4px;
}

.fbt-popup-nothanks:hover {
  color: #202223;
}

.fbt-popup-content .fbt-inner {
  border: none;
  padding: 0;
}

/* ── Responsive ──────────────────────────────────────────────────────────── */

@media (max-width: 480px) {
  .fbt-products-row { gap: 6px; }
  .fbt-product-card { width: 100px; }
  .fbt-product-image { height: 70px; }
  .fbt-footer { flex-direction: column; align-items: flex-start; }
  .fbt-popup-modal { padding: 16px; }
}
`;

let injected = false;

export function injectStyles(_buttonColor?: string): void {
  if (injected) return;
  const style = document.createElement("style");
  style.id = "fbt-widget-styles";
  style.textContent = CSS;
  document.head.appendChild(style);
  injected = true;
}