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

  // Parse FBT product IDs from comma-separated hidden field
  const fbtProductIdsRaw = formData.get("fbtProductIds") as string;
  const fbtProductIds = fbtProductIdsRaw
    ? fbtProductIdsRaw.split(",").filter(Boolean)
    : [];

  const raw = {
    productId: formData.get("productId") as string,
    title: formData.get("title") as string,
    isActive: formData.get("isActive") === "true",
    fbtProductIds,
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
  throw redirect(`/app/products/${group.id}?shop=${shop.shopDomain}&created=1`);
}

export default function NewProduct() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-shopify-text">
          Create FBT Group
        </h1>
        <p className="text-shopify-text-subdued text-sm mt-1">
          Link products that are frequently bought together.
        </p>
      </div>

      <Form method="post" className="space-y-6">
        {/* Main Product */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-shopify-text">Main Product</h2>

          <div>
            <label className="form-label" htmlFor="productId">
              Shopify Product GID
            </label>
            <input
              id="productId"
              name="productId"
              type="text"
              className="form-input"
              placeholder="gid://shopify/Product/1234567890"
              required
            />
            {actionData?.errors?.productId && (
              <p className="form-error">{actionData.errors.productId}</p>
            )}
            <p className="text-xs text-shopify-text-subdued mt-1">
              Find this in your Shopify Admin → Products → select product → copy
              ID from URL.
            </p>
          </div>

          <div>
            <label className="form-label" htmlFor="title">
              Group Label (optional)
            </label>
            <input
              id="title"
              name="title"
              type="text"
              className="form-input"
              placeholder="e.g. Running Shoes Bundle"
            />
          </div>
        </div>

        {/* FBT Products */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-shopify-text">
            Linked FBT Products
          </h2>
          <p className="text-sm text-shopify-text-subdued">
            Enter 1–4 product GIDs to show alongside the main product.
          </p>

          {/* Hidden field — populated by JS in a real implementation */}
          <div>
            <label className="form-label" htmlFor="fbtProductIds">
              Product GIDs (comma-separated)
            </label>
            <textarea
              id="fbtProductIds"
              name="fbtProductIds"
              className="form-input"
              rows={3}
              placeholder="gid://shopify/Product/111,gid://shopify/Product/222"
            />
            {actionData?.errors?.fbtProductIds && (
              <p className="form-error">{actionData.errors.fbtProductIds}</p>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="card">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isActive"
              value="true"
              defaultChecked
              className="w-4 h-4 accent-shopify-green"
            />
            <div>
              <span className="font-medium text-shopify-text">Active</span>
              <p className="text-xs text-shopify-text-subdued">
                Widget will be shown on the storefront immediately.
              </p>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? "Creating..." : "Create Group"}
          </button>
          <a href="/app/products" className="btn btn-secondary">
            Cancel
          </a>
        </div>
      </Form>
    </div>
  );
}