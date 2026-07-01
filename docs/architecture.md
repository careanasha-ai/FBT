# FBT App — Architecture (Phase 1.5)

See the inline diagrams below for the full system layout.

## Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    SHOPIFY MERCHANT STORE                        │
│                                                                 │
│  Product Page (OS 2.0 Theme)                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  FBT Block (Theme App Extension — Liquid)                │   │
│  │  data-shop, data-product, data-app-url, data-*settings  │   │
│  │  [skeleton] → fbt-widget.js hydrates                    │   │
│  │                                                         │   │
│  │  Fixed Bundle:    [A] + [B] + [C]  → tiered discount    │   │
│  │  Flexible Bundle: [A] + pick 2 of [B,C,D,E]            │   │
│  │  Popup Mode:      fires after ATC click                 │   │
│  │  Gift Bar:        "Add $15 more for a free Travel Pouch"│   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Theme Editor: merchant configures block settings              │
└─────────────────────────────────────────────────────────────────┘
                │ OAuth + Admin API          │ Webhooks
                ▼                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FBT APP (Railway — Node.js)                     │
│                                                                 │
│  React Router v7                                                │
│  ┌──────────────────────┐  ┌──────────────────────────────┐    │
│  │  Admin UI            │  │  API Routes                  │    │
│  │  /app/dashboard      │  │  GET  /api/widget            │    │
│  │  /app/products       │  │  POST /api/analytics         │    │
│  │  /app/gifts          │  │  POST /api/gift              │    │
│  │  /app/analytics      │  │  GET|POST /api/ai/suggest    │    │
│  │  /app/ai             │  │  POST /webhooks/*            │    │
│  │  /app/settings       │  │  GET  /health                │    │
│  └──────────────────────┘  └──────────────────────────────┘    │
│                                                                 │
│  Services                                                       │
│  shopify │ auth │ fbt │ discount │ gift │ ai │ widget │ webhook │
│                                                                 │
│  PostgreSQL (Railway)                                           │
│  shops │ fbt_groups │ fbt_products │ discount_tiers            │
│  gift_rules │ shop_settings │ ai_suggestions                   │
│  ai_credit_ledger │ analytics_events │ sessions                │
└─────────────────────────────────────────────────────────────────┘
                │ GPT-4o API
                ▼
┌─────────────────────────────────────────────────────────────────┐
│  OpenAI                                                         │
│  Product catalog → thematic bundle suggestions                  │
│  "Massage Therapist Bundle", "Home Office Setup", etc.          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Theme App Extension (Shopify Fastly CDN)                       │
│  extensions/fbt-widget/                                         │
│  ├── blocks/fbt-widget.liquid   (server-rendered Liquid block)  │
│  ├── assets/fbt-widget.js       (built IIFE widget bundle)      │
│  └── locales/en.default.json    (theme editor i18n)             │
└─────────────────────────────────────────────────────────────────┘
```

## AI Bundle Analysis Flow

```
Merchant clicks "Run Analysis" (costs 1 credit)
  │
  ▼
fetchShopProducts() — Admin GraphQL API, up to 250 active products
  │
  ▼
buildAnalysisPrompt() — compact catalog JSON + merchandising instructions
  │
  ▼
OpenAI GPT-4o (json_object response format)
  │
  ▼
validateBundles() — filter invalid GIDs, enforce min 2 products
  │
  ▼
prisma.aiSuggestion.create() × N — saved as "pending"
  │
  ▼
debitAiCredits() — 1 credit debited from ledger
  │
  ▼
Admin UI shows suggestions with theme + rationale + product IDs
  │
  ├── Merchant approves → createFbtGroupFromAiSuggestion()
  │                        → FBT group created, suggestion marked "approved"
  └── Merchant rejects  → suggestion marked "rejected"
```

## Discount Tier Resolution

```
Customer selects items → selectedCount
  │
  ▼
resolveActiveTier(tiers, selectedCount)
  → highest tier where minItems ≤ selectedCount
  │
  ▼
applyTier(subtotalCents, activeTier)
  → percentage: savings = subtotal × (value/100)
  → fixed:      savings = min(value×100, subtotal)
  → price:      discountedTotal = value×100 (flat bundle price)
  │
  ▼
resolveNextTier(tiers, selectedCount)
  → lowest tier where minItems > selectedCount
  │
  ▼
buildNudgeMessage(nextTier, selectedCount)
  → "Add 1 more item to save 20%!"
```
