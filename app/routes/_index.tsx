import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (shop) {
    // Shopify is redirecting to our app — start OAuth
    throw redirect(`/auth/login?shop=${shop}`);
  }

  // No shop param — show a simple landing page
  return {};
}

export default function Index() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-shopify-surface">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-shopify-text mb-4">
          Frequently Bought Together
        </h1>
        <p className="text-shopify-text-subdued mb-8 max-w-md">
          Boost your average order value by showing customers products that are
          frequently bought together.
        </p>
        <p className="text-sm text-shopify-text-subdued">
          Install this app from the Shopify App Store to get started.
        </p>
      </div>
    </div>
  );
}