# Frequently Bought Together — Shopify App

Shopify app for configuring FBT product bundles, gift-with-purchase rules, and AI-generated thematic bundles.

## Tech Stack
React Router v7 · TypeScript · PostgreSQL/Prisma · Railway · Theme App Extension · OpenAI GPT-4o

## Features
- Fixed, Flexible, Volume bundles
- Tiered discounts (escalating as customer adds more items)
- Bundle price (flat price override)
- Gift With Purchase + progress bar
- Post-ATC popup mode
- AI thematic bundle suggestions (GPT-4o analyses product catalog)
- AI credit system

## Quick Start
```bash
git clone https://github.com/careanasha-ai/FBT.git && cd FBT
npm install && cp .env.example .env
createdb fbt_dev && npm run db:migrate:dev && npm run db:seed
npm run shopify:dev
```

## Deployment
```bash
railway up                 # app server
npm run shopify:deploy     # widget JS to Shopify CDN
```

## Required Scopes
`read_products, write_products, read_discounts, write_discounts, read_orders`
