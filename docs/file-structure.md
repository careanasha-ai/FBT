# FBT App — File Structure (Phase 1.5)

```
FBT/
├── .github/workflows/
│   ├── ci.yml                          # Lint + typecheck + build on PRs
│   └── deploy.yml                      # Auto-deploy main → Railway
│
├── docs/
│   ├── architecture.md                 # System diagram + AI flow
│   ├── setup-guide.md                  # Setup + deployment guide
│   ├── file-structure.md               # This file
│   └── tae-migration-plan.md           # ScriptTag → TAE migration notes
│
├── extensions/fbt-widget/              # Theme App Extension
│   ├── shopify.extension.toml          # Extension manifest
│   ├── blocks/fbt-widget.liquid        # Liquid block (server-rendered)
│   ├── assets/fbt-widget.js            # Built widget (Shopify Fastly CDN)
│   └── locales/en.default.json         # Theme editor i18n
│
├── widget/src/                         # Widget TypeScript source
│   ├── index.ts                        # Entry — reads data-* attrs, orchestrates init
│   ├── api.ts                          # fetchWidgetConfig, fetchProductData, sendAnalyticsEvent
│   ├── render.ts                       # Full DOM rendering:
│   │                                   #   fixed/flexible bundles, popup mode,
│   │                                   #   tiered discount nudge, gift progress bar
│   ├── cart.ts                         # Shopify AJAX Cart API (/cart/add.js)
│   ├── currency.ts                     # Tiered discount resolution + gift progress
│   ├── styles.ts                       # Scoped CSS (popup, gift bar, AI badge, nudge)
│   ├── types.ts                        # WidgetConfig, BlockSettings, ProductItem,
│   │                                   #   DiscountTierConfig, GiftRuleConfig, GiftState
│   └── utils.ts                        # getSessionId, clamp, debounce
│
├── app/
│   ├── root.tsx                        # Root layout
│   ├── entry.client.tsx                # Client hydration
│   ├── entry.server.tsx                # SSR entry
│   │
│   ├── routes/
│   │   ├── _index.tsx                  # / → redirect
│   │   ├── auth/login.tsx              # OAuth start
│   │   ├── auth/callback.tsx           # OAuth finish (no ScriptTag)
│   │   ├── health.tsx                  # /health → Railway healthcheck
│   │   │
│   │   ├── app/
│   │   │   ├── _layout.tsx             # Sidebar nav (Dashboard, FBT Groups,
│   │   │   │                           #   Gift With Purchase, Analytics,
│   │   │   │                           #   AI Suggestions, Settings)
│   │   │   ├── dashboard.tsx           # Overview stats
│   │   │   ├── products/_index.tsx     # FBT group list
│   │   │   ├── products/new.tsx        # Create group (5-step form:
│   │   │   │                           #   product, bundle type, FBT products,
│   │   │   │                           #   discount tiers, display mode)
│   │   │   ├── products/$groupId.tsx   # Edit group + discount tiers
│   │   │   ├── gifts/_index.tsx        # Gift With Purchase CRUD
│   │   │   ├── analytics/_index.tsx    # Charts + top groups
│   │   │   ├── ai/_index.tsx           # AI suggestions (run analysis,
│   │   │   │                           #   review pending, approve/reject)
│   │   │   └── settings/_index.tsx     # TAE setup guide + shop info
│   │   │
│   │   ├── api/
│   │   │   ├── widget.tsx              # GET /api/widget (public, CORS)
│   │   │   ├── analytics.tsx           # POST /api/analytics (public, CORS)
│   │   │   ├── gift.tsx                # GET|POST /api/gift
│   │   │   └── ai/suggest.tsx          # GET|POST /api/ai/suggest
│   │   │
│   │   └── webhooks/
│   │       ├── app-uninstalled.tsx     # Cleanup on uninstall
│   │       ├── orders-paid.tsx         # Purchase analytics
│   │       └── shop-redact.tsx         # GDPR data deletion
│   │
│   ├── services/
│   │   ├── shopify.server.ts           # Shopify API client + product search
│   │   ├── auth.server.ts              # OAuth, session storage (DB-backed)
│   │   ├── fbt.server.ts               # FBT group CRUD + AI group creation
│   │   ├── discount.server.ts          # Tier resolution, nudge messages
│   │   ├── gift.server.ts              # Gift rule CRUD + eligibility evaluation
│   │   ├── ai.server.ts                # Credit management, catalog fetch,
│   │   │                               #   OpenAI call, suggestion persistence
│   │   ├── widget.server.ts            # Widget config builder (groups + gift rules)
│   │   ├── analytics.server.ts         # Event recording + aggregation
│   │   └── webhook.server.ts           # HMAC verification + handlers
│   │
│   ├── db/
│   │   ├── client.ts                   # Prisma singleton (HMR-safe)
│   │   └── seed.ts                     # Dev seed (fixed, flexible, AI bundles,
│   │                                   #   gift rule, AI suggestion, credit ledger)
│   │
│   ├── utils/
│   │   ├── constants.ts                # Bundle types, discount types, AI config
│   │   ├── validation.ts               # Zod schemas (FbtGroup, DiscountTier,
│   │   │                               #   GiftRule, ShopSettings, AiSuggestionReview)
│   │   ├── shopify.ts                  # GID helpers, GraphQL fragments
│   │   ├── currency.ts                 # Server-side price formatting
│   │   └── date.ts                     # Date ranges for analytics
│   │
│   └── styles/app.css                  # Tailwind base + admin UI styles
│
├── prisma/schema.prisma                # DB schema:
│                                       #   Shop, ShopSettings, FbtGroup, FbtProduct,
│                                       #   DiscountTier, GiftRule, AiSuggestion,
│                                       #   AiCreditLedger, AnalyticsEvent, Session
│
├── .env.example                        # All env vars documented
├── .gitignore
├── package.json                        # Scripts: dev, build, shopify:dev,
│                                       #   shopify:deploy, widget:build, db:*
├── railway.toml                        # Railway deployment config
├── react-router.config.ts
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## Key Data Model Relationships

```
Shop
 ├── FbtGroup (many)
 │    ├── FbtProduct (many)       — products in the bundle/pool
 │    └── DiscountTier (many)     — tiered discount rules
 ├── GiftRule (many)              — gift with purchase rules
 ├── ShopSettings (one)           — free shipping threshold, currency
 ├── AiSuggestion (many)          — pending/approved/rejected AI bundles
 ├── AiCreditLedger (many)        — credit purchase + debit history
 ├── AnalyticsEvent (many)        — view/click/add_to_cart/purchase/gift_unlocked
 └── Session (many)               — OAuth sessions
```
