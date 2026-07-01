import { z } from "zod";

// ─── Constants ────────────────────────────────────────────────────────────────

export const BUNDLE_TYPES = ["fixed", "flexible", "volume"] as const;
export const DISPLAY_MODES = ["inline", "popup", "both"] as const;
export const DISCOUNT_TYPES = ["percentage", "fixed", "price", "none"] as const;
export const THRESHOLD_TYPES = ["cart_value", "item_count", "fbt_add"] as const;
export const GID_REGEX = /^gid:\/\/shopify\/\w+\/\d+$/;

const shopifyGid = z.string().regex(GID_REGEX, "Invalid Shopify GID");

// ─── Discount Tier ────────────────────────────────────────────────────────────

export const DiscountTierSchema = z.object({
  minItems: z.number().int().min(1).max(20),
  discountType: z.enum(DISCOUNT_TYPES),
  discountValue: z.number().min(0).max(100000),
  position: z.number().int().min(0).default(0),
});

export type DiscountTierInput = z.infer<typeof DiscountTierSchema>;

// ─── FBT Group ────────────────────────────────────────────────────────────────

export const FbtGroupSchema = z.object({
  productId: shopifyGid,
  title: z.string().max(255).optional(),
  bundleType: z.enum(BUNDLE_TYPES).default("fixed"),
  displayMode: z.enum(DISPLAY_MODES).default("inline"),
  minSelect: z.number().int().min(1).max(20).default(1),
  maxSelect: z.number().int().min(1).max(20).default(4),
  isActive: z.boolean().default(true),
  fbtProductIds: z
    .array(shopifyGid)
    .min(1, "At least 1 FBT product required")
    .max(12, "Maximum 12 FBT products allowed"),
  discountTiers: z.array(DiscountTierSchema).default([]),
}).refine(
  (d) => d.minSelect <= d.maxSelect,
  { message: "minSelect must be ≤ maxSelect", path: ["minSelect"] }
);

export type FbtGroupInput = z.infer<typeof FbtGroupSchema>;

// ─── Gift Rule ────────────────────────────────────────────────────────────────

export const GiftRuleSchema = z.object({
  name: z.string().min(1).max(255),
  thresholdType: z.enum(THRESHOLD_TYPES),
  thresholdValue: z.number().min(0),
  giftProductId: shopifyGid,
  giftVariantId: shopifyGid,
  giftTitle: z.string().max(255).optional(),
  giftImageUrl: z.string().url().optional().or(z.literal("")),
  maxPerOrder: z.number().int().min(1).max(10).default(1),
  showProgressBar: z.boolean().default(true),
  progressMessage: z
    .string()
    .max(500)
    .default("You're {amount} away from a free {gift}!"),
  isActive: z.boolean().default(true),
});

export type GiftRuleInput = z.infer<typeof GiftRuleSchema>;

// ─── Shop Settings ────────────────────────────────────────────────────────────

export const ShopSettingsSchema = z.object({
  freeShippingThreshold: z.number().min(0).nullable().optional(),
  currencyCode: z.string().length(3).default("USD"),
});

export type ShopSettingsInput = z.infer<typeof ShopSettingsSchema>;

// ─── AI Suggestion Review ─────────────────────────────────────────────────────

export const AiSuggestionReviewSchema = z.object({
  suggestionId: z.number().int().positive(),
  action: z.enum(["approve", "reject"]),
  // Optional overrides when approving
  title: z.string().max(255).optional(),
  discountTiers: z.array(DiscountTierSchema).optional(),
  displayMode: z.enum(DISPLAY_MODES).optional(),
});

export type AiSuggestionReviewInput = z.infer<typeof AiSuggestionReviewSchema>;

// ─── Analytics Event ──────────────────────────────────────────────────────────

export const AnalyticsEventSchema = z.object({
  eventType: z.enum([
    "view",
    "click",
    "add_to_cart",
    "purchase",
    "gift_unlocked",
    "popup_shown",
    "popup_dismissed",
  ]),
  groupId: z.number().int().positive().optional(),
  productId: z.string().optional(),
  sessionId: z.string().max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type AnalyticsEventInput = z.infer<typeof AnalyticsEventSchema>;

// ─── Widget Config ────────────────────────────────────────────────────────────

export const WidgetConfigSchema = z.object({
  shop: z.string().min(1),
  product: shopifyGid,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function parseFormData<T>(
  schema: z.ZodSchema<T>,
  formData: FormData
): { data: T | null; errors: Record<string, string> | null } {
  const raw = Object.fromEntries(formData.entries());
  const result = schema.safeParse(raw);

  if (result.success) return { data: result.data, errors: null };

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    errors[issue.path.join(".")] = issue.message;
  }
  return { data: null, errors };
}