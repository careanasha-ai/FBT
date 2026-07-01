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
    level: process.env.NODE_ENV === "production" ? LogSeverity.Error : LogSeverity.Debug,
  },
});

// ─── Admin GraphQL Client Factory ─────────────────────────────────────────────

/**
 * Create an authenticated Admin API GraphQL client for a shop
 */
export async function getAdminClient(shop: string, accessToken: string) {
  const session = shopify.session.customAppSession(shop);
  session.accessToken = accessToken;

  const client = new shopify.clients.Graphql({ session });
  return client;
}

/**
 * Execute a GraphQL query against the Shopify Admin API
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

// ─── ScriptTag Management ─────────────────────────────────────────────────────

const SCRIPT_TAG_QUERY = `
  query GetScriptTags {
    scriptTags(first: 10) {
      nodes {
        id
        src
        displayScope
      }
    }
  }
`;

const CREATE_SCRIPT_TAG_MUTATION = `
  mutation CreateScriptTag($input: ScriptTagInput!) {
    scriptTagCreate(input: $input) {
      scriptTag {
        id
        src
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const DELETE_SCRIPT_TAG_MUTATION = `
  mutation DeleteScriptTag($id: ID!) {
    scriptTagDelete(id: $id) {
      deletedScriptTagId
      userErrors {
        field
        message
      }
    }
  }
`;

/**
 * Ensure the FBT widget script tag is registered for a shop.
 * Idempotent — won't create duplicates.
 */
export async function ensureScriptTag(
  shop: string,
  accessToken: string
): Promise<void> {
  const widgetUrl = `${process.env.WIDGET_CDN_URL}/fbt-widget.js`;

  const data = await adminGraphql<{
    scriptTags: { nodes: Array<{ id: string; src: string }> };
  }>(shop, accessToken, SCRIPT_TAG_QUERY);

  const existing = data.scriptTags.nodes.find((tag) => tag.src === widgetUrl);
  if (existing) return; // Already registered

  await adminGraphql(shop, accessToken, CREATE_SCRIPT_TAG_MUTATION, {
    input: {
      src: widgetUrl,
      displayScope: "ONLINE_STORE",
    },
  });
}

/**
 * Remove the FBT widget script tag from a shop (on uninstall)
 */
export async function removeScriptTag(
  shop: string,
  accessToken: string
): Promise<void> {
  const widgetUrl = `${process.env.WIDGET_CDN_URL}/fbt-widget.js`;

  const data = await adminGraphql<{
    scriptTags: { nodes: Array<{ id: string; src: string }> };
  }>(shop, accessToken, SCRIPT_TAG_QUERY);

  const existing = data.scriptTags.nodes.find((tag) => tag.src === widgetUrl);
  if (!existing) return;

  await adminGraphql(shop, accessToken, DELETE_SCRIPT_TAG_MUTATION, {
    id: existing.id,
  });
}