# Frequently Bought Together — Shopify App

A Shopify app that lets merchants configure "Frequently Bought Together" product bundles on their product pages, with bundle discounts and analytics.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Router v7 (Remix-based, SSR) |
| Language | TypeScript |
| Styling | Tailwind CSS + Shopify Polaris tokens |
| Database | PostgreSQL via Prisma ORM |
| Hosting | Railway |
| CI/CD | GitHub Actions |
| Widget | Vanilla TS → IIFE bundle (Vite) → Theme App Extension |
| Shopify | Admin API (GraphQL), Theme App Extension, Webhooks |

## Phase 1 Features

- ✅ Manual FBT product linking in admin
- ✅ Storefront widget via Theme App Extension (Online Store 2.0)
- ✅ Merchant-configurable widget (title, CTA, button colour) in theme editor
- ✅ Bundle discount rules (percentage / fixed)
- ✅ Basic analytics (views, clicks, add-to-carts, purchases)
- ✅ Analytics dashboard
- ✅ Built for Shopify badge eligible (no ScriptTag)

## Quick Start

```bash
# 1. Clone
git clone https://github.com/careanasha-ai/FBT.git && cd FBT

# 2. Install
npm install

# 3. Configure
cp .env.example .env
# Fill in SHOPIFY_API_KEY, SHOPIFY_API_SECRET, DATABASE_URL, SESSION_SECRET

# 4. Database
createdb fbt_dev
npm run db:migrate:dev
npm run db:seed

# 5. Dev server + Shopify tunnel
npm run shopify:dev
```

See [docs/setup-guide.md](docs/setup-guide.md) for full setup instructions.

## Project Structure

```
app/                  # React Router v7 app (routes, services, components)
extensions/
└── fbt-widget/
    ├── blocks/       # Liquid block template (rendered by Shopify)
    ├── assets/       # Built widget JS (served by Shopify CDN)
    ├── locales/      # Theme editor i18n strings
    └── shopify.extension.toml
widget/               # Widget TypeScript source → compiled to extensions/fbt-widget/assets/
prisma/               # Database schema
docs/                 # Architecture, setup guide, file structure
```

See [docs/file-structure.md](docs/file-structure.md) for the full annotated file tree.

## Widget Delivery — Theme App Extension

The FBT widget is delivered as a **Theme App Extension** (not a ScriptTag).

- Widget JS is built to `extensions/fbt-widget/assets/fbt-widget.js`
- Shopify serves it from their Fastly CDN — no Railway cold starts on widget load
- Merchants activate the block in **Online Store → Themes → Customize → Product page → Add block**
- Block settings (title, CTA text, button colour, max products) are configurable directly in the theme editor
- Eligible for the **Built for Shopify** badge

## Deployment

### App Server (Railway)
```bash
railway login && railway link && railway up
```
Merging to `main` triggers auto-deploy via GitHub Actions.

### Theme App Extension (Shopify CDN)
```bash
# Build widget JS + deploy extension to Shopify
npm run shopify:deploy
```

## Architecture

See [docs/architecture.md](docs/architecture.md) for the full system diagram including the TAE vs ScriptTag data flow comparison.

## Scopes Required

```
read_products, write_products
read_discounts, write_discounts
read_orders
```

> ScriptTag scopes (`read_script_tags`, `write_script_tags`) removed — no longer needed.

## Roadmap

- **Phase 2**: AI-powered FBT suggestions (credits-based, OpenAI)
- **Phase 3**: A/B testing, advanced analytics, multi-currency discounts