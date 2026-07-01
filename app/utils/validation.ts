import { z } from "zod";

import { DISCOUNT_TYPES, FBT_MAX_PRODUCTS, FBT_MIN_PRODUCTS } from "./constants";

// ─── FBT Group ────────────────────────────────────────────────────────────────

export const FbtGroupSchema = z.object({
  productId: z
    .string()
    .min(1, "Product is required")
    .regex(/^gid:\/\/shopify\/Product\/\d+$/, "Invalid Shopify product ID"),
  title: z.string().max(255).optional(),
  isActive: z.boolean().default(true),
  fbtProductIds: z
    .array(
      z.string().regex(/^gid:\/\/shopify\/Product\/\d+$/, "Invalid Shopify product ID")
    )
    .min(FBT_MIN_PRODUCTS, `At least ${FBT_MIN_PRODUCTS} FBT product required`)
    .max(FBT_MAX_PRODUCTS, `Maximum ${FBT_MAX_PRODUCTS} FBT products allowed`),
});

export type FbtGroupInput = z.infer<typeof FbtGroupSchema>;

// ─── Discount Rule ────────────────────────────────────────────────────────────

export const DiscountRuleSchema = z.object({
  discountType: z.enum([
    DISCOUNT_TYPES.PERCENTAGE,
    DISCOUNT_TYPES.FIXED,
    DISCOUNT_TYPES.NONE,
  ]),
  discountValue: z
    .number()
    .min(0, "Discount value must be positive")
    .max(100, "Percentage discount cannot exceed 100%")
    .default(0),
  minItems: z.number().int().min(2).max(10).default(2),
});

export type DiscountRuleInput = z.infer<typeof DiscountRuleSchema>;

// ─── Analytics Event ──────────────────────────────────────────────────────────

export const AnalyticsEventSchema = z.object({
  eventType: z.enum(["view", "click", "add_to_cart", "purchase"]),
  groupId: z.number().int().positive().optional(),
  productId: z.string().optional(),
  sessionId: z.string().max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type AnalyticsEventInput = z.infer<typeof AnalyticsEventSchema>;

// ─── Widget Config ────────────────────────────────────────────────────────────

export const WidgetConfigSchema = z.object({
  shop: z.string().min(1, "Shop domain is required"),
  product: z
    .string()
    .regex(/^gid:\/\/shopify\/Product\/\d+$/, "Invalid product GID"),
});

export type WidgetConfigInput = z.infer<typeof WidgetConfigSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse and validate form data with a Zod schema.
 * Returns { data, errors } — errors is null on success.
 */
export function parseFormData<T>(
  schema: z.ZodSchema<T>,
  formData: FormData
): { data: T | null; errors: Record<string, string> | null } {
  const raw = Object.fromEntries(formData.entries());
  const result = schema.safeParse(raw);

  if (result.success) {
    return { data: result.data, errors: null };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".");
    errors[key] = issue.message;
  }

  return { data: null, errors };
}