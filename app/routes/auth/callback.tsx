import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

import { shopify } from "~/services/shopify.server";
import { registerShop, dbSessionStorage } from "~/services/auth.server";
import { ensureScriptTag } from "~/services/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Complete OAuth flow
    const { session } = await shopify.auth.callback({
      rawRequest: request,
    });

    // Persist session to DB
    await dbSessionStorage.storeSession({
      id: session.id,
      shop: session.shop,
      state: session.state,
      isOnline: session.isOnline,
      scope: session.scope,
      expires: session.expires,
      accessToken: session.accessToken,
    });

    // Register shop in our DB
    await registerShop(
      session.shop,
      session.accessToken!,
      session.scope ?? ""
    );

    // Register ScriptTag for widget injection
    await ensureScriptTag(session.shop, session.accessToken!);

    // Redirect to admin dashboard
    throw redirect(`/app/dashboard?shop=${session.shop}`);
  } catch (error) {
    // Re-throw redirects
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
        <p className="text-shopify-text-subdued">Completing setup...</p>
      </div>
    </div>
  );
}