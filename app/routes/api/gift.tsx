import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";

import { requireShop } from "~/services/auth.server";
import {
  listGiftRules,
  createGiftRule,
  updateGiftRule,
  deleteGiftRule,
  toggleGiftRule,
} from "~/services/gift.server";
import { GiftRuleSchema } from "~/utils/validation";

// GET /api/gift — list all gift rules for the shop
export async function loader({ request }: LoaderFunctionArgs) {
  const shop = await requireShop(request);
  const rules = await listGiftRules(shop.id);
  return new Response(JSON.stringify({ rules }), {
    headers: { "Content-Type": "application/json" },
  });
}

// POST /api/gift — create | update | delete | toggle
export async function action({ request }: ActionFunctionArgs) {
  const shop = await requireShop(request);
  const body = await request.json() as Record<string, unknown>;
  const intent = body.intent as string;

  if (intent === "create") {
    const result = GiftRuleSchema.safeParse(body);
    if (!result.success) {
      return new Response(
        JSON.stringify({ error: "Validation failed", issues: result.error.issues }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const rule = await createGiftRule(shop.id, result.data);
    return new Response(JSON.stringify({ rule }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (intent === "update") {
    const ruleId = Number(body.ruleId);
    const result = GiftRuleSchema.safeParse(body);
    if (!result.success) {
      return new Response(
        JSON.stringify({ error: "Validation failed", issues: result.error.issues }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const rule = await updateGiftRule(ruleId, shop.id, result.data);
    return new Response(JSON.stringify({ rule }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (intent === "toggle") {
    const ruleId = Number(body.ruleId);
    const isActive = Boolean(body.isActive);
    const rule = await toggleGiftRule(ruleId, shop.id, isActive);
    return new Response(JSON.stringify({ rule }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (intent === "delete") {
    const ruleId = Number(body.ruleId);
    await deleteGiftRule(ruleId, shop.id);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Unknown intent" }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}