import crypto from "crypto";

import { prisma } from "~/db/client";
import { uninstallShop } from "./auth.server";
import { recordEvent } from "./analytics.server";

// ─── Webhook Verification ─────────────────────────────────────────────────────

/**
 * Verify a Shopify webhook request using HMAC-SHA256.
 * Returns true if the signature is valid.
 */
export async function verifyWebhook(request: Request): Promise<boolean> {
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
  if (!hmacHeader) return false;

  const body = await request.text();
  const secret = process.env.SHOPIFY_API_SECRET!;

  const hash = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("base64");

  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(hmacHeader)
  );
}

/**
 * Get the raw body text and parsed JSON from a webhook request.
 * Must be called after verifyWebhook (which consumes the body stream).
 */
export function parseWebhookBody<T = unknown>(bodyText: string): T {
  return JSON.parse(bodyText) as T;
}

// ─── Webhook Handlers ─────────────────────────────────────────────────────────

/**
 * Handle app/uninstalled webhook
 */
export async function handleAppUninstalled(shopDomain: string): Promise<void> {
  console.log(`[Webhook] App uninstalled: ${shopDomain}`);
  // Widget delivered via Theme App Extension — no ScriptTag to remove
  await uninstallShop(shopDomain);
}

/**
 * Handle orders/paid webhook — record purchase analytics
 */
export async function handleOrderPaid(
  shopDomain: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orderData: Record<string, any>
): Promise<void> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true },
  });

  if (!shop) return;

  // Check if order contains FBT bundle (via cart attributes)
  const fbtGroupId = orderData?.cart_attributes?.find(
    (attr: { key: string }) => attr.key === "_fbt_group_id"
  )?.value;

  if (!fbtGroupId) return;

  await recordEvent(shop.id, {
    eventType: "purchase",
    groupId: parseInt(fbtGroupId, 10),
    sessionId: orderData?.cart_token,
    metadata: {
      orderId: orderData?.id,
      totalPrice: orderData?.total_price,
    },
  });
}

/**
 * Handle shop/redact webhook (GDPR — delete shop data)
 */
export async function handleShopRedact(shopDomain: string): Promise<void> {
  console.log(`[Webhook] Shop redact requested: ${shopDomain}`);

  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true },
  });

  if (!shop) return;

  // Delete all shop data (cascades via FK constraints)
  await prisma.shop.delete({ where: { id: shop.id } });
}