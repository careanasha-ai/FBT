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
import { upsertDiscountRule } from "~/services/discount.server";
import { FbtGroupSchema, DiscountRuleSchema } from "~/utils/validation";
import { parseGid } from "~/utils/shopify";

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

    await updateFbtGroup(groupId, shop.id, result.data);
  }

  if (intent === "update-discount") {
    const raw = {
      discountType: formData.get("discountType") as string,
      discountValue: parseFloat(formData.get("discountValue") as string) || 0,
      minItems: parseInt(formData.get("minItems") as string, 10) || 2,
    };

    const result = DiscountRuleSchema.safeParse(raw);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        errors[issue.path.join(".")] = issue.message;
      }
      return { errors };
    }

    await upsertDiscountRule(groupId, result.data);
  }

  throw redirect(`/app/products/${groupId}?shop=${shop.shopDomain}`);
}

export default function EditGroup() {
  const { group, created } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const fbtProductIdsValue = group.fbtProducts
    .map((p) => p.productId)
    .join(",");

  return (
    <div className="p-6 max-w-2xl">
      {created && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm">
          FBT group created successfully! The widget is now live on your storefront.
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-shopify-text">Edit FBT Group</h1>
        <p className="text-shopify-text-subdued text-sm mt-1">
          Product ID: {parseGid(group.productId)}
        </p>
      </div>

      <Form method="post" className="space-y-6 mb-8">
        <input type="hidden" name="intent" value="update-group" />

        <div className="card space-y-4">
          <h2 className="font-semibold text-shopify-text">Main Product</h2>
          <div>
            <label className="form-label">Product GID</label>
            <input name="productId" type="text" className="form-input" defaultValue={group.productId} required />
            {actionData?.errors?.productId && (
              <p className="form-error">{actionData.errors.productId}</p>
            )}
          </div>
          <div>
            <label className="form-label">Group Label</label>
            <input name="title" type="text" className="form-input" defaultValue={group.title ?? ""} />
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-shopify-text">Linked Products</h2>
          <div>
            <label className="form-label">Product GIDs (comma-separated)</label>
            <textarea name="fbtProductIds" className="form-input" rows={3} defaultValue={fbtProductIdsValue} />
            {actionData?.errors?.fbtProductIds && (
              <p className="form-error">{actionData.errors.fbtProductIds}</p>
            )}
          </div>
        </div>

        <div className="card">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="isActive" value="true" defaultChecked={group.isActive} className="w-4 h-4 accent-shopify-green" />
            <span className="font-medium text-shopify-text">Active</span>
          </label>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
          <a href="/app/products" className="btn btn-secondary">Back</a>
        </div>
      </Form>

      <Form method="post" className="space-y-4">
        <input type="hidden" name="intent" value="update-discount" />
        <div className="card space-y-4">
          <h2 className="font-semibold text-shopify-text">Discount Rule</h2>
          <div>
            <label className="form-label">Discount Type</label>
            <select name="discountType" className="form-input" defaultValue={group.discountRule?.discountType ?? "none"}>
              <option value="none">No discount</option>
              <option value="percentage">Percentage off</option>
              <option value="fixed">Fixed amount off</option>
            </select>
          </div>
          <div>
            <label className="form-label">Discount Value</label>
            <input name="discountValue" type="number" min="0" max="100" step="0.01" className="form-input" defaultValue={Number(group.discountRule?.discountValue ?? 0)} />
          </div>
          <div>
            <label className="form-label">Minimum Items for Discount</label>
            <input name="minItems" type="number" min="2" max="10" className="form-input" defaultValue={group.discountRule?.minItems ?? 2} />
          </div>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? "Saving..." : "Save Discount"}
          </button>
        </div>
      </Form>
    </div>
  );
}
