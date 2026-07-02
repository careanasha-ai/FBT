# Setup Guide

## Prerequisites
Node 20, PostgreSQL 15+, Shopify CLI 3.x (`npm i -g @shopify/cli`), Railway CLI

## Steps
1. `git clone https://github.com/careanasha-ai/FBT.git && cd FBT && npm install`
2. `cp .env.example .env` — fill in SHOPIFY_API_KEY, SHOPIFY_API_SECRET, DATABASE_URL, SESSION_SECRET, OPENAI_API_KEY
3. `createdb fbt_dev && npm run db:migrate:dev && npm run db:seed`
4. `npm run shopify:dev`

## Activate Widget
Online Store → Themes → Customize → Product page → Add block → Frequently Bought Together

## Deploy
```bash
railway login && railway link && railway up
npm run shopify:deploy
```

## Railway Env Vars
NODE_ENV=production, APP_URL, SHOPIFY_APP_URL, DATABASE_URL, SESSION_SECRET,
SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_SCOPES, OPENAI_API_KEY, ENABLE_AI_FEATURES=true
