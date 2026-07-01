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
| Widget | Vanilla TS → IIFE bundle (Vite) |
| Shopify | Admin API (GraphQL), ScriptTag API, Webhooks |

## Phase 1 Features

- ✅ Manual FBT product linking in admin
- ✅ Storefront widget via ScriptTag injection
- ✅ Bundle discount rules (percentage / fixed)
- ✅ Basic analytics (views, clicks, add-to-carts, purchases)
- ✅ Analytics dashboard

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

# 5. Dev server
npm run dev
```

See [docs/setup-guide.md](docs/setup-guide.md) for full setup instructions.

## Project Structure

```
app/          # React Router v7 app (routes, services, components)
widget/       # Standalone storefront widget (Vite IIFE bundle)
prisma/       # Database schema
docs/         # Architecture, setup guide, file structure
```

See [docs/file-structure.md](docs/file-structure.md) for the full file tree.

## Architecture

See [docs/architecture.md](docs/architecture.md) for the full system diagram.

## Deployment

Hosted on Railway. Merging to `main` triggers auto-deploy via GitHub Actions.

```bash
railway login && railway link && railway up
```

## Roadmap

- **Phase 2**: AI-powered FBT suggestions (credits-based, OpenAI)
- **Phase 3**: A/B testing, advanced analytics, multi-currency discounts