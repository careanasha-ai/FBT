# FBT Architecture

## System Overview
```
Shopify Theme (OS 2.0)
  └── FBT Block (TAE Liquid) → fbt-widget.js (Shopify Fastly CDN)
        └── GET /api/widget → Railway app → PostgreSQL

Railway App (React Router v7)
  ├── Admin UI: /app/dashboard|products|gifts|analytics|ai|settings
  ├── API: /api/widget|analytics|gift|ai/suggest
  └── Webhooks: /webhooks/app-uninstalled|orders-paid|shop-redact

AI Pipeline
  └── Admin triggers → fetchShopProducts (Admin GraphQL, 250 products)
        → GPT-4o (json_object) → validateBundles → aiSuggestion (pending)
        → Merchant approves → FBT group created
```

## DB Schema
Shop → FbtGroup → FbtProduct, DiscountTier
Shop → GiftRule
Shop → AiSuggestion, AiCreditLedger
Shop → AnalyticsEvent, Session, ShopSettings
