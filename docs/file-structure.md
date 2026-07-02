# File Structure

```
FBT/
├── extensions/fbt-widget/
│   ├── blocks/fbt-widget.liquid     # Liquid block (server-rendered)
│   ├── assets/fbt-widget.js         # Built widget (Shopify CDN)
│   ├── locales/en.default.json
│   └── shopify.extension.toml
├── widget/src/
│   ├── index.ts                     # Entry — reads data-* attrs
│   ├── render.ts                    # Fixed/flexible/popup/gift bar
│   ├── currency.ts                  # Tiered discount resolution
│   ├── api.ts, cart.ts, styles.ts, types.ts, utils.ts
│   └── vite.config.ts               # Output → extensions/fbt-widget/assets/
├── app/
│   ├── routes.ts                    # Explicit React Router v7 route manifest
│   ├── routes/app/                  # Admin UI pages
│   ├── routes/api/                  # JSON API (widget, analytics, gift, ai/suggest)
│   ├── routes/webhooks/             # Shopify webhooks
│   ├── services/                    # fbt, discount, gift, ai, widget, auth, shopify
│   ├── db/client.ts, seed.ts
│   └── utils/constants, validation, shopify, currency, date
├── prisma/schema.prisma
├── app/routes.ts                    # REQUIRED by React Router v7
├── nixpacks.toml                    # Railway build phases
├── railway.toml                     # startCommand runs db:migrate
└── package.json
```
