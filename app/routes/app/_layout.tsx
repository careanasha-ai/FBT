import { Outlet, NavLink, useLocation } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

import { requireShop } from "~/services/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const shop = await requireShop(request);
  return { shopDomain: shop.shopDomain };
}

const NAV_ITEMS = [
  { to: "dashboard", label: "Dashboard", icon: "📊" },
  { to: "products", label: "FBT Groups", icon: "🔗" },
  { to: "discounts", label: "Discounts", icon: "🏷️" },
  { to: "analytics", label: "Analytics", icon: "📈" },
  { to: "settings", label: "Settings", icon: "⚙️" },
];

export default function AppLayout() {
  const location = useLocation();
  const shopParam = new URLSearchParams(location.search).get("shop") ?? "";

  return (
    <div className="flex min-h-screen bg-shopify-surface">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-shopify-border flex flex-col">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-shopify-border">
          <span className="font-bold text-shopify-green text-base leading-tight">
            Frequently<br />Bought Together
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={`/app/${item.to}?shop=${shopParam}`}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-shopify-surface text-shopify-green"
                    : "text-shopify-text hover:bg-shopify-surface"
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-shopify-border">
          <p className="text-xs text-shopify-text-subdued">v0.1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}