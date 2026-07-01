# FBT App — Setup Guide

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
2. Choose **Custom app** (for development) or **Public app** (for listing)
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
read_script_tags, write_script_tags
read_discounts, write_discounts
read_orders
read_analytics
```

---

## 3. Environment Variables

Copy the example file and fill in values:

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
SHOPIFY_SCOPES=read_products,write_products,read_script_tags,write_script_tags,read_discounts,write_discounts,read_orders
SHOPIFY_APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/fbt_dev

# Session
SESSION_SECRET=a-long-random-secret-string-change-in-production

# Widget
WIDGET_CDN_URL=http://localhost:3000/widget

# AI (Phase 2 — leave blank for now)
OPENAI_API_KEY=
```

---

## 4. Database Setup

### Local PostgreSQL

```bash
# Create database
createdb fbt_dev

# Run migrations
npm run db:migrate

# (Optional) Seed with test data
npm run db:seed
```

### Railway PostgreSQL

1. In Railway dashboard → **New Service → Database → PostgreSQL**
2. Copy the `DATABASE_URL` from Railway variables
3. Set it in your Railway app environment variables

---

## 5. Local Development

```bash
# Start dev server (React Router v7 with HMR)
npm run dev
```

App runs at `http://localhost:3000`

### Shopify CLI Tunnel (for OAuth testing)

```bash
# In a second terminal — creates a public HTTPS tunnel
shopify app dev
```

This will:
- Start a tunnel (e.g. `https://abc123.trycloudflare.com`)
- Update your app URL in Partner Dashboard automatically
- Hot-reload on changes

---

## 6. Database Schema Overview

```sql
-- Stores that have installed the app
CREATE TABLE shops (
  id          SERIAL PRIMARY KEY,
  shop_domain VARCHAR(255) UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  scopes      TEXT,
  installed_at TIMESTAMPTZ DEFAULT NOW(),
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
  product_id  VARCHAR(50) NOT NULL,   -- Shopify product GID
  position    INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Discount rules attached to FBT groups
CREATE TABLE discount_rules (
  id            SERIAL PRIMARY KEY,
  group_id      INTEGER REFERENCES fbt_groups(id) ON DELETE CASCADE,
  discount_type VARCHAR(20) NOT NULL,  -- 'percentage' | 'fixed' | 'none'
  discount_value DECIMAL(10,2) DEFAULT 0,
  min_items     INTEGER DEFAULT 2,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
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
  id          VARCHAR(255) PRIMARY KEY,
  shop        VARCHAR(255) NOT NULL,
  state       VARCHAR(255),
  is_online   BOOLEAN DEFAULT FALSE,
  scope       TEXT,
  expires     TIMESTAMPTZ,
  access_token TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Railway Deployment

### First Deploy

```bash
# Login to Railway
railway login

# Link to your Railway project
railway link

# Deploy
railway up
```

### Environment Variables on Railway

Set all variables from `.env` in Railway dashboard under your service → **Variables**. Key production values:

```env
NODE_ENV=production
APP_URL=https://your-app.up.railway.app
SHOPIFY_APP_URL=https://your-app.up.railway.app
DATABASE_URL=<from Railway PostgreSQL service>
SESSION_SECRET=<generate with: openssl rand -hex 32>
```

### Railway Config (`railway.toml`)

```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm run build && npm run db:migrate"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
```

---

## 8. GitHub Actions CI/CD

The repo includes `.github/workflows/deploy.yml` which:
1. Runs lint + type-check on every PR
2. Auto-deploys `main` branch to Railway on merge

Set these GitHub Secrets:
- `RAILWAY_TOKEN` — from Railway dashboard → Account → Tokens

---

## 9. Widget Script Injection

The FBT widget is a self-contained JavaScript bundle served from:
```
https://your-app.up.railway.app/widget/fbt-widget.js
```

It is registered as a Shopify ScriptTag automatically on app install. The widget:
- Detects the current product page
- Fetches FBT data from `/api/widget`
- Renders the FBT UI inline
- Handles "Add All to Cart" with discount application

---

## 10. Development Workflow

```
Feature branch → PR → CI checks → Merge to main → Auto-deploy to Railway
```

```bash
# Create feature branch
git checkout -b feature/fbt-admin-ui

# Make changes, then
git add .
git commit -m "feat: add FBT product linking UI"
git push origin feature/fbt-admin-ui

# Open PR on GitHub → merge → Railway deploys automatically
```

---

## Phase 1 Checklist

- [ ] Shopify app created in Partner Dashboard
- [ ] OAuth install flow working
- [ ] Database migrations run
- [ ] FBT admin UI — create/edit/delete groups
- [ ] Product search (Shopify Admin API)
- [ ] Widget script injection on storefront
- [ ] Bundle discount rules (percentage / fixed)
- [ ] Analytics events (view, click, add_to_cart, purchase)
- [ ] Analytics dashboard in admin
- [ ] Railway deployment live
- [ ] GitHub Actions CI/CD configured