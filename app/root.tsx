import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { LinksFunction } from "react-router";

import appStyles from "./styles/app.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appStyles },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "Unknown error";
  return (
    <div className="min-h-screen flex items-center justify-center bg-shopify-surface">
      <div className="bg-white rounded-lg shadow p-8 max-w-md w-full">
        <h1 className="text-xl font-semibold text-red-600 mb-2">
          Something went wrong
        </h1>
        <p className="text-shopify-text-subdued text-sm">{message}</p>
      </div>
    </div>
  );
}