import type { LoaderFunctionArgs } from "react-router";

import { buildWidgetConfig } from "~/services/widget.server";

/**
 * GET /api/widget?shop=xxx.myshopify.com&product=gid://shopify/Product/123
 *
 * Public endpoint — called by the storefront widget JS.
 * Returns FBT config JSON or 404 if no group found.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const product = url.searchParams.get("product");

  if (!shop || !product) {
    return new Response(
      JSON.stringify({ error: "Missing shop or product parameter" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  const config = await buildWidgetConfig(shop, product);

  if (!config) {
    return new Response(JSON.stringify({ found: false }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  return new Response(JSON.stringify({ found: true, config }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      // Cache for 60s on CDN edge
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}