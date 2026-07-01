import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import { requireShop } from "~/services/auth.server";
import {
  runAiBundleAnalysis,
  listAiSuggestions,
  getAiCreditBalance,
} from "~/services/ai.server";
import {
  createFbtGroupFromAiSuggestion,
  rejectAiSuggestion,
} from "~/services/fbt.server";

/**
 * GET /api/ai/suggest
 * Returns pending suggestions + credit balance for the shop.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const shop = await requireShop(request);
  const url = new URL(request.url);
  const status = (url.searchParams.get("status") ?? "pending") as
    | "pending"
    | "approved"
    | "rejected";

  const [suggestions, creditBalance] = await Promise.all([
    listAiSuggestions(shop.id, status),
    getAiCreditBalance(shop.id),
  ]);

  return new Response(JSON.stringify({ suggestions, creditBalance }), {
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * POST /api/ai/suggest
 * intent: "analyse"  — run AI analysis on the shop's product catalog
 * intent: "approve"  — approve a suggestion and create an FBT group
 * intent: "reject"   — reject a suggestion
 */
export async function action({ request }: ActionFunctionArgs) {
  const shop = await requireShop(request);
  const body = (await request.json()) as Record<string, unknown>;
  const intent = body.intent as string;

  // ── Run analysis ──────────────────────────────────────────────────────────
  if (intent === "analyse") {
    try {
      const result = await runAiBundleAnalysis(
        shop.id,
        shop.shopDomain,
        shop.accessToken
      );
      return new Response(JSON.stringify({ ok: true, result }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // ── Approve suggestion ────────────────────────────────────────────────────
  if (intent === "approve") {
    const suggestionId = Number(body.suggestionId);
    const overrides = body.overrides as
      | {
          title?: string;
          displayMode?: string;
          discountTiers?: Array<{
            minItems: number;
            discountType: string;
            discountValue: number;
            position: number;
          }>;
        }
      | undefined;

    try {
      const group = await createFbtGroupFromAiSuggestion(
        shop.id,
        suggestionId,
        overrides
      );
      return new Response(JSON.stringify({ ok: true, group }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Approval failed";
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // ── Reject suggestion ─────────────────────────────────────────────────────
  if (intent === "reject") {
    const suggestionId = Number(body.suggestionId);
    await rejectAiSuggestion(shop.id, suggestionId);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Unknown intent" }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}