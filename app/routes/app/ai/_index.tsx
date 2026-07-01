import { useLoaderData, Form, useNavigation, useActionData } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";

import { requireShop } from "~/services/auth.server";
import {
  listAiSuggestions,
  getAiCreditBalance,
  runAiBundleAnalysis,
} from "~/services/ai.server";
import {
  createFbtGroupFromAiSuggestion,
  rejectAiSuggestion,
} from "~/services/fbt.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const shop = await requireShop(request);
  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") ?? "pending";

  const [suggestions, creditBalance] = await Promise.all([
    listAiSuggestions(shop.id, tab as "pending" | "approved" | "rejected"),
    getAiCreditBalance(shop.id),
  ]);

  return { suggestions, creditBalance, tab };
}

export async function action({ request }: ActionFunctionArgs) {
  const shop = await requireShop(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "analyse") {
    try {
      const result = await runAiBundleAnalysis(
        shop.id,
        shop.shopDomain,
        shop.accessToken
      );
      return {
        success: `Analysis complete! Found ${result.suggestions.length} bundle suggestions from ${result.productsAnalysed} products. 1 credit used.`,
        error: null,
      };
    } catch (err) {
      return {
        success: null,
        error: err instanceof Error ? err.message : "Analysis failed",
      };
    }
  }

  if (intent === "approve") {
    const suggestionId = parseInt(formData.get("suggestionId") as string, 10);
    await createFbtGroupFromAiSuggestion(shop.id, suggestionId);
    return { success: "Bundle approved and created!", error: null };
  }

  if (intent === "reject") {
    const suggestionId = parseInt(formData.get("suggestionId") as string, 10);
    await rejectAiSuggestion(shop.id, suggestionId);
    return { success: null, error: null };
  }

  return { success: null, error: null };
}

const TABS = [
  { key: "pending", label: "Pending Review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function AiSuggestionsPage() {
  const { suggestions, creditBalance, tab } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const isAnalysing =
    isSubmitting && navigation.formData?.get("intent") === "analyse";

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-shopify-text">
            🤖 AI Bundle Suggestions
          </h1>
          <p className="text-shopify-text-subdued text-sm mt-1">
            AI analyses your product catalog and suggests thematic bundles based
            on customer use-cases.
          </p>
        </div>
        {/* Credit balance */}
        <div className="card text-center min-w-[120px]">
          <div className="text-2xl font-bold text-shopify-green">
            {creditBalance}
          </div>
          <div className="text-xs text-shopify-text-subdued">AI Credits</div>
        </div>
      </div>

      {/* Feedback banners */}
      {actionData?.success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm">
          ✅ {actionData.success}
        </div>
      )}
      {actionData?.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
          ❌ {actionData.error}
        </div>
      )}

      {/* Run Analysis */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-shopify-text">
              Analyse Product Catalog
            </h2>
            <p className="text-sm text-shopify-text-subdued mt-1">
              AI scans your active products and identifies thematic bundle
              opportunities — e.g. "Massage Therapist Bundle", "Home Office
              Setup". Costs <strong>1 credit</strong> per analysis run.
            </p>
          </div>
          <Form method="post" className="ml-6 flex-shrink-0">
            <input type="hidden" name="intent" value="analyse" />
            <button
              type="submit"
              disabled={isSubmitting || creditBalance < 1}
              className="btn btn-primary whitespace-nowrap"
            >
              {isAnalysing ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Analysing…
                </span>
              ) : (
                "✨ Run Analysis"
              )}
            </button>
          </Form>
        </div>
        {creditBalance < 1 && (
          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs">
            ⚠️ You have no AI credits. Purchase credits in Settings to run an
            analysis.
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="card mb-6 bg-shopify-surface border-dashed">
        <h3 className="font-semibold text-shopify-text mb-3">How it works</h3>
        <div className="grid grid-cols-4 gap-4 text-sm">
          {[
            { step: "1", icon: "🔍", title: "Catalog scan", desc: "AI reads your active product titles, types, tags, and descriptions" },
            { step: "2", icon: "🧠", title: "Theme detection", desc: "Identifies customer use-cases that span multiple products" },
            { step: "3", icon: "📦", title: "Bundle proposals", desc: "Suggests 3–8 thematic bundles with rationale for each" },
            { step: "4", icon: "✅", title: "You approve", desc: "Review each suggestion, approve to create the FBT group, or reject" },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="font-medium text-shopify-text mb-1">{item.title}</div>
              <div className="text-shopify-text-subdued text-xs">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-shopify-border">
        {TABS.map((t) => (
          <a
            key={t.key}
            href={`?tab=${t.key}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-shopify-green text-shopify-green"
                : "border-transparent text-shopify-text-subdued hover:text-shopify-text"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {/* Suggestions list */}
      {suggestions.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="text-4xl mb-4">
              {tab === "pending" ? "🔍" : tab === "approved" ? "✅" : "❌"}
            </div>
            <p className="empty-state-title">
              {tab === "pending"
                ? "No pending suggestions"
                : tab === "approved"
                ? "No approved bundles yet"
                : "No rejected suggestions"}
            </p>
            <p className="empty-state-description">
              {tab === "pending"
                ? "Run an analysis above to generate bundle suggestions from your product catalog."
                : ""}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((s) => (
            <div key={s.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Theme + AI badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-shopify-text text-base">
                      {s.theme}
                    </h3>
                    <span className="badge badge-neutral text-xs">
                      🤖 AI Generated
                    </span>
                    {s.status === "approved" && (
                      <span className="badge badge-success text-xs">✅ Approved</span>
                    )}
                    {s.status === "rejected" && (
                      <span className="badge badge-neutral text-xs">❌ Rejected</span>
                    )}
                  </div>

                  {/* Rationale */}
                  <p className="text-sm text-shopify-text-subdued mb-3">
                    {s.rationale}
                  </p>

                  {/* Product IDs */}
                  <div className="flex flex-wrap gap-2">
                    {s.productIds.map((pid) => (
                      <span
                        key={pid}
                        className={`text-xs px-2 py-1 rounded font-mono ${
                          pid === s.mainProductId
                            ? "bg-shopify-green text-white"
                            : "bg-shopify-surface text-shopify-text-subdued"
                        }`}
                      >
                        {pid === s.mainProductId ? "⚓ " : ""}
                        {pid.split("/").pop()}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-shopify-text-subdued mt-2">
                    ⚓ = anchor (main) product · others are FBT products
                  </p>
                </div>

                {/* Actions */}
                {s.status === "pending" && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Form method="post">
                      <input type="hidden" name="intent" value="approve" />
                      <input type="hidden" name="suggestionId" value={s.id} />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-primary text-sm w-full"
                      >
                        ✅ Approve
                      </button>
                    </Form>
                    <Form method="post">
                      <input type="hidden" name="intent" value="reject" />
                      <input type="hidden" name="suggestionId" value={s.id} />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-secondary text-sm w-full"
                      >
                        ❌ Reject
                      </button>
                    </Form>
                  </div>
                )}

                {s.status === "approved" && s.approvedGroupId && (
                  <a
                    href={`/app/products/${s.approvedGroupId}`}
                    className="btn btn-secondary text-sm flex-shrink-0"
                  >
                    View Group →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}