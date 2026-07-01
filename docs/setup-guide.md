# FBT App — Setup Guide (Theme App Extension)

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20.x LTS | Use `nvm` recommended |
| npm | 10.x | Comes with Node 20 |
| PostgreSQL | 15+ | Local or Railway |
| Git | Latest | |
| Shopify CLI | 3.x | `npm i -g @shopify/cli` |
| Railway CLI | Latest | `npm i -g @railway/cli` |

---

## 1. Clone & Install

```bash
git clone https://github.com/careanasha-ai/FBT.git
cd FBT
npm install
```

---

## 2. Shopify Partner Setup

1. Go to [partners.shopify.com](https://partners.shopify.com) → **Apps → Create app**
2. Choose **Custom app** (for development) or **Public app** (for App Store listing)
3. Set **App URL**: `https://your-railway-domain.up.railway.app`
4. Set **Allowed redirection URLs**:
   ```
   https://your-railway-domain.up.railway.app/auth/callback
   http://localhost:3000/auth/callback
   ```
5. Note down:
   - `SHOPIFY_API_KEY`
   - `SHOPIFY_API_SECRET`

### Required Scopes
```
read_products, write_products
read_discounts, write_discounts
read_orders
```

> Note: `read_script_tags` and `write_script_tags` are **not required** — the widget
> is delivered via Theme App Extension, not ScriptTag.

---

## 3. Environment Variables

```bash
cp .env.example .env
```

**.env contents:**

```env
# App
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Shopify
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SHOPIFY_SCOPES=read_products,write_products,read_discounts,write_discounts,read_orders
SHOPIFY_APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/fbt_dev

# Session
SESSION_SECRET=a-long-random-secret-string-change-in-production
```

---

## 4. Database Setup

### Local PostgreSQL

```bash
createdb fbt_dev
npm run db:migrate:dev
npm run db:seed        # optional test data
```

### Railway PostgreSQL

1. Railway dashboard → **New Service → Database → PostgreSQL**
2. Copy `DATABASE_URL` from Railway variables into your app's environment

---

## 5. Local Development

```bash
# Start app server + Shopify CLI tunnel (recommended)
npm run shopify:dev

# Or start app server only (no tunnel)
npm run dev
```

`shopify app dev` will:
- Start a Cloudflare tunnel (e.g. `https://abc123.trycloudflare.com`)
- Update your app URL in Partner Dashboard automatically
- Serve the Theme App Extension locally for preview
- Hot-reload on changes

### Build widget JS during development

```bash
# Watch mode — rebuilds widget on every save
npm run widget:dev
```

---

## 6. Theme App Extension — Activating the Widget

After installing the app on a dev store:

1. Go to **Online Store → Themes → Customize**
2. Navigate to a **Product page** template
3. Click **Add block** in the product information section
4. Select **Frequently Bought Together**
5. Drag the block to your preferred position (below Add to Cart recommended)
6. Configure in the sidebar:
   - **Widget Title** — e.g. "Frequently Bought Together"
   - **Button Text** — e.g. "Add All to Cart"
   - **Button Color** — hex colour picker
   - **Show savings amount** — toggle
   - **Maximum FBT products to show** — 1–4
7. Click **Save**

> The widget will only render on product pages where you have configured
> an FBT group in the app admin. Products without a group show nothing.

---

## 7. Database Schema Overview

```sql
-- Stores that have installed the app
CREATE TABLE shops (
  id            SERIAL PRIMARY KEY,
  shop_domain   VARCHAR(255) UNIQUE NOT NULL,
  access_token  TEXT NOT NULL,
  scopes        TEXT,
  installed_at  TIMESTAMPTZ DEFAULT NOW(),
  uninstalled_at TIMESTAMPTZ
);

-- FBT product groups (one per main product)
CREATE TABLE fbt_groups (
  id          SERIAL PRIMARY KEY,
  shop_id     INTEGER REFERENCES shops(id) ON DELETE CASCADE,
  product_id  VARCHAR(50) NOT NULL,   -- Shopify product GID
  title       VARCHAR(255),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, product_id)
);

-- Products within each FBT group
CREATE TABLE fbt_products (
  id          SERIAL PRIMARY KEY,
  group_id    INTEGER REFERENCES fbt_groups(id) ON DELETE CASCADE,
  product_id  VARCHAR(50) NOT NULL,
  position    INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Discount rules attached to FBT groups
CREATE TABLE discount_rules (
  id             SERIAL PRIMARY KEY,
  group_id       INTEGER REFERENCES fbt_groups(id) ON DELETE CASCADE,
  discount_type  VARCHAR(20) NOT NULL,  -- 'percentage' | 'fixed' | 'none'
  discount_value DECIMAL(10,2) DEFAULT 0,
  min_items      INTEGER DEFAULT 2,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events
CREATE TABLE analytics_events (
  id          BIGSERIAL PRIMARY KEY,
  shop_id     INTEGER REFERENCES shops(id) ON DELETE CASCADE,
  group_id    INTEGER REFERENCES fbt_groups(id) ON DELETE SET NULL,
  event_type  VARCHAR(50) NOT NULL,  -- 'view' | 'click' | 'add_to_cart' | 'purchase'
  product_id  VARCHAR(50),
  session_id  VARCHAR(100),
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- OAuth sessions
CREATE TABLE sessions (
  id           VARCHAR(255) PRIMARY KEY,
  shop         VARCHAR(255) NOT NULL,
  state        VARCHAR(255),
  is_online    BOOLEAN DEFAULT FALSE,
  scope        TEXT,
  expires      TIMESTAMPTZ,
  access_token TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 8. Railway Deployment

### App Server

```bash
railway login
railway link
railway up
```

### Environment Variables on Railway

```env
NODE_ENV=production
APP_URL=https://your-app.up.railway.app
SHOPIFY_APP_URL=https://your-app.up.railway.app
DATABASE_URL=<from Railway PostgreSQL service>
SESSION_SECRET=<openssl rand -hex 32>
SHOPIFY_API_KEY=<from Partner Dashboard>
SHOPIFY_API_SECRET=<from Partner Dashboard>
SHOPIFY_SCOPES=read_products,write_products,read_discounts,write_discounts,read_orders
```

### Theme App Extension

```bash
# Build widget JS then deploy extension assets to Shopify CDN
npm run shopify:deploy
```

This pushes `extensions/fbt-widget/` to Shopify. The widget JS is then served
from Shopify's Fastly CDN — completely independent of Railway uptime.

---

## 9. GitHub Actions CI/CD

Set these GitHub Secrets:
- `RAILWAY_TOKEN` — from Railway dashboard → Account → Tokens
- `SHOPIFY_API_KEY` — from Partner Dashboard
- `SHOPIFY_API_SECRET` — from Partner Dashboard

Workflow:
- **ci.yml** — lint + typecheck + build on every PR
- **deploy.yml** — auto-deploy `main` → Railway on merge

> Note: Theme App Extension deployment (`shopify app deploy`) is a manual step
> run locally or added as a separate workflow with a `SHOPIFY_CLI_TOKEN`.

---

## 10. Development Workflow

```bash
# Feature branch
git checkout -b feature/fbt-product-picker

# Develop
npm run shopify:dev        # app + tunnel + TAE preview
npm run widget:dev         # watch widget TS in parallel

# Commit
git add . && git commit -m "feat: product picker with search"
git push origin feature/fbt-product-picker

# PR → CI checks → merge → Railway auto-deploys
# Then manually: npm run shopify:deploy (for extension updates)
```

---

## Phase 1 Checklist

- [ ] Shopify app created in Partner Dashboard
- [ ] OAuth install flow working
- [ ] Database migrations run
- [ ] FBT admin UI — create/edit/delete groups
- [ ] Product search (Shopify Admin API)
- [ ] Theme App Extension block activatable in theme editor
- [ ] Widget renders FBT products correctly
- [ ] Bundle discount rules (percentage / fixed)
- [ ] Analytics events (view, click, add_to_cart, purchase)
- [ ] Analytics dashboard in admin
- [ ] Railway deployment live
- [ ] GitHub Actions CI/CD configured
- [ ] `shopify app deploy` run — extension live on Shopify CDN