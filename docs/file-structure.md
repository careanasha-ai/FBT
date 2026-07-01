# FBT App — Full File Structure (Theme App Extension)

```
FBT/
├── .github/
│   └── workflows/
│       ├── ci.yml                        # Lint, typecheck, build on PRs
│       └── deploy.yml                    # Auto-deploy main → Railway on merge
│
├── docs/
│   ├── architecture.md                   # System architecture diagram (TAE)
│   ├── setup-guide.md                    # Full setup & deployment guide
│   ├── file-structure.md                 # This file
│   └── tae-migration-plan.md             # ScriptTag → TAE migration notes
│
├── extensions/                           # Shopify Theme App Extension
│   └── fbt-widget/
│       ├── shopify.extension.toml        # Extension manifest & config
│       ├── blocks/
│       │   └── fbt-widget.liquid         # Liquid block (rendered server-side by Shopify)
│       │                                 # Sets data-* attrs, skeleton loader, loads JS
│       ├── assets/
│       │   └── fbt-widget.js             # Built widget bundle (output of widget:build)
│       │                                 # Served by Shopify Fastly CDN
│       └── locales/
│           └── en.default.json           # i18n strings for theme editor UI labels
│
├── widget/                               # Widget TypeScript source
│   ├── src/
│   │   ├── index.ts                      # Entry point — reads data-* attrs, orchestrates init
│   │   ├── api.ts                        # Fetch FBT config + product data + send analytics
│   │   ├── render.ts                     # DOM rendering (products row, footer, CTA)
│   │   ├── cart.ts                       # Shopify AJAX Cart API (/cart/add.js)
│   │   ├── currency.ts                   # Price formatting + discount calculation
│   │   ├── styles.ts                     # Scoped CSS injected as <style> tag
│   │   ├── types.ts                      # WidgetConfig, BlockSettings, ProductItem
│   │   └── utils.ts                      # getSessionId, clamp, debounce
│   └── vite.config.ts                    # Builds IIFE → extensions/fbt-widget/assets/
│
├── app/                                  # React Router v7 app root
│   │
│   ├── root.tsx                          # Root layout (html, head, body)
│   ├── entry.client.tsx                  # Client-side hydration entry
│   ├── entry.server.tsx                  # Server-side rendering entry
│   │
│   ├── routes/                           # File-based routing (React Router v7)
│   │   │
│   │   ├── _index.tsx                    # GET /  → redirect to /app or install
│   │   │
│   │   ├── auth/
│   │   │   ├── login.tsx                 # GET  /auth/login  → OAuth start
│   │   │   └── callback.tsx              # GET  /auth/callback → OAuth finish
│   │   │                                 # (no ScriptTag registration)
│   │   │
│   │   ├── app/                          # Authenticated admin UI (embedded)
│   │   │   ├── _layout.tsx               # Shared admin shell (sidebar nav)
│   │   │   ├── dashboard.tsx             # GET  /app/dashboard → overview stats
│   │   │   ├── products/
│   │   │   │   ├── _index.tsx            # GET  /app/products → list FBT groups
│   │   │   │   ├── new.tsx               # GET  /app/products/new → create group
│   │   │   │   └── $groupId.tsx          # GET  /app/products/:id → edit group + discount
│   │   │   ├── analytics/
│   │   │   │   └── _index.tsx            # GET  /app/analytics → charts & top groups
│   │   │   └── settings/
│   │   │       └── _index.tsx            # GET  /app/settings → TAE setup guide
│   │   │                                 # (no "Reinstall Script" — TAE handles delivery)
│   │   │
│   │   ├── api/                          # JSON API routes (server-only)
│   │   │   ├── widget.tsx                # GET  /api/widget?shop=&product= (public)
│   │   │   │                             # Called by widget JS after block renders
│   │   │   └── analytics.tsx             # POST /api/analytics (public, CORS open)
│   │   │
│   │   ├── webhooks/
│   │   │   ├── app-uninstalled.tsx       # POST /webhooks/app-uninstalled
│   │   │   │                             # (no ScriptTag removal needed)
│   │   │   ├── orders-paid.tsx           # POST /webhooks/orders-paid
│   │   │   └── shop-redact.tsx           # POST /webhooks/shop-redact (GDPR)
│   │   │
│   │   └── health.tsx                    # GET /health → Railway healthcheck
│   │
│   ├── services/                         # Server-side business logic
│   │   ├── shopify.server.ts             # Shopify API client + product search
│   │   │                                 # (ScriptTag functions removed)
│   │   ├── auth.server.ts                # OAuth helpers, session management
│   │   ├── fbt.server.ts                 # FBT group CRUD operations
│   │   ├── discount.server.ts            # Discount rule logic
│   │   ├── analytics.server.ts           # Event recording & aggregation
│   │   ├── widget.server.ts              # Widget config builder
│   │   └── webhook.server.ts             # Webhook verification & handlers
│   │
│   ├── db/
│   │   ├── client.ts                     # Prisma client singleton (HMR-safe)
│   │   └── seed.ts                       # Dev seed data
│   │
│   ├── utils/
│   │   ├── constants.ts                  # App-wide constants (no ScriptTag constants)
│   │   ├── shopify.ts                    # GID helpers, GraphQL query builders
│   │   ├── currency.ts                   # Price formatting
│   │   ├── date.ts                       # Date formatting + range helpers
│   │   └── validation.ts                 # Zod schemas for forms & API
│   │
│   └── styles/
│       └── app.css                       # Global styles (Tailwind base)
│
├── prisma/
│   └── schema.prisma                     # Prisma schema (6 models)
│
├── .env.example                          # Environment variable template
├── .env                                  # Local secrets (gitignored)
├── .gitignore
├── .eslintrc.cjs
├── .prettierrc
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── vite.config.ts                        # React Router v7 / Vite config
├── react-router.config.ts                # React Router v7 SSR config
├── railway.toml                          # Railway deployment config
├── package.json                          # Scripts incl. shopify:dev, shopify:deploy
└── README.md
```

---

## Key Architectural Decisions

### Theme App Extension vs ScriptTag
| Concern | ScriptTag (removed) | Theme App Extension (current) |
|---------|--------------------|-----------------------------|
| Widget delivery | Railway CDN | Shopify Fastly CDN |
| Product context | `ShopifyAnalytics.meta` (fragile) | `data-product` attr from Liquid (reliable) |
| Placement | DOM traversal hacks | Merchant drags block in theme editor |
| App Store | Blocks BfS badge | BfS badge eligible |
| Scopes needed | `read/write_script_tags` | None (removed) |

### Widget Build Pipeline
```
widget/src/*.ts
      │
      ▼ vite build (widget/vite.config.ts)
      │
      ▼ IIFE bundle
      │
extensions/fbt-widget/assets/fbt-widget.js
      │
      ▼ shopify app deploy
      │
Shopify Fastly CDN (global edge)
```

### React Router v7 Route Conventions
- `_layout.tsx` — nested layout wrapper (no URL segment)
- `_index.tsx` — index route for a folder
- `$param.tsx` — dynamic segment
- Routes in `api/` export only `loader`/`action` — pure API endpoints, no UI component

### Server vs Client Boundary
| Suffix | Runs on | Notes |
|--------|---------|-------|
| `*.server.ts` | Server only | Never bundled to client |
| `*.client.ts` | Client only | Never runs on server |
| `*.ts / *.tsx` | Both | Use `typeof window` guards if needed |

### Session Storage
OAuth sessions stored in PostgreSQL (not memory) — required for Railway's
stateless deployment model where multiple instances may run.