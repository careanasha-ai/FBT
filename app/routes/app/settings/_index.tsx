import { useLoaderData, Form, useNavigation } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";

import { requireShop } from "~/services/auth.server";
import { ensureScriptTag, removeScriptTag } from "~/services/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const shop = await requireShop(request);
  return {
    shopDomain: shop.shopDomain,
    widgetUrl: `${process.env.WIDGET_CDN_URL}/fbt-widget.js`,
    installedAt: shop.installedAt,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const shop = await requireShop(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "reinstall-script") {
    await removeScriptTag(shop.shopDomain, shop.accessToken);
    await ensureScriptTag(shop.shopDomain, shop.accessToken);
    return { message: "Script tag reinstalled successfully." };
  }

  return {};
}

export default function Settings() {
  const { shopDomain, widgetUrl, installedAt } =
    useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-shopify-text">Settings</h1>
        <p className="text-shopify-text-subdued text-sm mt-1">
          App configuration and widget management.
        </p>
      </div>

      {/* Shop Info */}
      <div className="card mb-6 space-y-3">
        <h2 className="font-semibold text-shopify-text">Shop Information</h2>
        <div className="flex justify-between text-sm">
          <span className="text-shopify-text-subdued">Shop Domain</span>
          <span className="font-medium">{shopDomain}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-shopify-text-subdued">Installed</span>
          <span className="font-medium">
            {new Date(installedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Widget Info */}
      <div className="card mb-6 space-y-3">
        <h2 className="font-semibold text-shopify-text">Widget Script</h2>
        <div className="text-sm">
          <span className="text-shopify-text-subdued block mb-1">
            Script URL
          </span>
          <code className="block bg-shopify-surface px-3 py-2 rounded text-xs break-all">
            {widgetUrl}
          </code>
        </div>
        <p className="text-xs text-shopify-text-subdued">
          This script is automatically injected into your storefront via
          Shopify ScriptTags. If the widget is not appearing, use the button
          below to reinstall it.
        </p>
        <Form method="post">
          <input type="hidden" name="intent" value="reinstall-script" />
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-secondary"
          >
            {isSubmitting ? "Reinstalling..." : "Reinstall Widget Script"}
          </button>
        </Form>
      </div>

      {/* Phase 2 Teaser */}
      <div className="card border-dashed border-shopify-border bg-shopify-surface">
        <h2 className="font-semibold text-shopify-text mb-2">
          🤖 AI Recommendations — Coming Soon
        </h2>
        <p className="text-sm text-shopify-text-subdued">
          In Phase 2, you'll be able to use AI-powered suggestions to
          automatically generate FBT groups based on your order history.
          Credits-based pricing.
        </p>
      </div>
    </div>
  );
}