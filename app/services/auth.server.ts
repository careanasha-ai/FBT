import { createCookieSessionStorage, redirect } from "react-router";

import { prisma } from "~/db/client";
import { shopify } from "./shopify.server";

// ─── Session Storage ──────────────────────────────────────────────────────────

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__fbt_session",
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secrets: [process.env.SESSION_SECRET!],
    secure: process.env.NODE_ENV === "production",
  },
});

// ─── Shopify Session Storage (DB-backed) ──────────────────────────────────────

export const dbSessionStorage = {
  async storeSession(session: {
    id: string;
    shop: string;
    state?: string;
    isOnline: boolean;
    scope?: string;
    expires?: Date;
    accessToken?: string;
    userId?: bigint;
  }) {
    await prisma.session.upsert({
      where: { id: session.id },
      update: {
        shop: session.shop,
        state: session.state,
        isOnline: session.isOnline,
        scope: session.scope,
        expires: session.expires,
        accessToken: session.accessToken,
        userId: session.userId,
      },
      create: session,
    });
    return true;
  },

  async loadSession(id: string) {
    const session = await prisma.session.findUnique({ where: { id } });
    return session ?? undefined;
  },

  async deleteSession(id: string) {
    await prisma.session.delete({ where: { id } }).catch(() => {});
    return true;
  },

  async deleteSessions(ids: string[]) {
    await prisma.session.deleteMany({ where: { id: { in: ids } } });
    return true;
  },

  async findSessionsByShop(shop: string) {
    return prisma.session.findMany({ where: { shop } });
  },
};

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

/**
 * Get the authenticated shop from the current request.
 * Redirects to /auth/login if not authenticated.
 */
export async function requireShop(request: Request) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    throw redirect("/auth/login");
  }

  const dbShop = await prisma.shop.findUnique({
    where: { shopDomain: shop },
  });

  if (!dbShop || !dbShop.accessToken || dbShop.uninstalledAt) {
    throw redirect(`/auth/login?shop=${shop}`);
  }

  return dbShop;
}

/**
 * Register a newly installed shop in the database.
 */
export async function registerShop(
  shopDomain: string,
  accessToken: string,
  scopes: string
) {
  return prisma.shop.upsert({
    where: { shopDomain },
    update: {
      accessToken,
      scopes,
      uninstalledAt: null,
    },
    create: {
      shopDomain,
      accessToken,
      scopes,
    },
  });
}

/**
 * Mark a shop as uninstalled.
 */
export async function uninstallShop(shopDomain: string) {
  await prisma.shop.update({
    where: { shopDomain },
    data: { uninstalledAt: new Date() },
  });

  // Clean up sessions
  await prisma.session.deleteMany({ where: { shop: shopDomain } });
}