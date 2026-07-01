import { prisma } from "~/db/client";
import { adminGraphql } from "./shopify.server";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShopifyProductNode {
  id: string;
  title: string;
  description: string;
  productType: string;
  tags: string[];
  vendor: string;
  priceRangeV2: {
    minVariantPrice: { amount: string; currencyCode: string };
    maxVariantPrice: { amount: string; currencyCode: string };
  };
  featuredImage: { url: string } | null;
  variants: { nodes: Array<{ id: string; title: string; price: string }> };
}

export interface ThematicBundle {
  theme: string;           // e.g. "Massage Therapist Bundle"
  rationale: string;       // AI explanation
  mainProductId: string;   // anchor product GID
  productIds: string[];    // all product GIDs in the bundle (incl. main)
  confidence: number;      // 0–1
}

// ─── Credit Management ────────────────────────────────────────────────────────

export async function getAiCreditBalance(shopId: number): Promise<number> {
  const result = await prisma.aiCreditLedger.aggregate({
    where: { shopId },
    _sum: { delta: true },
  });
  return result._sum.delta ?? 0;
}

export async function debitAiCredits(
  shopId: number,
  amount: number,
  reason: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.aiCreditLedger.create({
    data: {
      shopId,
      delta: -amount,
      reason,
      metadata: metadata ?? {},
    },
  });
}

// ─── Product Catalog Fetch ────────────────────────────────────────────────────

const FETCH_PRODUCTS_QUERY = `
  query FetchProductsForAI($first: Int!, $after: String) {
    products(first: $first, after: $after, query: "status:active") {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        title
        description
        productType
        tags
        vendor
        priceRangeV2 {
          minVariantPrice { amount currencyCode }
          maxVariantPrice { amount currencyCode }
        }
        featuredImage { url }
        variants(first: 1) {
          nodes { id title price }
        }
      }
    }
  }
`;

/**
 * Fetch up to 250 active products from the shop's catalog.
 * Used as input to the AI bundle analysis.
 */
export async function fetchShopProducts(
  shopDomain: string,
  accessToken: string,
  limit = 250
): Promise<ShopifyProductNode[]> {
  const products: ShopifyProductNode[] = [];
  let cursor: string | null = null;
  const pageSize = Math.min(limit, 50);

  while (products.length < limit) {
    const data = await adminGraphql<{
      products: {
        pageInfo: { hasNextPage: boolean; endCursor: string };
        nodes: ShopifyProductNode[];
      };
    }>(shopDomain, accessToken, FETCH_PRODUCTS_QUERY, {
      first: pageSize,
      after: cursor,
    });

    products.push(...data.products.nodes);

    if (!data.products.pageInfo.hasNextPage) break;
    cursor = data.products.pageInfo.endCursor;
  }

  return products.slice(0, limit);
}

// ─── AI Bundle Analysis ───────────────────────────────────────────────────────

/**
 * Build the prompt for OpenAI.
 * We send a compact product catalog and ask for thematic bundle suggestions.
 */
function buildAnalysisPrompt(products: ShopifyProductNode[]): string {
  const catalog = products.map((p) => ({
    id: p.id,
    title: p.title,
    type: p.productType,
    tags: p.tags.slice(0, 10).join(", "),
    vendor: p.vendor,
    price: p.priceRangeV2.minVariantPrice.amount,
    description: p.description.slice(0, 200),
  }));

  return `You are a retail merchandising expert. Analyse the following product catalog and identify 3–8 thematic bundle opportunities.

A thematic bundle groups products that a specific type of customer or use-case would buy together — for example:
- "Massage Therapist Bundle" (massage oil, hot stones, table cover, bolster pillow)
- "Home Office Setup" (ergonomic chair, desk lamp, cable organiser, monitor stand)
- "New Runner Kit" (running shoes, socks, water bottle, armband)
- "Yoga Beginner Pack" (yoga mat, blocks, strap, water bottle)

Rules:
1. Each bundle must have 2–5 products from the catalog
2. One product is the "anchor" (main product customers are most likely browsing)
3. The theme name must be specific and customer-facing (not generic like "Bundle 1")
4. The rationale must explain WHY these products belong together from the customer's perspective
5. Only use product IDs from the catalog provided
6. Confidence score: 0.0–1.0 (how strongly these products belong together)
7. Return ONLY valid JSON — no markdown, no explanation outside the JSON

Product catalog:
${JSON.stringify(catalog, null, 2)}

Return this exact JSON structure:
{
  "bundles": [
    {
      "theme": "Bundle Name",
      "rationale": "Why these products belong together...",
      "mainProductId": "gid://shopify/Product/...",
      "productIds": ["gid://shopify/Product/...", "gid://shopify/Product/..."],
      "confidence": 0.85
    }
  ]
}`;
}

/**
 * Call OpenAI to analyse the product catalog and return thematic bundles.
 */
async function callOpenAI(prompt: string): Promise<ThematicBundle[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a retail merchandising expert. Always respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,       // Lower = more consistent, less creative
      max_tokens: 2000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI");

  const parsed = JSON.parse(content);
  return (parsed.bundles ?? []) as ThematicBundle[];
}

/**
 * Validate that all product IDs in a bundle exist in the catalog.
 */
function validateBundles(
  bundles: ThematicBundle[],
  validIds: Set<string>
): ThematicBundle[] {
  return bundles
    .map((b) => ({
      ...b,
      productIds: b.productIds.filter((id) => validIds.has(id)),
    }))
    .filter(
      (b) =>
        b.productIds.length >= 2 &&
        validIds.has(b.mainProductId) &&
        b.productIds.includes(b.mainProductId)
    );
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export interface AiAnalysisResult {
  suggestions: Array<{
    id: number;
    theme: string;
    rationale: string;
    mainProductId: string;
    productIds: string[];
    confidence: number;
    status: string;
  }>;
  creditsUsed: number;
  productsAnalysed: number;
}

/**
 * Run AI bundle analysis for a shop.
 * 1. Check credit balance
 * 2. Fetch product catalog
 * 3. Call OpenAI
 * 4. Validate + persist suggestions
 * 5. Debit credits
 */
export async function runAiBundleAnalysis(
  shopId: number,
  shopDomain: string,
  accessToken: string
): Promise<AiAnalysisResult> {
  // ── Credit check ──────────────────────────────────────────────────────────
  const balance = await getAiCreditBalance(shopId);
  if (balance < 1) {
    throw new Error("Insufficient AI credits. Please purchase more credits.");
  }

  // ── Fetch products ────────────────────────────────────────────────────────
  const products = await fetchShopProducts(shopDomain, accessToken);
  if (products.length < 3) {
    throw new Error(
      "Not enough active products to generate bundle suggestions (minimum 3 required)."
    );
  }

  // ── Build prompt + call AI ────────────────────────────────────────────────
  const prompt = buildAnalysisPrompt(products);
  const rawBundles = await callOpenAI(prompt);

  // ── Validate product IDs ──────────────────────────────────────────────────
  const validIds = new Set(products.map((p) => p.id));
  const validBundles = validateBundles(rawBundles, validIds);

  if (validBundles.length === 0) {
    throw new Error(
      "AI analysis did not produce valid bundle suggestions. Please try again."
    );
  }

  // ── Persist suggestions ───────────────────────────────────────────────────
  const saved = await prisma.$transaction(
    validBundles.map((b) =>
      prisma.aiSuggestion.create({
        data: {
          shopId,
          theme: b.theme,
          rationale: b.rationale,
          productIds: b.productIds,
          mainProductId: b.mainProductId,
          status: "pending",
          creditsUsed: 1,
        },
      })
    )
  );

  // ── Debit 1 credit for the analysis run ──────────────────────────────────
  await debitAiCredits(shopId, 1, "analysis", {
    productsAnalysed: products.length,
    bundlesGenerated: validBundles.length,
  });

  return {
    suggestions: saved.map((s, i) => ({
      id: s.id,
      theme: s.theme,
      rationale: s.rationale,
      mainProductId: s.mainProductId,
      productIds: s.productIds,
      confidence: validBundles[i]?.confidence ?? 0.8,
      status: s.status,
    })),
    creditsUsed: 1,
    productsAnalysed: products.length,
  };
}

// ─── Suggestion Queries ───────────────────────────────────────────────────────

export async function listAiSuggestions(
  shopId: number,
  status?: "pending" | "approved" | "rejected"
) {
  return prisma.aiSuggestion.findMany({
    where: { shopId, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAiSuggestion(shopId: number, suggestionId: number) {
  return prisma.aiSuggestion.findFirst({
    where: { id: suggestionId, shopId },
  });
}