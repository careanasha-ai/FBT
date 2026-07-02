import {
  useLoaderData,
  useActionData,
  useNavigation,
  Form,
  redirect,
} from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";

import { requireShop } from "~/services/auth.server";
import { getFbtGroup, updateFbtGroup } from "~/services/fbt.server";
import { FbtGroupSchema } from "~/utils/validation";
import { parseGid } from "~/utils/shopify";
import { formatTierLabel } from "~/utils/currency";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const shop = await requireShop(request);
  const groupId = parseInt(params.groupId!, 10);
  const group = await getFbtGroup(groupId, shop.id);

  if (!group) {
    throw new Response("FBT group not found", { status: 404 });
  }

  const url = new URL(request.url);
  const created = url.searchParams.get("created") === "1";

  return { group, shopDomain: shop.shopDomain, created };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const shop = await requireShop(request);
  const groupId = parseInt(params.groupId!, 10);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "update-group") {
    const fbtProductIds = (formData.get("fbtProductIds") as string)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // Parse discount tiers from indexed form fields
    const discountTiers: Array<{
      minItems: number;
      discountType: string;
      discountValue: number;
      position: number;
    }> = [];

    for (let i = 0; i < 5; i++) {
      const minItems = formData.get(`tiers[${i}].minItems`);
      const discountType = formData.get(`tiers[${i}].discountType`);
      const discountValue = formData.get(`tiers[${i}].discountValue`);
      if (minItems && discountType && discountValue && discountType !== "") {
        discountTiers.push({
          minItems: parseInt(minItems as string, 10),
          discountType: discountType as string,
          discountValue: parseFloat(discountValue as string),
          position: i,
        });
      }
    }

    const raw = {
      productId: formData.get("productId") as string,
      title: formData.get("title") as string,
      bundleType: formData.get("bundleType") as string,
      displayMode: formData.get("displayMode") as string,
      minSelect: parseInt(formData.get("minSelect") as string, 10) || 1,
      maxSelect: parseInt(formData.get("maxSelect") as string, 10) || 4,
      isActive: formData.get("isActive") === "true",
      fbtProductIds,
      discountTiers,
    };

    const result = FbtGroupSchema.safeParse(raw);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        errors[issue.path.join(".")] = issue.message;
      }
      return { errors };
    }

    await updateFbtGroup(groupId, shop.id, result.data);
  }

  throw redirect(`/app/products/${groupId}?shop=${shop.shopDomain}`);
}

export default function EditGroup() {
  const { group, created } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const fbtProductIdsValue = group.fbtProducts.map((p) => p.productId).join(", ");

  return (
    <div className="p-6 max-w-2xl">
      {created && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm">
          ✅ FBT group created! The widget is now live where you placed the block in your theme editor.
        </div>
      )}

      {/* AI badge */}
      {group.aiGenerated && group.aiTheme && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm">
          🤖 <strong>AI Generated:</strong> {group.aiTheme}
          {group.aiRationale && (
            <p className="mt-1 text-blue-700">{group.aiRationale}</p>
          )}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-shopify-text">Edit FBT Group</h1>
        <p className="text-shopify-text-subdued text-sm mt-1">
          Product ID: {parseGid(group.productId)}
        </p>
      </div>

      <Form method="post" className="space-y-6">
        <input type="hidden" name="intent" value="update-group" />

        {/* Main Product */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-shopify-text flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-shopify-green text-white text-xs flex items-center justify-center font-bold">1</span>
            Main Product
          </h2>
          <div>
            <label className="form-label">Product GID</label>
            <input name="productId" type="text" className="form-input"
              defaultValue={group.productId} required />
            {actionData?.errors?.productId && (
              <p className="form-error">{actionData.errors.productId}</p>
            )}
          </div>
          <div>
            <label className="form-label">Group Label</label>
            <input name="title" type="text" className="form-input"
              defaultValue={group.title ?? ""} />
          </div>
        </div>

        {/* Bundle Type */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-shopify-text flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-shopify-green text-white text-xs flex items-center justify-center font-bold">2</span>
            Bundle Type
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "fixed",    icon: "📦", label: "Fixed",    desc: "You pick exact products" },
              { value: "flexible", icon: "🔀", label: "Flexible", desc: "Customer picks N from pool" },
              { value: "volume",   icon: "🔢", label: "Volume",   desc: "Quantity breaks" },
            ].map((type) => (
              <label key={type.value}
                className="flex flex-col items-center p-3 border-2 border-shopify-border rounded-lg cursor-pointer hover:border-shopify-green transition-colors">
                <input type="radio" name="bundleType" value={type.value}
                  defaultChecked={group.bundleType === type.value} className="sr-only" />
                <span className="text-2xl mb-1">{type.icon}</span>
                <span className="font-medium text-sm">{type.label}</span>
                <span className="text-xs text-shopify-text-subdued text-center mt-1">{type.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* FBT Products */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-shopify-text flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-shopify-green text-white text-xs flex items-center justify-center font-bold">3</span>
            FBT Products
          </h2>
          <div>
            <label className="form-label">Product GIDs (comma-separated)</label>
            <textarea name="fbtProductIds" className="form-input" rows={3}
              defaultValue={fbtProductIdsValue} />
            {actionData?.errors?.fbtProductIds && (
              <p className="form-error">{actionData.errors.fbtProductIds}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Min customer must select</label>
              <input name="minSelect" type="number" min="1" max="20"
                defaultValue={group.minSelect} className="form-input" />
            </div>
            <div>
              <label className="form-label">Max customer can select</label>
              <input name="maxSelect" type="number" min="1" max="20"
                defaultValue={group.maxSelect} className="form-input" />
            </div>
          </div>
        </div>

        {/* Discount Tiers */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-shopify-text flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-shopify-green text-white text-xs flex items-center justify-center font-bold">4</span>
            Discount Tiers
          </h2>
          {group.discountTiers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {group.discountTiers.map((t) => (
                <span key={t.id} className="badge badge-success text-xs">
                  {t.minItems}+ items → {formatTierLabel(t)}
                </span>
              ))}
            </div>
          )}
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid grid-cols-3 gap-3 p-3 bg-shopify-surface rounded-lg">
              <div>
                <label className="form-label text-xs">Min Items (Tier {i + 1})</label>
                <input name={`tiers[${i}].minItems`} type="number" min="1" max="20"
                  defaultValue={group.discountTiers[i]?.minItems ?? ""}
                  className="form-input" />
              </div>
              <div>
                <label className="form-label text-xs">Discount Type</label>
                <select name={`tiers[${i}].discountType`} className="form-input"
                  defaultValue={group.discountTiers[i]?.discountType ?? ""}>
                  <option value="">— none —</option>
                  <option value="percentage">% off</option>
                  <option value="fixed">$ off</option>
                  <option value="price">Bundle price</option>
                </select>
              </div>
              <div>
                <label className="form-label text-xs">Value</label>
                <input name={`tiers[${i}].discountValue`} type="number" min="0" step="0.01"
                  defaultValue={group.discountTiers[i] ? Number(group.discountTiers[i].discountValue) : ""}
                  className="form-input" placeholder="e.g. 10" />
              </div>
            </div>
          ))}
        </div>

        {/* Display */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-shopify-text flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-shopify-green text-white text-xs flex items-center justify-center font-bold">5</span>
            Display
          </h2>
          <div>
            <label className="form-label">Widget Display Mode</label>
            <select name="displayMode" className="form-input" defaultValue={group.displayMode}>
              <option value="inline">Inline — shown on product page</option>
              <option value="popup">Popup — shown after Add to Cart click</option>
              <option value="both">Both — inline + popup</option>
            </select>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="isActive" value="true"
              defaultChecked={group.isActive} className="w-4 h-4 accent-shopify-green" />
            <span className="font-medium text-shopify-text">Active</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
          <a href="/app/products" className="btn btn-secondary">Back</a>
        </div>
      </Form>
    </div>
  );
}
