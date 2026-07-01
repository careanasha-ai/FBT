import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

import { shopify } from "~/services/shopify.server";
import { registerShop, dbSessionStorage } from "~/services/auth.server";

/**
 * GET /auth/callback
 *
 * Completes the Shopify OAuth flow.
 * ScriptTag registration removed — widget is delivered via Theme App Extension.
 * The merchant activates the FBT block in their theme editor.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { session } = await shopify.auth.callback({
      rawRequest: request,
    });

    // Persist OAuth session to DB
    await dbSessionStorage.storeSession({
      id: session.id,
      shop: session.shop,
      state: session.state,
      isOnline: session.isOnline,
      scope: session.scope,
      expires: session.expires,
      accessToken: session.accessToken,
    });

    // Register shop record
    await registerShop(
      session.shop,
      session.accessToken!,
      session.scope ?? ""
    );

    // Redirect to admin dashboard
    throw redirect(`/app/dashboard?shop=${session.shop}`);
  } catch (error) {
    if (error instanceof Response) throw error;

    console.error("[Auth] OAuth callback failed:", error);
    return new Response("Authentication failed. Please try again.", {
      status: 500,
    });
  }
}

export default function AuthCallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-shopify-surface">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shopify-green mx-auto mb-4" />
        <p className="text-shopify-text-subdued">Completing setup…</p>
      </div>
    </div>
  );
}