import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { requireShop } from "~/services/auth.server";
import { getAnalyticsSummary, getDailyEventCounts, getTopGroups } from "~/services/analytics.server";
import { formatDate } from "~/utils/date";

export async function loader({ request }: LoaderFunctionArgs) {
  const shop = await requireShop(request);
  const [summary, dailyCounts, topGroups] = await Promise.all([
    getAnalyticsSummary(shop.id),
    getDailyEventCounts(shop.id, 30),
    getTopGroups(shop.id, 5),
  ]);

  return { summary, dailyCounts, topGroups };
}

export default function Analytics() {
  const { summary, dailyCounts, topGroups } = useLoaderData<typeof loader>();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-shopify-text">Analytics</h1>
        <p className="text-shopify-text-subdued text-sm mt-1">
          Last 30 days performance
        </p>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid mb-8">
        {[
          { label: "Widget Views", value: summary.views.toLocaleString() },
          { label: "Clicks", value: summary.clicks.toLocaleString() },
          { label: "Add to Carts", value: summary.addToCarts.toLocaleString() },
          { label: "Purchases", value: summary.purchases.toLocaleString() },
          { label: "Click Rate", value: `${summary.clickRate}%` },
          { label: "Conversion Rate", value: `${summary.conversionRate}%` },
        ].map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-label mb-1">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Daily Chart */}
      <div className="card mb-8">
        <h2 className="font-semibold text-shopify-text mb-4">
          Daily Views & Add to Carts
        </h2>
        {dailyCounts.length === 0 ? (
          <div className="empty-state py-8">
            <p className="text-shopify-text-subdued">No data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailyCounts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e1e3e5" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => formatDate(d)}
                tick={{ fontSize: 11, fill: "#6d7175" }}
              />
              <YAxis tick={{ fontSize: 11, fill: "#6d7175" }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="views"
                stroke="#008060"
                strokeWidth={2}
                dot={false}
                name="Views"
              />
              <Line
                type="monotone"
                dataKey="addToCarts"
                stroke="#5c6ac4"
                strokeWidth={2}
                dot={false}
                name="Add to Carts"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Groups */}
      <div className="card">
        <h2 className="font-semibold text-shopify-text mb-4">
          Top FBT Groups (by Add to Cart)
        </h2>
        {topGroups.length === 0 ? (
          <div className="empty-state py-6">
            <p className="text-shopify-text-subdued">No data yet</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Group</th>
                <th>Add to Carts</th>
              </tr>
            </thead>
            <tbody>
              {topGroups.map((item, i) => (
                <tr key={i}>
                  <td>
                    {item.group?.title ?? `Group #${item.group?.id ?? "—"}`}
                  </td>
                  <td>
                    <span className="badge badge-success">
                      {item.addToCarts}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}