import { useLoaderData, Form, useNavigation } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";

import { requireShop } from "~/services/auth.server";
import {
  listGiftRules,
  createGiftRule,
  updateGiftRule,
  deleteGiftRule,
  toggleGiftRule,
} from "~/services/gift.server";
import { GiftRuleSchema } from "~/utils/validation";

export async function loader({ request }: LoaderFunctionArgs) {
  const shop = await requireShop(request);
  const rules = await listGiftRules(shop.id);
  return { rules };
}

export async function action({ request }: ActionFunctionArgs) {
  const shop = await requireShop(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "create" || intent === "update") {
    const raw = {
      name: formData.get("name"),
      thresholdType: formData.get("thresholdType"),
      thresholdValue: parseFloat(formData.get("thresholdValue") as string),
      giftProductId: formData.get("giftProductId"),
      giftVariantId: formData.get("giftVariantId"),
      giftTitle: formData.get("giftTitle"),
      giftImageUrl: formData.get("giftImageUrl"),
      maxPerOrder: parseInt(formData.get("maxPerOrder") as string, 10) || 1,
      showProgressBar: formData.get("showProgressBar") === "true",
      progressMessage: formData.get("progressMessage"),
      isActive: formData.get("isActive") === "true",
    };

    const result = GiftRuleSchema.safeParse(raw);
    if (!result.success) {
      return { errors: Object.fromEntries(result.error.issues.map((i) => [i.path.join("."), i.message])) };
    }

    if (intent === "create") {
      await createGiftRule(shop.id, result.data);
    } else {
      const ruleId = parseInt(formData.get("ruleId") as string, 10);
      await updateGiftRule(ruleId, shop.id, result.data);
    }
  }

  if (intent === "toggle") {
    const ruleId = parseInt(formData.get("ruleId") as string, 10);
    const isActive = formData.get("isActive") === "true";
    await toggleGiftRule(ruleId, shop.id, !isActive);
  }

  if (intent === "delete") {
    const ruleId = parseInt(formData.get("ruleId") as string, 10);
    await deleteGiftRule(ruleId, shop.id);
  }

  return {};
}

export default function GiftsIndex() {
  const { rules } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-shopify-text">Gift With Purchase</h1>
        <p className="text-shopify-text-subdued text-sm mt-1">
          Automatically add a free gift when customers reach a spend threshold.
        </p>
      </div>

      {/* Create Form */}
      <div className="card mb-8">
        <h2 className="font-semibold text-shopify-text mb-4">Add Gift Rule</h2>
        <Form method="post" className="space-y-4">
          <input type="hidden" name="intent" value="create" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Rule Name</label>
              <input name="name" type="text" className="form-input" placeholder="e.g. Free Pouch over $75" required />
            </div>
            <div>
              <label className="form-label">Gift Product Title</label>
              <input name="giftTitle" type="text" className="form-input" placeholder="e.g. Travel Pouch" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="form-label">Trigger Type</label>
              <select name="thresholdType" className="form-input">
                <option value="cart_value">Cart Value ($)</option>
                <option value="item_count">Item Count</option>
                <option value="fbt_add">FBT Bundle Added</option>
              </select>
            </div>
            <div>
              <label className="form-label">Threshold Value</label>
              <input name="thresholdValue" type="number" min="0" step="0.01" className="form-input" placeholder="75.00" required />
            </div>
            <div>
              <label className="form-label">Max Per Order</label>
              <input name="maxPerOrder" type="number" min="1" max="10" className="form-input" defaultValue="1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Gift Product GID</label>
              <input name="giftProductId" type="text" className="form-input" placeholder="gid://shopify/Product/..." required />
            </div>
            <div>
              <label className="form-label">Gift Variant GID</label>
              <input name="giftVariantId" type="text" className="form-input" placeholder="gid://shopify/ProductVariant/..." required />
            </div>
          </div>

          <div>
            <label className="form-label">Progress Bar Message</label>
            <input
              name="progressMessage"
              type="text"
              className="form-input"
              defaultValue="You're {amount} away from a free {gift}!"
              placeholder="Use {amount} and {gift} as placeholders"
            />
            <p className="text-xs text-shopify-text-subdued mt-1">
              Use <code className="bg-shopify-surface px-1 rounded">{"{amount}"}</code> and{" "}
              <code className="bg-shopify-surface px-1 rounded">{"{gift}"}</code> as dynamic placeholders.
            </p>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="showProgressBar" value="true" defaultChecked className="w-4 h-4 accent-shopify-green" />
              <span className="text-sm font-medium">Show progress bar</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isActive" value="true" defaultChecked className="w-4 h-4 accent-shopify-green" />
              <span className="text-sm font-medium">Active</span>
            </label>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? "Saving..." : "Add Gift Rule"}
          </button>
        </Form>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="text-4xl mb-4">🎁</div>
            <p className="empty-state-title">No gift rules yet</p>
            <p className="empty-state-description">
              Create a gift rule above to start rewarding customers who spend more.
            </p>
          </div>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rule</th>
                <th>Trigger</th>
                <th>Gift</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td className="font-medium">{rule.name}</td>
                  <td>
                    {rule.thresholdType === "cart_value"
                      ? `Cart ≥ $${rule.thresholdValue}`
                      : rule.thresholdType === "item_count"
                      ? `${rule.thresholdValue}+ items`
                      : "FBT bundle added"}
                  </td>
                  <td>{rule.giftTitle ?? "—"}</td>
                  <td>
                    <span className={`badge ${rule.isActive ? "badge-success" : "badge-neutral"}`}>
                      {rule.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <Form method="post" className="inline">
                        <input type="hidden" name="intent" value="toggle" />
                        <input type="hidden" name="ruleId" value={rule.id} />
                        <input type="hidden" name="isActive" value={String(rule.isActive)} />
                        <button type="submit" disabled={isSubmitting} className="btn btn-secondary text-xs py-1 px-2">
                          {rule.isActive ? "Disable" : "Enable"}
                        </button>
                      </Form>
                      <Form method="post" className="inline"
                        onSubmit={(e) => { if (!confirm("Delete this gift rule?")) e.preventDefault(); }}>
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="ruleId" value={rule.id} />
                        <button type="submit" disabled={isSubmitting} className="btn btn-destructive text-xs py-1 px-2">
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