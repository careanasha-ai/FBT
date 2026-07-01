# Frequently Bought Together — Architecture Diagram (Theme App Extension)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SHOPIFY MERCHANT STORE                             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              Product Page (Online Store 2.0 Theme)                   │   │
│  │                                                                     │   │
│  │   ┌─────────────────────────────────────────────────────────────┐  │   │
│  │   │         FBT Block (Theme App Extension — Liquid)             │  │   │
│  │   │                                                             │  │   │
│  │   │  Rendered server-side by Shopify at page request time       │  │   │
│  │   │                                                             │  │   │
│  │   │  <div id="fbt-widget-root"                                  │  │   │
│  │   │    data-shop="store.myshopify.com"                          │  │   │
│  │   │    data-product="gid://shopify/Product/123"                 │  │   │
│  │   │    data-app-url="https://app.railway.app"                   │  │   │
│  │   │    data-widget-title="Frequently Bought Together"           │  │   │
│  │   │    data-button-color="#008060"                              │  │   │
│  │   │    ...merchant theme editor settings...>                    │  │   │
│  │   │    [skeleton loader]                                        │  │   │
│  │   │  </div>                                                     │  │   │
│  │   │  <script src="fbt-widget.js" defer>                        │  │   │
│  │   │                                                             │  │   │
│  │   │  JS hydrates → fetches FBT config → renders widget         │  │   │
│  │   │                                                             │  │   │
│  │   │  [Main Product]  +  [FBT Product 1]  +  [FBT Product 2]    │  │   │
│  │   │  ☑ Product A    ☑ Product B    ☑ Product C                 │  │   │
│  │   │  $29.99         $14.99         $9.99                        │  │   │
│  │   │  Bundle Total: $49.99  (Save 10%)  [Add All to Cart]       │  │   │
│  │   └─────────────────────────────────────────────────────────────┘  │   │
│  │                                                                     │   │
│  │   Shopify Cart AJAX API (/cart/add.js) ──────────────────────────► │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Shopify Theme Editor                              │   │
│  │                                                                     │   │
│  │  Merchant drags FBT block → configures title, colour, CTA text     │   │
│  │  Block settings written to theme JSON → served by Shopify CDN      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                │                                        │
                │ OAuth Install Flow                     │ Webhooks
                │ (Admin API)                            │ (orders/paid, etc.)
                ▼                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FBT APP  (Railway — Node.js)                         │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    React Router v7  (Full-Stack)                      │  │
│  │                                                                      │  │
│  │  ┌─────────────────────────┐   ┌──────────────────────────────────┐ │  │
│  │  │     Admin UI (React)    │   │       API Routes (Server)        │ │  │
│  │  │                         │   │                                  │ │  │
│  │  │  /app/dashboard         │   │  /api/fbt          (CRUD)        │ │  │
│  │  │  /app/products          │   │  /api/analytics    (events)      │ │  │
│  │  │  /app/analytics         │   │  /api/discounts    (rules)       │ │  │
│  │  │  /app/settings          │   │  /api/widget       (config)      │ │  │
│  │  │  /app/discounts         │   │  /webhooks/orders  (paid)        │ │  │
│  │  └─────────────────────────┘   │  /auth/callback    (OAuth)       │ │  │
│  │                                └──────────────────────────────────┘ │  │
│  │                                                                      │  │
│  │  ┌──────────────────────────────────────────────────────────────┐   │  │
│  │  │                    Service Layer                              │   │  │
│  │  │                                                              │   │  │
│  │  │  ShopifyService  │  FBTService  │  DiscountService           │   │  │
│  │  │  AnalyticsService│  WidgetService│  AIService (Phase 2)      │   │  │
│  │  └──────────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         Data Layer                                   │  │
│  │                                                                      │  │
│  │   PostgreSQL (Railway)          Redis (Railway — optional cache)     │  │
│  │   ┌────────────────────┐        ┌──────────────────────────────┐    │  │
│  │   │  shops             │        │  Session cache               │    │  │
│  │   │  fbt_groups        │        │  Widget config cache         │    │  │
│  │   │  fbt_products      │        │  Analytics buffer            │    │  │
│  │   │  discount_rules    │        └──────────────────────────────┘    │  │
│  │   │  analytics_events  │                                            │  │
│  │   │  sessions          │                                            │  │
│  │   └────────────────────┘                                            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                │
                │ Shopify Admin API (GraphQL)
                │ Shopify Storefront AJAX API (/products.json, /cart/add.js)
                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SHOPIFY PLATFORM                                    │
│                                                                             │
│   Admin API          Storefront AJAX      Theme CDN        Webhook API      │
│   (products,         (/cart/add.js,       (fbt-widget.js   (order events)   │
│    discounts,        /products.json)       served by                        │
│    metafields)                             Shopify Fastly)                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    THEME APP EXTENSION (Shopify CDN)                        │
│                                                                             │
│   extensions/fbt-widget/                                                    │
│   ├── blocks/fbt-widget.liquid   ← Liquid block (rendered server-side)      │
│   ├── assets/fbt-widget.js       ← Built widget bundle (Shopify Fastly CDN) │
│   ├── locales/en.default.json    ← i18n strings for theme editor UI         │
│   └── shopify.extension.toml     ← Extension manifest                       │
│                                                                             │
│   Deployed via: shopify app deploy                                          │
│   Activated by: Merchant adds block in theme editor                         │
└─────────────────────────────────────────────────────────────────────────────┘


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAE DATA FLOW — Widget Load (vs ScriptTag)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ScriptTag (removed)                Theme App Extension (current)
  ───────────────────                ─────────────────────────────
  Page loads                         Page loads
    │                                  │
    ▼                                  ▼
  Shopify injects <script>           Shopify renders Liquid block
  from your Railway CDN                server-side (zero extra request)
    │                                  │
    ▼                                  ▼
  Script loads (network req #1)      Block HTML in page immediately
    │                                  │
    ▼                                  ▼
  JS reads ShopifyAnalytics.meta     JS reads data-* attributes
  (fragile, theme-dependent)         (reliable, set by Liquid)
    │                                  │
    ▼                                  ▼
  GET /api/widget (network req #2)   GET /api/widget (network req #1)
    │                                  │
    ▼                                  ▼
  Widget renders                     Widget renders
    │                                  │
    ▼                                  ▼
  DOM traversal to find              Renders into #fbt-widget-root
  insertion point (fragile)          (exact position set by merchant)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1 DATA FLOW — Admin FBT Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Merchant opens App in Shopify Admin
        │
        ▼
  OAuth → Session stored in PostgreSQL
        │
        ▼
  Admin UI loads /app/products
        │
        ▼
  Merchant searches & selects main product
        │
        ▼
  Merchant picks 1–4 FBT products
        │
        ▼
  Merchant sets discount rule (%, fixed, none)
        │
        ▼
  POST /api/fbt → saves fbt_group + fbt_products
        │
        ▼
  Widget live on storefront (where merchant placed the TAE block) ✓


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2 (Future) — AI Credits
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Order history + product catalog
        │
        ▼
  AI Service (OpenAI / custom model)
        │
        ▼
  Auto-suggest FBT groups (merchant approves)
        │
        ▼
  Credit deducted from merchant balance
```