# FBT App — Full File Structure

```
FBT/
├── .github/
│   └── workflows/
│       ├── ci.yml                        # Lint, typecheck, test on PRs
│       └── deploy.yml                    # Auto-deploy main → Railway
│
├── docs/
│   ├── architecture.md                   # System architecture diagram
│   ├── setup-guide.md                    # This setup guide
│   └── file-structure.md                 # This file
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
│   │   │
│   │   ├── app/                          # Authenticated admin UI (embedded)
│   │   │   ├── _layout.tsx               # Shared admin shell (AppBridge, nav)
│   │   │   ├── dashboard.tsx             # GET  /app/dashboard → overview stats
│   │   │   ├── products/
│   │   │   │   ├── _index.tsx            # GET  /app/products → list FBT groups
│   │   │   │   ├── new.tsx               # GET  /app/products/new → create group
│   │   │   │   └── $groupId.tsx          # GET  /app/products/:id → edit group
│   │   │   ├── discounts/
│   │   │   │   ├── _index.tsx            # GET  /app/discounts → list rules
│   │   │   │   └── $ruleId.tsx           # GET  /app/discounts/:id → edit rule
│   │   │   ├── analytics/
│   │   │   │   └── _index.tsx            # GET  /app/analytics → charts & tables
│   │   │   └── settings/
│   │   │       └── _index.tsx            # GET  /app/settings → widget config
│   │   │
│   │   ├── api/                          # JSON API routes (server-only loaders/actions)
│   │   │   ├── fbt/
│   │   │   │   ├── _index.tsx            # GET/POST  /api/fbt
│   │   │   │   └── $groupId.tsx          # GET/PUT/DELETE /api/fbt/:groupId
│   │   │   ├── analytics.tsx             # POST /api/analytics (event ingestion)
│   │   │   ├── discounts/
│   │   │   │   ├── _index.tsx            # GET/POST  /api/discounts
│   │   │   │   └── $ruleId.tsx           # GET/PUT/DELETE /api/discounts/:ruleId
│   │   │   └── widget.tsx                # GET /api/widget?shop=&product= (public)
│   │   │
│   │   ├── webhooks/
│   │   │   ├── orders-paid.tsx           # POST /webhooks/orders-paid
│   │   │   ├── app-uninstalled.tsx       # POST /webhooks/app-uninstalled
│   │   │   └── shop-redact.tsx           # POST /webhooks/shop-redact (GDPR)
│   │   │
│   │   └── health.tsx                    # GET /health → Railway healthcheck
│   │
│   ├── components/                       # Shared React components
│   │   ├── ui/                           # Generic UI primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── EmptyState.tsx
│   │   │
│   │   ├── fbt/                          # FBT-specific admin components
│   │   │   ├── FBTGroupCard.tsx          # Card showing one FBT group
│   │   │   ├── FBTGroupForm.tsx          # Create/edit FBT group form
│   │   │   ├── ProductPicker.tsx         # Shopify product search + select
│   │   │   ├── ProductCard.tsx           # Single product preview card
│   │   │   └── FBTPreview.tsx            # Live preview of widget in admin
│   │   │
│   │   ├── discounts/
│   │   │   ├── DiscountRuleForm.tsx      # Create/edit discount rule
│   │   │   └── DiscountBadge.tsx         # Visual discount indicator
│   │   │
│   │   ├── analytics/
│   │   │   ├── StatsCard.tsx             # Single metric card (views, clicks…)
│   │   │   ├── ConversionChart.tsx       # Line/bar chart (recharts)
│   │   │   └── TopGroupsTable.tsx        # Best-performing FBT groups
│   │   │
│   │   └── layout/
│   │       ├── AppShell.tsx              # Sidebar + topbar wrapper
│   │       ├── NavMenu.tsx               # Sidebar navigation links
│   │       └── PageHeader.tsx            # Page title + action buttons
│   │
│   ├── services/                         # Server-side business logic
│   │   ├── shopify.server.ts             # Shopify API client (Admin + Storefront)
│   │   ├── auth.server.ts                # OAuth helpers, session management
│   │   ├── fbt.server.ts                 # FBT group CRUD operations
│   │   ├── discount.server.ts            # Discount rule logic
│   │   ├── analytics.server.ts           # Event recording & aggregation
│   │   ├── widget.server.ts              # Widget config builder
│   │   └── webhook.server.ts             # Webhook verification & handlers
│   │
│   ├── db/                               # Database layer
│   │   ├── client.ts                     # Prisma client singleton
│   │   ├── schema.prisma                 # Prisma schema (all models)
│   │   ├── migrations/                   # Auto-generated Prisma migrations
│   │   │   └── 20240101000000_init/
│   │   │       └── migration.sql
│   │   └── seed.ts                       # Dev seed data
│   │
│   ├── hooks/                            # Custom React hooks (client)
│   │   ├── useShopify.ts                 # AppBridge context hook
│   │   ├── useFBTGroups.ts               # FBT group list + mutations
│   │   └── useAnalytics.ts               # Analytics data fetching
│   │
│   ├── utils/                            # Shared utilities
│   │   ├── shopify.ts                    # GID helpers, API formatters
│   │   ├── currency.ts                   # Price formatting
│   │   ├── date.ts                       # Date formatting helpers
│   │   ├── validation.ts                 # Zod schemas for forms/API
│   │   └── constants.ts                  # App-wide constants
│   │
│   └── styles/
│       └── app.css                       # Global styles (Tailwind base)
│
├── public/                               # Static assets (served as-is)
│   ├── favicon.ico
│   └── images/
│       └── logo.svg
│
├── widget/                               # Storefront widget (standalone bundle)
│   ├── src/
│   │   ├── index.ts                      # Widget entry point
│   │   ├── api.ts                        # Fetch FBT data from /api/widget
│   │   ├── render.ts                     # DOM rendering logic
│   │   ├── cart.ts                       # Shopify AJAX Cart API integration
│   │   ├── discount.ts                   # Apply discount code to cart
│   │   ├── analytics.ts                  # Fire analytics events
│   │   └── styles.ts                     # Injected CSS (inline)
│   ├── dist/
│   │   └── fbt-widget.js                 # Built widget bundle (served publicly)
│   └── vite.config.ts                    # Vite config for widget build
│
├── prisma/                               # Prisma root (symlinked from app/db)
│   └── schema.prisma
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
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
├── react-router.config.ts                # React Router v7 config
├── railway.toml                          # Railway deployment config
├── package.json
└── README.md
```

---

## Key Architectural Decisions

### React Router v7 Route Conventions
- `_layout.tsx` files create nested layout wrappers (no URL segment)
- `_index.tsx` is the index route for a folder
- `$param.tsx` creates dynamic segments
- Routes in `api/` export only `loader` / `action` (no default component) — they act as pure API endpoints

### Server vs Client Boundary
| File suffix | Runs on | Notes |
|-------------|---------|-------|
| `*.server.ts` | Server only | Never bundled to client |
| `*.client.ts` | Client only | Never runs on server |
| `*.ts / *.tsx` | Both | Use `typeof window` guards if needed |

### Widget Build (Separate Vite Bundle)
The storefront widget is built independently via `widget/vite.config.ts` into a single `fbt-widget.js` file. This keeps the widget tiny (~15KB gzipped) and independent of the React Router app bundle.

### Database ORM
Prisma is used for type-safe database access. The schema lives in `app/db/schema.prisma` and migrations are committed to version control.

### Shopify API Client
`@shopify/shopify-api` handles OAuth, session storage, and GraphQL requests. Sessions are stored in PostgreSQL (not memory) for Railway's stateless deployment model.