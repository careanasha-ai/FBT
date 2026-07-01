# TAE Migration Plan (ScriptTag → Theme App Extension)

## Completed in commit dba328c

### Removed
- ScriptTag registration from OAuth callback
- ensureScriptTag / removeScriptTag from shopify.server.ts
- read_script_tags / write_script_tags scopes
- "Reinstall Widget Script" button from settings page
- findInsertionPoint / findAddToCartForm DOM hacks from widget
- ShopifyAnalytics.meta dependency for product ID detection
- Build-time __APP_URL__ constant in widget

### Added
- extensions/fbt-widget/ directory (TAE)
- blocks/fbt-widget.liquid — server-rendered Liquid block
- assets/fbt-widget.js — widget JS served from Shopify Fastly CDN
- locales/en.default.json — theme editor i18n
- shopify.extension.toml — extension manifest
- shopify:dev / shopify:deploy npm scripts

### Key behavioural changes
- Widget reads shop + productId from data-* attributes (set by Liquid)
- Widget renders into #fbt-widget-root (placed by merchant in theme editor)
- appUrl is a runtime param from data-app-url (no rebuild needed per env)
- Button colour driven by CSS custom property --fbt-btn-color
- Merchant controls placement, title, CTA, colour in theme editor
- Built for Shopify badge eligible
