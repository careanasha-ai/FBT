import type { ActionFunctionArgs } from "react-router";

import { verifyWebhook, handleShopRedact } from "~/services/webhook.server";

/**
 * POST /webhooks/shop-redact
 * GDPR mandatory webhook — delete all data for a shop.
 */
export async function action({ request }: ActionFunctionArgs) {
  const bodyText = await request.text();

  const verifyRequest = new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: bodyText,
  });

  const isValid = await verifyWebhook(verifyRequest);
  if (!isValid) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: { shop_domain?: string };
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const shopDomain = payload.shop_domain;
  if (!shopDomain) {
    return new Response("Missing shop_domain", { status: 400 });
  }

  handleShopRedact(shopDomain).catch((err) => {
    console.error("[Webhook] shop-redact handler failed:", err);
  });

  return new Response("OK", { status: 200 });
}