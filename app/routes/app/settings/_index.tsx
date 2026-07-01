import { useLoaderData, Form, useActionData, useNavigation } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";

import { requireShop } from "~/services/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const shop = await requireShop(request);
  return {
    shopDomain: shop.shopDomain,
    appUrl: process.env.APP_URL ?? "",
    installedAt: shop.installedAt,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  await requireShop(request);
  // Reserved for future settings actions (e.g. reset analytics, manage credits)
  return { message: "Settings saved." };
}

export default function Settings() {
  const { shopDomain, appUrl, installedAt } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-shopify-text">Settings</h1>
        <p className="text-shopify-text-subdued text-sm mt-1">
          App configuration and widget setup.
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
        <div className="flex justify-between text-sm">
          <span className="text-shopify-text-subdued">App URL</span>
          <span className="font-medium text-xs break-all">{appUrl}</span>
        </div>
      </div>

      {/* Theme App Extension setup guide */}
      <div className="card mb-6 space-y-4">
        <h2 className="font-semibold text-shopify-text">
          Widget Setup — Theme App Extension
        </h2>
        <p className="text-sm text-shopify-text-subdued">
          The FBT widget is delivered as a Theme App Extension. Follow these
          steps to activate it on your storefront:
        </p>
        <ol className="space-y-3 text-sm text-shopify-text">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-shopify-green text-white flex items-center justify-center text-xs font-bold">
              1
            </span>
            <span>
              Go to your Shopify Admin →{" "}
              <strong>Online Store → Themes → Customize</strong>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-shopify-green text-white flex items-center justify-center text-xs font-bold">
              2
            </span>
            <span>
              Navigate to a <strong>Product page</strong> template in the theme
              editor
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-shopify-green text-white flex items-center justify-center text-xs font-bold">
              3
            </span>
            <span>
              Click <strong>Add block</strong> in the product information
              section → select{" "}
              <strong>Frequently Bought Together</strong>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-shopify-green text-white flex items-center justify-center text-xs font-bold">
              4
            </span>
            <span>
              Drag the block to your preferred position (below the Add to Cart
              button is recommended)
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-shopify-green text-white flex items-center justify-center text-xs font-bold">
              5
            </span>
            <span>
              Customise the widget title, button text, and button colour in the
              block settings panel → click <strong>Save</strong>
            </span>
          </li>
        </ol>
        <div className="bg-shopify-surface rounded-md p-3 text-xs text-shopify-text-subdued">
          💡 The widget will only appear on product pages where you have
          configured an FBT group in the{" "}
          <a href="/app/products" className="text-shopify-green underline">
            FBT Groups
          </a>{" "}
          section. Products without a group will not show the widget.
        </div>
      </div>

      {/* Action feedback */}
      {actionData?.message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm">
          {actionData.message}
        </div>
      )}

      {/* Phase 2 Teaser */}
      <div className="card border-dashed border-shopify-border bg-shopify-surface">
        <h2 className="font-semibold text-shopify-text mb-2">
          🤖 AI Recommendations — Coming Soon
        </h2>
        <p className="text-sm text-shopify-text-subdued">
          In Phase 2, AI-powered suggestions will automatically generate FBT
          groups based on your order history. Credits-based pricing — only pay
          for what you use.
        </p>
      </div>
    </div>
  );
}