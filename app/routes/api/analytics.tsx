import type { ActionFunctionArgs } from "react-router";

import { prisma } from "~/db/client";
import { recordEvent } from "~/services/analytics.server";
import { AnalyticsEventSchema } from "~/utils/validation";

/**
 * POST /api/analytics
 *
 * Public endpoint — called by the storefront widget to record events.
 * Body: { shop, eventType, groupId?, productId?, sessionId?, metadata? }
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { shop, ...eventData } = body as Record<string, unknown>;

  if (!shop || typeof shop !== "string") {
    return new Response(JSON.stringify({ error: "Missing shop" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate event payload
  const result = AnalyticsEventSchema.safeParse(eventData);
  if (!result.success) {
    return new Response(
      JSON.stringify({ error: "Invalid event data", details: result.error.issues }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Look up shop
  const dbShop = await prisma.shop.findUnique({
    where: { shopDomain: shop },
    select: { id: true },
  });

  if (!dbShop) {
    return new Response(JSON.stringify({ error: "Shop not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  await recordEvent(dbShop.id, result.data);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// Handle CORS preflight
export async function loader() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}