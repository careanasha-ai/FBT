# TAE Migration Plan

## Files REMOVED
- app/services/shopify.server.ts → remove ensureScriptTag, removeScriptTag
- app/routes/auth/callback.tsx → remove ensureScriptTag call
- app/routes/app/settings/_index.tsx → remove "Reinstall Widget Script" section
- widget/vite.config.ts → replace with extensions build config
- widget/src/utils.ts → remove findInsertionPoint, findAddToCartForm (no longer needed)
- widget/src/index.ts → rewrite entry (reads from DOM data attrs, no DOM traversal)

## Files ADDED
- extensions/fbt-widget/shopify.extension.toml
- extensions/fbt-widget/blocks/fbt-widget.liquid
- extensions/fbt-widget/assets/fbt-widget.js (built output — gitignored in dev, built on deploy)
- extensions/fbt-widget/locales/en.default.json

## Files UNCHANGED
- All prisma/ files
- All app/services/ except shopify.server.ts
- All app/routes/ except auth/callback.tsx, app/settings/_index.tsx
- All app/utils/
- All app/db/
- widget/src/api.ts, cart.ts, currency.ts, render.ts, styles.ts, types.ts

## Key behavioural changes
- ScriptTag registration removed from OAuth callback
- Widget JS reads shop + productId from data attributes on the block div
- Widget JS reads settings (title, CTA, button colour) from data attributes
- No more /api/widget?shop=&product= cold-start on every page load
  (data attrs pre-populated by Liquid at render time — still calls /api/widget for FBT product list)
- shopify.extension.toml declares the extension, targets product pages
- Merchant places block in theme editor — no auto-injection