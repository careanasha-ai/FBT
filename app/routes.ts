import { type RouteConfig, route, index, layout, prefix } from "@react-router/dev/routes";

export default [
  // Root index
  index("routes/_index.tsx"),

  // Health check
  route("health", "routes/health.tsx"),

  // Auth
  route("auth/login",    "routes/auth/login.tsx"),
  route("auth/callback", "routes/auth/callback.tsx"),

  // Admin UI — nested under shared layout
  layout("routes/app/_layout.tsx", [
    route("app/dashboard",          "routes/app/dashboard.tsx"),
    route("app/products",           "routes/app/products/_index.tsx"),
    route("app/products/new",       "routes/app/products/new.tsx"),
    route("app/products/:groupId",  "routes/app/products/$groupId.tsx"),
    route("app/gifts",              "routes/app/gifts/_index.tsx"),
    route("app/analytics",          "routes/app/analytics/_index.tsx"),
    route("app/ai",                 "routes/app/ai/_index.tsx"),
    route("app/settings",           "routes/app/settings/_index.tsx"),
  ]),

  // Public JSON API routes
  ...prefix("api", [
    route("widget",      "routes/api/widget.tsx"),
    route("analytics",   "routes/api/analytics.tsx"),
    route("gift",        "routes/api/gift.tsx"),
    route("ai/suggest",  "routes/api/ai/suggest.tsx"),
  ]),

  // Shopify webhooks
  ...prefix("webhooks", [
    route("app-uninstalled", "routes/webhooks/app-uninstalled.tsx"),
    route("orders-paid",     "routes/webhooks/orders-paid.tsx"),
    route("shop-redact",     "routes/webhooks/shop-redact.tsx"),
  ]),
] satisfies RouteConfig;