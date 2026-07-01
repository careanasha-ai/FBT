import { prisma } from "~/db/client";
import type { AnalyticsEventInput } from "~/utils/validation";
import { daysAgo } from "~/utils/date";

// ─── Event Recording ──────────────────────────────────────────────────────────

/**
 * Record a single analytics event
 */
export async function recordEvent(
  shopId: number,
  input: AnalyticsEventInput
) {
  return prisma.analyticsEvent.create({
    data: {
      shopId,
      groupId: input.groupId,
      eventType: input.eventType,
      productId: input.productId,
      sessionId: input.sessionId,
      metadata: input.metadata ?? {},
    },
  });
}

// ─── Aggregations ─────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  views: number;
  clicks: number;
  addToCarts: number;
  purchases: number;
  clickRate: number;
  conversionRate: number;
}

/**
 * Get summary stats for a shop over a date range
 */
export async function getAnalyticsSummary(
  shopId: number,
  from: Date = daysAgo(30),
  to: Date = new Date()
): Promise<AnalyticsSummary> {
  const events = await prisma.analyticsEvent.groupBy({
    by: ["eventType"],
    where: {
      shopId,
      createdAt: { gte: from, lte: to },
    },
    _count: { eventType: true },
  });

  const counts: Record<string, number> = {};
  for (const e of events) {
    counts[e.eventType] = e._count.eventType;
  }

  const views = counts["view"] ?? 0;
  const clicks = counts["click"] ?? 0;
  const addToCarts = counts["add_to_cart"] ?? 0;
  const purchases = counts["purchase"] ?? 0;

  return {
    views,
    clicks,
    addToCarts,
    purchases,
    clickRate: views > 0 ? Math.round((clicks / views) * 100) : 0,
    conversionRate: views > 0 ? Math.round((addToCarts / views) * 100) : 0,
  };
}

/**
 * Get daily event counts for charting (last N days)
 */
export async function getDailyEventCounts(
  shopId: number,
  days = 30
): Promise<Array<{ date: string; views: number; addToCarts: number }>> {
  const from = daysAgo(days);

  const events = await prisma.analyticsEvent.findMany({
    where: {
      shopId,
      eventType: { in: ["view", "add_to_cart"] },
      createdAt: { gte: from },
    },
    select: { eventType: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by date
  const byDate: Record<string, { views: number; addToCarts: number }> = {};

  for (const event of events) {
    const date = event.createdAt.toISOString().split("T")[0];
    if (!byDate[date]) byDate[date] = { views: 0, addToCarts: 0 };
    if (event.eventType === "view") byDate[date].views++;
    if (event.eventType === "add_to_cart") byDate[date].addToCarts++;
  }

  return Object.entries(byDate).map(([date, counts]) => ({
    date,
    ...counts,
  }));
}

/**
 * Get top-performing FBT groups by add-to-cart events
 */
export async function getTopGroups(
  shopId: number,
  limit = 10,
  from: Date = daysAgo(30)
) {
  const results = await prisma.analyticsEvent.groupBy({
    by: ["groupId"],
    where: {
      shopId,
      eventType: "add_to_cart",
      groupId: { not: null },
      createdAt: { gte: from },
    },
    _count: { eventType: true },
    orderBy: { _count: { eventType: "desc" } },
    take: limit,
  });

  // Enrich with group details
  const groupIds = results
    .map((r) => r.groupId)
    .filter((id): id is number => id !== null);

  const groups = await prisma.fbtGroup.findMany({
    where: { id: { in: groupIds } },
    select: { id: true, productId: true, title: true },
  });

  const groupMap = new Map(groups.map((g) => [g.id, g]));

  return results.map((r) => ({
    group: r.groupId ? groupMap.get(r.groupId) : null,
    addToCarts: r._count.eventType,
  }));
}