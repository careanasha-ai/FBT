import { useLoaderData, Link, Form, useNavigation } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";

import { requireShop } from "~/services/auth.server";
import { listFbtGroups, toggleFbtGroup, deleteFbtGroup } from "~/services/fbt.server";
import { formatTierLabel } from "~/services/discount.server";
import { parseGid } from "~/utils/shopify";

export async function loader({ request }: LoaderFunctionArgs) {
  const shop = await requireShop(request);
  const groups = await listFbtGroups(shop.id);
  return { groups, shopId: shop.id };
}

export async function action({ request }: ActionFunctionArgs) {
  const shop = await requireShop(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const groupId = parseInt(formData.get("groupId") as string, 10);

  if (intent === "toggle") {
    const isActive = formData.get("isActive") === "true";
    await toggleFbtGroup(groupId, shop.id, !isActive);
  }

  if (intent === "delete") {
    await deleteFbtGroup(groupId, shop.id);
  }

  return {};
}

const BUNDLE_TYPE_LABELS: Record<string, string> = {
  fixed:    "📦 Fixed",
  flexible: "🔀 Flexible",
  volume:   "🔢 Volume",
};

const DISPLAY_MODE_LABELS: Record<string, string> = {
  inline: "Inline",
  popup:  "Popup",
  both:   "Both",
};

export default function ProductsIndex() {
  const { groups } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-shopify-text">FBT Groups</h1>
          <p className="text-shopify-text-subdued text-sm mt-1">
            Manage which products appear together on product pages.
          </p>
        </div>
        <Link to="new" className="btn btn-primary">+ Create Group</Link>
      </div>

      {/* Groups Table */}
      {groups.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="text-4xl mb-4">🔗</div>
            <p className="empty-state-title">No FBT groups yet</p>
            <p className="empty-state-description">
              Create your first group to start showing frequently bought together
              products on your store.
            </p>
            <Link to="new" className="btn btn-primary">Create your first group</Link>
          </div>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Main Product</th>
                <th>Type</th>
                <th>Products</th>
                <th>Discount Tiers</th>
                <th>Display</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id}>
                  <td>
                    <div className="font-medium">
                      {group.title ?? `Product ${parseGid(group.productId)}`}
                    </div>
                    <div className="text-xs text-shopify-text-subdued">
                      ID: {parseGid(group.productId)}
                    </div>
                    {group.aiGenerated && (
                      <span className="text-xs text-blue-600">🤖 AI</span>
                    )}
                  </td>
                  <td>
                    <span className="text-sm">
                      {BUNDLE_TYPE_LABELS[group.bundleType] ?? group.bundleType}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-neutral">
                      {group.fbtProducts.length} product{group.fbtProducts.length !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td>
                    {group.discountTiers.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {group.discountTiers.map((t) => (
                          <span key={t.id} className="badge badge-success text-xs">
                            {t.minItems}+ → {formatTierLabel(t)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-shopify-text-subdued text-sm">—</span>
                    )}
                  </td>
                  <td>
                    <span className="text-sm text-shopify-text-subdued">
                      {DISPLAY_MODE_LABELS[group.displayMode] ?? group.displayMode}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${group.isActive ? "badge-success" : "badge-neutral"}`}>
                      {group.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Link to={`${group.id}`} className="btn btn-secondary text-xs py-1 px-2">
                        Edit
                      </Link>
                      <Form method="post" className="inline">
                        <input type="hidden" name="intent" value="toggle" />
                        <input type="hidden" name="groupId" value={group.id} />
                        <input type="hidden" name="isActive" value={String(group.isActive)} />
                        <button type="submit" disabled={isSubmitting}
                          className="btn btn-secondary text-xs py-1 px-2">
                          {group.isActive ? "Disable" : "Enable"}
                        </button>
                      </Form>
                      <Form method="post" className="inline"
                        onSubmit={(e) => { if (!confirm("Delete this FBT group?")) e.preventDefault(); }}>
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="groupId" value={group.id} />
                        <button type="submit" disabled={isSubmitting}
                          className="btn btn-destructive text-xs py-1 px-2">
                          Delete
                        </button>
                      </Form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}