import type { ActionFunctionArgs } from "react-router";

import { verifyWebhook, handleOrderPaid } from "~/services/webhook.server";

/**
 * POST /webhooks/orders-paid
 * Shopify sends this when an order is paid — used to record purchase analytics.
 */
export async function action({ request }: ActionFunctionArgs) {
  const bodyText = await request.text();

  // Verify HMAC signature
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
  if (!hmacHeader) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Re-create request with body for verification
  const verifyRequest = new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: bodyText,
  });

  const isValid = await verifyWebhook(verifyRequest);
  if (!isValid) {
    return new Response("Unauthorized", { status: 401 });
  }

  const shopDomain = request.headers.get("x-shopify-shop-domain");
  if (!shopDomain) {
    return new Response("Missing shop domain", { status: 400 });
  }

  let orderData: Record<string, unknown>;
  try {
    orderData = JSON.parse(bodyText);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Handle async — respond immediately to Shopify (5s timeout)
  handleOrderPaid(shopDomain, orderData).catch((err) => {
    console.error("[Webhook] orders-paid handler failed:", err);
  });

  return new Response("OK", { status: 200 });
}