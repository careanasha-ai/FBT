# Frequently Bought Together — Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SHOPIFY MERCHANT STORE                             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Product Page (Storefront)                        │   │
│  │                                                                     │   │
│  │   ┌─────────────────────────────────────────────────────────────┐  │   │
│  │   │              FBT Widget (Script Tag Injection)               │  │   │
│  │   │                                                             │  │   │
│  │   │  [Main Product]  +  [FBT Product 1]  +  [FBT Product 2]    │  │   │
│  │   │                                                             │  │   │
│  │   │  ☑ Product A    ☑ Product B    ☑ Product C                 │  │   │
│  │   │  $29.99         $14.99         $9.99                        │  │   │
│  │   │                                                             │  │   │
│  │   │  Bundle Total: $49.99  (Save 10%)  [Add All to Cart]       │  │   │
│  │   └─────────────────────────────────────────────────────────────┘  │   │
│  │                                                                     │   │
│  │   Shopify ScriptTag API ──────────────────────────────────────────► │   │
│  │   Shopify Cart API (bundle discount via cart attributes)            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                             │
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
│  │  │  /app/settings          │   │  /api/widget       (script)      │ │  │
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
                │ Shopify Storefront API
                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SHOPIFY PLATFORM                                    │
│                                                                             │
│   Admin API          Storefront API       ScriptTag API    Webhook API      │
│   (products,         (cart, checkout)     (JS injection)   (order events)   │
│    discounts,                                                               │
│    metafields)                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1 DATA FLOW — FBT Widget Load
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Shopper visits product page
        │
        ▼
  ScriptTag loads fbt-widget.js from Railway CDN
        │
        ▼
  Widget calls GET /api/widget?shop=xxx&product=yyy
        │
        ▼
  Server queries PostgreSQL for FBT group
        │
        ├── Found → returns product IDs + discount rule
        │               │
        │               ▼
        │           Widget renders FBT UI
        │               │
        │               ▼
        │           Shopper clicks "Add All to Cart"
        │               │
        │               ▼
        │           POST /api/analytics (event: add_to_cart)
        │               │
        │               ▼
        │           Shopify Cart API adds items + discount code
        │
        └── Not found → Widget hidden (no render)


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
  Shopify ScriptTag registered (if first time)
        │
        ▼
  Widget live on storefront ✓


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