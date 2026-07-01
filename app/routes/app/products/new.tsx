import { redirect, useActionData, useNavigation, Form } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import { requireShop } from "~/services/auth.server";
import { createFbtGroup } from "~/services/fbt.server";
import { FbtGroupSchema } from "~/utils/validation";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireShop(request);
  return {};
}

export async function action({ request }: ActionFunctionArgs) {
  const shop = await requireShop(request);
  const formData = await request.formData();

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
    if (minItems && discountType && discountValue) {
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

  const group = await createFbtGroup(shop.id, result.data);
  throw redirect(`/app/products/${group!.id}?shop=${shop.shopDomain}&created=1`);
}

export default function NewProduct() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-shopify-text">Create FBT Group</h1>
        <p className="text-shopify-text-subdued text-sm mt-1">
          Link products that are frequently bought together.
        </p>
      </div>

      <Form method="post" className="space-y-6">

        {/* ── Step 1: Main Product ── */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-shopify-text flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-shopify-green text-white text-xs flex items-center justify-center font-bold">1</span>
            Main Product
          </h2>
          <div>
            <label className="form-label">Shopify Product GID</label>
            <input name="productId" type="text" className="form-input"
              placeholder="gid://shopify/Product/1234567890" required />
            {actionData?.errors?.productId && (
              <p className="form-error">{actionData.errors.productId}</p>
            )}
          </div>
          <div>
            <label className="form-label">Group Label (optional)</label>
            <input name="title" type="text" className="form-input"
              placeholder="e.g. Running Shoes Bundle" />
          </div>
        </div>

        {/* ── Step 2: Bundle Type ── */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-shopify-text flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-shopify-green text-white text-xs flex items-center justify-center font-bold">2</span>
            Bundle Type
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "fixed",    icon: "📦", label: "Fixed",    desc: "You pick exact products" },
              { value: "flexible", icon: "🔀", label: "Flexible", desc: "Customer picks N from a pool" },
              { value: "volume",   icon: "🔢", label: "Volume",   desc: "Quantity breaks, same product" },
            ].map((type) => (
              <label key={type.value}
                className="flex flex-col items-center p-3 border-2 border-shopify-border rounded-lg cursor-pointer hover:border-shopify-green transition-colors has-[:checked]:border-shopify-green has-[:checked]:bg-green-50">
                <input type="radio" name="bundleType" value={type.value}
                  defaultChecked={type.value === "fixed"} className="sr-only" />
                <span className="text-2xl mb-1">{type.icon}</span>
                <span className="font-medium text-sm">{type.label}</span>
                <span className="text-xs text-shopify-text-subdued text-center mt-1">{type.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ── Step 3: FBT Products ── */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-shopify-text flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-shopify-green text-white text-xs flex items-center justify-center font-bold">3</span>
            FBT Products
          </h2>
          <p className="text-sm text-shopify-text-subdued">
            Enter product GIDs (comma-separated). For flexible bundles, these form the pool customers choose from.
          </p>
          <div>
            <label className="form-label">Product GIDs</label>
            <textarea name="fbtProductIds" className="form-input" rows={3}
              placeholder="gid://shopify/Product/111, gid://shopify/Product/222" />
            {actionData?.errors?.fbtProductIds && (
              <p className="form-error">{actionData.errors.fbtProductIds}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Min customer must select</label>
              <input name="minSelect" type="number" min="1" max="20" defaultValue="1" className="form-input" />
            </div>
            <div>
              <label className="form-label">Max customer can select</label>
              <input name="maxSelect" type="number" min="1" max="20" defaultValue="4" className="form-input" />
            </div>
          </div>
        </div>

        {/* ── Step 4: Discount Tiers ── */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-shopify-text flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-shopify-green text-white text-xs flex items-center justify-center font-bold">4</span>
            Discount Tiers
          </h2>
          <p className="text-sm text-shopify-text-subdued">
            Add up to 3 tiers. Discount increases as customers add more items — creates a "just one more" pull.
          </p>
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid grid-cols-3 gap-3 p-3 bg-shopify-surface rounded-lg">
              <div>
                <label className="form-label text-xs">Min Items (Tier {i + 1})</label>
                <input name={`tiers[${i}].minItems`} type="number" min="1" max="20"
                  defaultValue={i === 0 ? 2 : i === 1 ? 3 : ""} className="form-input" />
              </div>
              <div>
                <label className="form-label text-xs">Discount Type</label>
                <select name={`tiers[${i}].discountType`} className="form-input">
                  <option value="">— none —</option>
                  <option value="percentage">% off</option>
                  <option value="fixed">$ off</option>
                  <option value="price">Bundle price</option>
                </select>
              </div>
              <div>
                <label className="form-label text-xs">Value</label>
                <input name={`tiers[${i}].discountValue`} type="number" min="0" step="0.01"
                  className="form-input" placeholder="e.g. 10" />
              </div>
            </div>
          ))}
        </div>

        {/* ── Step 5: Display ── */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-shopify-text flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-shopify-green text-white text-xs flex items-center justify-center font-bold">5</span>
            Display
          </h2>
          <div>
            <label className="form-label">Widget Display Mode</label>
            <select name="displayMode" className="form-input">
              <option value="inline">Inline — shown on product page</option>
              <option value="popup">Popup — shown after Add to Cart click</option>
              <option value="both">Both — inline + popup</option>
            </select>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="isActive" value="true" defaultChecked
              className="w-4 h-4 accent-shopify-green" />
            <div>
              <span className="font-medium text-shopify-text">Active</span>
              <p className="text-xs text-shopify-text-subdued">Widget shown on storefront immediately.</p>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? "Creating..." : "Create Group"}
          </button>
          <a href="/app/products" className="btn btn-secondary">Cancel</a>
        </div>
      </Form>
    </div>
  );
}