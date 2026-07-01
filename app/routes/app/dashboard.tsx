import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

import { requireShop } from "~/services/auth.server";
import { getAnalyticsSummary } from "~/services/analytics.server";
import { listFbtGroups } from "~/services/fbt.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const shop = await requireShop(request);
  const [summary, groups] = await Promise.all([
    getAnalyticsSummary(shop.id),
    listFbtGroups(shop.id),
  ]);

  return {
    shopDomain: shop.shopDomain,
    summary,
    totalGroups: groups.length,
    activeGroups: groups.filter((g) => g.isActive).length,
  };
}

export default function Dashboard() {
  const { shopDomain, summary, totalGroups, activeGroups } =
    useLoaderData<typeof loader>();

  const stats = [
    { label: "Widget Views", value: summary.views.toLocaleString(), icon: "👁️" },
    { label: "Clicks", value: summary.clicks.toLocaleString(), icon: "🖱️" },
    { label: "Add to Carts", value: summary.addToCarts.toLocaleString(), icon: "🛒" },
    { label: "Click Rate", value: `${summary.clickRate}%`, icon: "📊" },
    { label: "Conversion Rate", value: `${summary.conversionRate}%`, icon: "🎯" },
    { label: "Active Groups", value: `${activeGroups} / ${totalGroups}`, icon: "🔗" },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-shopify-text">Dashboard</h1>
        <p className="text-shopify-text-subdued text-sm mt-1">{shopDomain}</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{stat.icon}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-base font-semibold text-shopify-text mb-4">
          Quick Actions
        </h2>
        <div className="flex gap-3 flex-wrap">
          <a href="products/new" className="btn btn-primary">
            + Create FBT Group
          </a>
          <a href="analytics" className="btn btn-secondary">
            View Analytics
          </a>
        </div>
      </div>

      {/* Last 30 days note */}
      <p className="text-xs text-shopify-text-subdued mt-4">
        Stats shown for the last 30 days.
      </p>
    </div>
  );
}