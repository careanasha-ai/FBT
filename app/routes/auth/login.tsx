import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

import { shopify } from "~/services/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return new Response("Missing shop parameter", { status: 400 });
  }

  // Validate shop domain format
  if (!/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop)) {
    return new Response("Invalid shop domain", { status: 400 });
  }

  // Build OAuth authorization URL
  const sanitizedShop = shopify.utils.sanitizeShop(shop, true);
  if (!sanitizedShop) {
    return new Response("Invalid shop domain", { status: 400 });
  }

  const authRoute = await shopify.auth.begin({
    shop: sanitizedShop,
    callbackPath: "/auth/callback",
    isOnline: false,
    rawRequest: request,
  });

  throw redirect(authRoute);
}

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-shopify-surface">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shopify-green mx-auto mb-4" />
        <p className="text-shopify-text-subdued">Redirecting to Shopify...</p>
      </div>
    </div>
  );
}