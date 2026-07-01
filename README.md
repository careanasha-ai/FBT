# Frequently Bought Together — Shopify App

A Shopify app that lets merchants configure "Frequently Bought Together" product bundles, gift-with-purchase rules, and AI-generated thematic bundles on their product pages.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Router v7 (SSR) |
| Language | TypeScript |
| Styling | Tailwind CSS + Shopify Polaris tokens |
| Database | PostgreSQL via Prisma ORM |
| Hosting | Railway |
| CI/CD | GitHub Actions |
| Widget | Vanilla TS → IIFE bundle → Theme App Extension |
| AI | OpenAI GPT-4o (thematic bundle analysis) |
| Shopify | Admin API (GraphQL), Theme App Extension, Webhooks |

## Features

### Phase 1 ✅
- Manual FBT product linking in admin
- Storefront widget via Theme App Extension (Online Store 2.0)
- Basic discount rules
- Analytics (views, clicks, add-to-carts, purchases)

### Phase 1.5 ✅
- **Fixed Bundles** — merchant picks exact products, customer can deselect
- **Flexible Bundles** — merchant defines a pool, customer picks N (with min/max enforcement)
- **Tiered Discounts** — discount increases as customer adds more items ("Add 1 more to save 20%!")
- **Bundle Price** — set a flat bundle price instead of a percentage
- **Gift With Purchase** — free gift auto-added when cart reaches a threshold
- **Gift Progress Bar** — live progress bar showing how close customer is to the gift
- **Post-ATC Popup** — FBT widget fires as a modal after "Add to Cart" click
- **AI Bundle Suggestions** — GPT-4o analyses your product catalog and suggests thematic bundles (e.g. "Massage Therapist Bundle")
- **AI Credit System** — credits-based pricing for AI analysis runs
- **Merchant theme editor controls** — title, CTA, button colour, max products, AI badge toggle

## Quick Start

```bash
git clone https://github.com/careanasha-ai/FBT.git && cd FBT
npm install
cp .env.example .env   # fill in keys
createdb fbt_dev
npm run db:migrate:dev
npm run db:seed
npm run shopify:dev
```

## Project Structure

```
app/
├── routes/
│   ├── app/          # Admin UI (dashboard, products, gifts, analytics, ai, settings)
│   ├── api/          # JSON API (widget, analytics, gift, ai/suggest)
│   └── webhooks/     # Shopify webhooks
├── services/         # Server logic (fbt, discount, gift, ai, widget, auth, shopify)
├── db/               # Prisma client + seed
└── utils/            # Constants, validation, helpers

extensions/fbt-widget/
├── blocks/           # Liquid block (server-rendered, sets data-* attrs)
├── assets/           # Built widget JS (Shopify Fastly CDN)
└── locales/          # Theme editor i18n

widget/src/           # Widget TypeScript source
├── index.ts          # Entry — reads data-* attrs
├── render.ts         # DOM rendering (fixed, flexible, popup, gift bar)
├── currency.ts       # Tiered discount calculation
├── cart.ts           # Shopify AJAX Cart API
└── styles.ts         # Scoped CSS

prisma/schema.prisma  # DB schema (shops, fbt_groups, discount_tiers, gift_rules, ai_suggestions)
```

## AI Bundle Suggestions

The AI feature analyses your active product catalog using GPT-4o and identifies thematic bundle opportunities based on customer use-cases:

- "Massage Therapist Bundle" → massage oil + hot stones + table cover + bolster pillow
- "Home Office Setup" → ergonomic chair + desk lamp + cable organiser + monitor stand
- "New Runner Kit" → running shoes + socks + water bottle + armband

**Cost:** 1 credit per analysis run. Merchants review and approve/reject each suggestion before it goes live.

## Deployment

```bash
# App server
railway login && railway link && railway up

# Theme App Extension (widget JS to Shopify CDN)
npm run shopify:deploy
```

## Required Scopes

```
read_products, write_products
read_discounts, write_discounts
read_orders
```

## Roadmap

- **Phase 2**: Volume discounts, post-checkout upsell (Checkout Extensions), A/B testing
- **Phase 3**: Multi-currency discount rules, advanced analytics, headless/hydrogen support