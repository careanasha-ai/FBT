/**
 * Widget utility helpers — Theme App Extension version.
 *
 * DOM traversal helpers (findInsertionPoint, findAddToCartForm) are removed.
 * The Liquid block handles placement — the widget renders into #fbt-widget-root.
 * ShopifyAnalytics.meta dependency is removed — productId comes from data attrs.
 */

/**
 * Generate a simple session ID for analytics tracking.
 * Persisted in sessionStorage so it survives page navigation within a session.
 */
export function getSessionId(): string {
  const key = "_fbt_sid";
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}