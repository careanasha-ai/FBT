import type { ActionFunctionArgs } from "react-router";

import { verifyWebhook, handleAppUninstalled } from "~/services/webhook.server";

/**
 * POST /webhooks/app-uninstalled
 * Shopify sends this when a merchant uninstalls the app.
 */
export async function action({ request }: ActionFunctionArgs) {
  const cloned = request.clone();
  const isValid = await verifyWebhook(cloned);

  if (!isValid) {
    return new Response("Unauthorized", { status: 401 });
  }

  const shopDomain = request.headers.get("x-shopify-shop-domain");
  if (!shopDomain) {
    return new Response("Missing shop domain", { status: 400 });
  }

  // Handle async — respond immediately to Shopify
  handleAppUninstalled(shopDomain).catch((err) => {
    console.error("[Webhook] app-uninstalled handler failed:", err);
  });

  return new Response("OK", { status: 200 });
}