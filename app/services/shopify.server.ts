import { shopifyApi, ApiVersion, LogSeverity } from "@shopify/shopify-api";
import "@shopify/shopify-api/adapters/node";

import { SHOPIFY_API_VERSION } from "~/utils/constants";

// ─── Shopify API Client ───────────────────────────────────────────────────────

export const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SHOPIFY_SCOPES!.split(","),
  hostName: process.env.SHOPIFY_APP_URL!.replace(/https?:\/\//, ""),
  hostScheme: process.env.NODE_ENV === "production" ? "https" : "http",
  apiVersion: SHOPIFY_API_VERSION as ApiVersion,
  isEmbeddedApp: true,
  logger: {
    level:
      process.env.NODE_ENV === "production"
        ? LogSeverity.Error
        : LogSeverity.Debug,
  },
});

// ─── Admin GraphQL Client Factory ─────────────────────────────────────────────

/**
 * Create an authenticated Admin API GraphQL client for a shop.
 */
export async function getAdminClient(shop: string, accessToken: string) {
  const session = shopify.session.customAppSession(shop);
  session.accessToken = accessToken;
  return new shopify.clients.Graphql({ session });
}

/**
 * Execute a GraphQL query against the Shopify Admin API.
 */
export async function adminGraphql<T = unknown>(
  shop: string,
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const client = await getAdminClient(shop, accessToken);
  const response = await client.request(query, { variables });

  if (response.errors) {
    throw new Error(
      `Shopify GraphQL error: ${JSON.stringify(response.errors)}`
    );
  }

  return response.data as T;
}

// ─── Product Search ───────────────────────────────────────────────────────────

const SEARCH_PRODUCTS_QUERY = `
  query SearchProducts($query: String!, $first: Int!) {
    products(first: $first, query: $query) {
      nodes {
        id
        title
        handle
        featuredImage { url altText }
        priceRangeV2 {
          minVariantPrice { amount currencyCode }
        }
        variants(first: 1) {
          nodes { id title price availableForSale }
        }
      }
    }
  }
`;

export async function searchProducts(
  shop: string,
  accessToken: string,
  query: string,
  first = 10
) {
  return adminGraphql<{
    products: { nodes: unknown[] };
  }>(shop, accessToken, SEARCH_PRODUCTS_QUERY, { query, first });
}