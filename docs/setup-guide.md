# FBT App — Setup Guide (Phase 1.5)

## Prerequisites
- Node.js 20.x, npm 10.x, PostgreSQL 15+
- Shopify CLI 3.x: `npm i -g @shopify/cli`
- Railway CLI: `npm i -g @railway/cli`

## 1. Install
```bash
git clone https://github.com/careanasha-ai/FBT.git && cd FBT
npm install
cp .env.example .env
```

## 2. Shopify Partner Setup
1. partners.shopify.com → Apps → Create app
2. App URL: `https://your-railway-domain.up.railway.app`
3. Redirect URL: `https://your-railway-domain.up.railway.app/auth/callback`
4. Required scopes: `read_products,write_products,read_discounts,write_discounts,read_orders`

## 3. Environment Variables
Fill in `.env`:
- `SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET` — from Partner Dashboard
- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — `openssl rand -hex 32`
- `OPENAI_API_KEY` — from platform.openai.com (for AI features)

## 4. Database
```bash
createdb fbt_dev
npm run db:migrate:dev
npm run db:seed
```

## 5. Development
```bash
npm run shopify:dev      # app server + Shopify tunnel + TAE preview
npm run widget:dev       # watch widget TS (separate terminal)
```

## 6. Activate Widget in Theme Editor
1. Online Store → Themes → Customize
2. Navigate to a Product page template
3. Add block → Frequently Bought Together
4. Configure: title, CTA text, button colour, max products
5. Save

## 7. AI Features Setup
1. Add `OPENAI_API_KEY` to `.env`
2. Set `ENABLE_AI_FEATURES=true`
3. Add credits via AI Credit Ledger (admin or direct DB insert for dev)
4. Admin → AI Suggestions → Run Analysis

## 8. Railway Deployment
```bash
railway login && railway link && railway up
npm run shopify:deploy   # deploy extension to Shopify CDN
```

## Railway Environment Variables
```
NODE_ENV=production
APP_URL=https://your-app.up.railway.app
SHOPIFY_APP_URL=https://your-app.up.railway.app
DATABASE_URL=<Railway PostgreSQL URL>
SESSION_SECRET=<openssl rand -hex 32>
SHOPIFY_API_KEY=<Partner Dashboard>
SHOPIFY_API_SECRET=<Partner Dashboard>
SHOPIFY_SCOPES=read_products,write_products,read_discounts,write_discounts,read_orders
OPENAI_API_KEY=<OpenAI key>
ENABLE_AI_FEATURES=true
```

## Phase 1.5 Checklist
- [ ] Fixed bundle with tiered discounts working
- [ ] Flexible bundle (pick N from pool) working
- [ ] Gift with purchase rule created and progress bar visible
- [ ] Popup mode tested (fires after ATC click)
- [ ] AI analysis run (requires OPENAI_API_KEY + credits)
- [ ] AI suggestion approved → FBT group created
- [ ] Railway deployed
- [ ] shopify app deploy run
