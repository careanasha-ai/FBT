import { prisma } from "~/db/client";
import type { FbtGroupInput } from "~/utils/validation";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FbtGroupWithProducts = Awaited<ReturnType<typeof getFbtGroup>>;
export type FbtGroupList = Awaited<ReturnType<typeof listFbtGroups>>;

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * List all FBT groups for a shop
 */
export async function listFbtGroups(shopId: number) {
  return prisma.fbtGroup.findMany({
    where: { shopId },
    include: {
      fbtProducts: { orderBy: { position: "asc" } },
      discountRule: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * Get a single FBT group by ID
 */
export async function getFbtGroup(groupId: number, shopId: number) {
  return prisma.fbtGroup.findFirst({
    where: { id: groupId, shopId },
    include: {
      fbtProducts: { orderBy: { position: "asc" } },
      discountRule: true,
    },
  });
}

/**
 * Get FBT group by main product ID (used by widget)
 */
export async function getFbtGroupByProduct(shopId: number, productId: string) {
  return prisma.fbtGroup.findFirst({
    where: { shopId, productId, isActive: true },
    include: {
      fbtProducts: { orderBy: { position: "asc" } },
      discountRule: true,
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Create a new FBT group with linked products
 */
export async function createFbtGroup(shopId: number, input: FbtGroupInput) {
  const { productId, title, isActive, fbtProductIds } = input;

  return prisma.fbtGroup.create({
    data: {
      shopId,
      productId,
      title,
      isActive: isActive ?? true,
      fbtProducts: {
        create: fbtProductIds.map((pid, index) => ({
          productId: pid,
          position: index,
        })),
      },
    },
    include: {
      fbtProducts: true,
      discountRule: true,
    },
  });
}

/**
 * Update an existing FBT group and replace its linked products
 */
export async function updateFbtGroup(
  groupId: number,
  shopId: number,
  input: FbtGroupInput
) {
  const { productId, title, isActive, fbtProductIds } = input;

  // Replace all FBT products atomically
  return prisma.$transaction(async (tx) => {
    await tx.fbtProduct.deleteMany({ where: { groupId } });

    return tx.fbtGroup.update({
      where: { id: groupId, shopId },
      data: {
        productId,
        title,
        isActive: isActive ?? true,
        updatedAt: new Date(),
        fbtProducts: {
          create: fbtProductIds.map((pid, index) => ({
            productId: pid,
            position: index,
          })),
        },
      },
      include: {
        fbtProducts: true,
        discountRule: true,
      },
    });
  });
}

/**
 * Toggle active status of an FBT group
 */
export async function toggleFbtGroup(groupId: number, shopId: number, isActive: boolean) {
  return prisma.fbtGroup.update({
    where: { id: groupId, shopId },
    data: { isActive, updatedAt: new Date() },
  });
}

/**
 * Delete an FBT group (cascades to products + discount rule)
 */
export async function deleteFbtGroup(groupId: number, shopId: number) {
  return prisma.fbtGroup.delete({
    where: { id: groupId, shopId },
  });
}