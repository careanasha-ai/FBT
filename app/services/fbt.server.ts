import { prisma } from "~/db/client";
import type { FbtGroupInput } from "~/utils/validation";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FbtGroupFull = Awaited<ReturnType<typeof getFbtGroup>>;
export type FbtGroupList = Awaited<ReturnType<typeof listFbtGroups>>;

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function listFbtGroups(shopId: number) {
  return prisma.fbtGroup.findMany({
    where: { shopId },
    include: {
      fbtProducts: { orderBy: { position: "asc" } },
      discountTiers: { orderBy: { position: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getFbtGroup(groupId: number, shopId: number) {
  return prisma.fbtGroup.findFirst({
    where: { id: groupId, shopId },
    include: {
      fbtProducts: { orderBy: { position: "asc" } },
      discountTiers: { orderBy: { position: "asc" } },
    },
  });
}

export async function getFbtGroupByProduct(shopId: number, productId: string) {
  return prisma.fbtGroup.findFirst({
    where: { shopId, productId, isActive: true },
    include: {
      fbtProducts: { orderBy: { position: "asc" } },
      discountTiers: { orderBy: { position: "asc" } },
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createFbtGroup(shopId: number, input: FbtGroupInput) {
  return prisma.$transaction(async (tx) => {
    const group = await tx.fbtGroup.create({
      data: {
        shopId,
        productId: input.productId,
        title: input.title,
        bundleType: input.bundleType ?? "fixed",
        displayMode: input.displayMode ?? "inline",
        minSelect: input.minSelect ?? 1,
        maxSelect: input.maxSelect ?? 4,
        isActive: input.isActive ?? true,
        fbtProducts: {
          create: input.fbtProductIds.map((pid, i) => ({
            productId: pid,
            position: i,
            poolEligible: true,
          })),
        },
      },
    });

    if (input.discountTiers?.length) {
      await tx.discountTier.createMany({
        data: input.discountTiers.map((t, i) => ({
          groupId: group.id,
          minItems: t.minItems,
          discountType: t.discountType,
          discountValue: t.discountValue,
          position: i,
        })),
      });
    }

    return tx.fbtGroup.findUnique({
      where: { id: group.id },
      include: {
        fbtProducts: { orderBy: { position: "asc" } },
        discountTiers: { orderBy: { position: "asc" } },
      },
    });
  });
}

export async function updateFbtGroup(
  groupId: number,
  shopId: number,
  input: FbtGroupInput
) {
  return prisma.$transaction(async (tx) => {
    // Replace products
    await tx.fbtProduct.deleteMany({ where: { groupId } });
    // Replace discount tiers
    await tx.discountTier.deleteMany({ where: { groupId } });

    return tx.fbtGroup.update({
      where: { id: groupId, shopId },
      data: {
        productId: input.productId,
        title: input.title,
        bundleType: input.bundleType ?? "fixed",
        displayMode: input.displayMode ?? "inline",
        minSelect: input.minSelect ?? 1,
        maxSelect: input.maxSelect ?? 4,
        isActive: input.isActive ?? true,
        updatedAt: new Date(),
        fbtProducts: {
          create: input.fbtProductIds.map((pid, i) => ({
            productId: pid,
            position: i,
            poolEligible: true,
          })),
        },
        discountTiers: input.discountTiers?.length
          ? {
              create: input.discountTiers.map((t, i) => ({
                minItems: t.minItems,
                discountType: t.discountType,
                discountValue: t.discountValue,
                position: i,
              })),
            }
          : undefined,
      },
      include: {
        fbtProducts: { orderBy: { position: "asc" } },
        discountTiers: { orderBy: { position: "asc" } },
      },
    });
  });
}

export async function toggleFbtGroup(
  groupId: number,
  shopId: number,
  isActive: boolean
) {
  return prisma.fbtGroup.update({
    where: { id: groupId, shopId },
    data: { isActive, updatedAt: new Date() },
  });
}

export async function deleteFbtGroup(groupId: number, shopId: number) {
  return prisma.fbtGroup.delete({ where: { id: groupId, shopId } });
}

// ─── AI Group Creation ────────────────────────────────────────────────────────

export async function createFbtGroupFromAiSuggestion(
  shopId: number,
  suggestionId: number,
  overrides?: {
    title?: string;
    displayMode?: string;
    discountTiers?: Array<{
      minItems: number;
      discountType: string;
      discountValue: number;
      position: number;
    }>;
  }
) {
  const suggestion = await prisma.aiSuggestion.findFirst({
    where: { id: suggestionId, shopId, status: "pending" },
  });

  if (!suggestion) throw new Error("Suggestion not found or already reviewed");

  return prisma.$transaction(async (tx) => {
    const group = await tx.fbtGroup.create({
      data: {
        shopId,
        productId: suggestion.mainProductId,
        title: overrides?.title ?? suggestion.theme,
        bundleType: "fixed",
        displayMode: (overrides?.displayMode ?? "inline") as string,
        minSelect: 2,
        maxSelect: suggestion.productIds.length,
        isActive: true,
        aiGenerated: true,
        aiTheme: suggestion.theme,
        aiRationale: suggestion.rationale,
        fbtProducts: {
          create: suggestion.productIds
            .filter((id) => id !== suggestion.mainProductId)
            .map((pid, i) => ({
              productId: pid,
              position: i,
              poolEligible: true,
            })),
        },
        discountTiers: overrides?.discountTiers?.length
          ? {
              create: overrides.discountTiers,
            }
          : undefined,
      },
    });

    await tx.aiSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: "approved",
        approvedGroupId: group.id,
        reviewedAt: new Date(),
      },
    });

    return group;
  });
}

export async function rejectAiSuggestion(shopId: number, suggestionId: number) {
  return prisma.aiSuggestion.update({
    where: { id: suggestionId, shopId },
    data: { status: "rejected", reviewedAt: new Date() },
  });
}