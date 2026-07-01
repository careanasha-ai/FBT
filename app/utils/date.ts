/**
 * Date formatting and range utilities
 */

/**
 * Format a date for display
 */
export function formatDate(date: Date | string, locale = "en-US"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date | string, locale = "en-US"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Get start of day (UTC)
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day (UTC)
 */
export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/**
 * Get date N days ago
 */
export function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

/**
 * Common analytics date ranges
 */
export const DATE_RANGES = {
  LAST_7_DAYS: () => ({ from: daysAgo(7), to: new Date() }),
  LAST_30_DAYS: () => ({ from: daysAgo(30), to: new Date() }),
  LAST_90_DAYS: () => ({ from: daysAgo(90), to: new Date() }),
} as const;

export type DateRangeKey = keyof typeof DATE_RANGES;