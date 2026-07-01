import type { LoaderFunctionArgs } from "react-router";

import { prisma } from "~/db/client";

export async function loader(_: LoaderFunctionArgs) {
  // Check DB connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    return new Response(
      JSON.stringify({ status: "error", db: "unreachable" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      status: "ok",
      db: "connected",
      timestamp: new Date().toISOString(),
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}