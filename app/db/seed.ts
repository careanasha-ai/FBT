import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Shop ──────────────────────────────────────────────────────────────────
  const shop = await prisma.shop.upsert({
    where: { shopDomain: "dev-store.myshopify.com" },
    update: {},
    create: {
      shopDomain: "dev-store.myshopify.com",
      accessToken: "dev-access-token",
      scopes: "read_products,write_products,read_discounts,write_discounts,read_orders",
    },
  });
  console.log(`✅ Shop: ${shop.shopDomain}`);

  // ── Shop Settings ─────────────────────────────────────────────────────────
  await prisma.shopSettings.upsert({
    where: { shopId: shop.id },
    update: {},
    create: {
      shopId: shop.id,
      freeShippingThreshold: 75,
      currencyCode: "USD",
    },
  });
  console.log("✅ Shop settings");

  // ── Fixed Bundle (tiered discount) ────────────────────────────────────────
  const fixedGroup = await prisma.fbtGroup.upsert({
    where: { shopId_productId: { shopId: shop.id, productId: "gid://shopify/Product/1000000001" } },
    update: {},
    create: {
      shopId: shop.id,
      productId: "gid://shopify/Product/1000000001",
      title: "Running Shoes Bundle",
      bundleType: "fixed",
      displayMode: "inline",
      minSelect: 1,
      maxSelect: 3,
      isActive: true,
      fbtProducts: {
        create: [
          { productId: "gid://shopify/Product/1000000002", position: 0, poolEligible: true },
          { productId: "gid://shopify/Product/1000000003", position: 1, poolEligible: true },
        ],
      },
      discountTiers: {
        create: [
          { minItems: 2, discountType: "percentage", discountValue: 10, position: 0 },
          { minItems: 3, discountType: "percentage", discountValue: 15, position: 1 },
        ],
      },
    },
  });
  console.log(`✅ Fixed bundle: ${fixedGroup.title}`);

  // ── Flexible Bundle ───────────────────────────────────────────────────────
  const flexGroup = await prisma.fbtGroup.upsert({
    where: { shopId_productId: { shopId: shop.id, productId: "gid://shopify/Product/2000000001" } },
    update: {},
    create: {
      shopId: shop.id,
      productId: "gid://shopify/Product/2000000001",
      title: "Build Your Skincare Routine",
      bundleType: "flexible",
      displayMode: "inline",
      minSelect: 2,
      maxSelect: 3,
      isActive: true,
      fbtProducts: {
        create: [
          { productId: "gid://shopify/Product/2000000002", position: 0, poolEligible: true },
          { productId: "gid://shopify/Product/2000000003", position: 1, poolEligible: true },
          { productId: "gid://shopify/Product/2000000004", position: 2, poolEligible: true },
          { productId: "gid://shopify/Product/2000000005", position: 3, poolEligible: true },
        ],
      },
      discountTiers: {
        create: [
          { minItems: 2, discountType: "percentage", discountValue: 10, position: 0 },
          { minItems: 3, discountType: "percentage", discountValue: 20, position: 1 },
        ],
      },
    },
  });
  console.log(`✅ Flexible bundle: ${flexGroup.title}`);

  // ── AI-Generated Bundle ───────────────────────────────────────────────────
  const aiGroup = await prisma.fbtGroup.upsert({
    where: { shopId_productId: { shopId: shop.id, productId: "gid://shopify/Product/3000000001" } },
    update: {},
    create: {
      shopId: shop.id,
      productId: "gid://shopify/Product/3000000001",
      title: "Massage Therapist Bundle",
      bundleType: "fixed",
      displayMode: "popup",
      minSelect: 2,
      maxSelect: 4,
      isActive: true,
      aiGenerated: true,
      aiTheme: "Massage Therapist Bundle",
      aiRationale:
        "These products are commonly purchased together by massage therapists: massage oil as the anchor, combined with hot stones, a massage table cover, and a bolster pillow. Together they form a complete professional setup.",
      fbtProducts: {
        create: [
          { productId: "gid://shopify/Product/3000000002", position: 0, poolEligible: true },
          { productId: "gid://shopify/Product/3000000003", position: 1, poolEligible: true },
          { productId: "gid://shopify/Product/3000000004", position: 2, poolEligible: true },
        ],
      },
      discountTiers: {
        create: [
          { minItems: 2, discountType: "percentage", discountValue: 12, position: 0 },
          { minItems: 4, discountType: "percentage", discountValue: 18, position: 1 },
        ],
      },
    },
  });
  console.log(`✅ AI bundle: ${aiGroup.title}`);

  // ── Gift With Purchase Rule ────────────────────────────────────────────────
  await prisma.giftRule.create({
    data: {
      shopId: shop.id,
      name: "Free Travel Pouch over $75",
      thresholdType: "cart_value",
      thresholdValue: 75,
      giftProductId: "gid://shopify/Product/9000000001",
      giftVariantId: "gid://shopify/ProductVariant/9000000001",
      giftTitle: "Travel Pouch",
      giftImageUrl: null,
      maxPerOrder: 1,
      showProgressBar: true,
      progressMessage: "You're {amount} away from a free {gift}!",
      isActive: true,
    },
  });
  console.log("✅ Gift rule: Free Travel Pouch over $75");

  // ── AI Suggestion (pending review) ────────────────────────────────────────
  await prisma.aiSuggestion.create({
    data: {
      shopId: shop.id,
      theme: "Home Office Setup Bundle",
      rationale:
        "Analysis of your product catalog identified a cluster of products frequently associated with home office setups: ergonomic chair, desk lamp, cable organiser, and monitor stand. Customers searching for one of these are highly likely to need the others.",
      productIds: [
        "gid://shopify/Product/4000000001",
        "gid://shopify/Product/4000000002",
        "gid://shopify/Product/4000000003",
        "gid://shopify/Product/4000000004",
      ],
      mainProductId: "gid://shopify/Product/4000000001",
      status: "pending",
      creditsUsed: 1,
    },
  });
  console.log("✅ AI suggestion: Home Office Setup Bundle (pending)");

  // ── AI Credit Ledger ──────────────────────────────────────────────────────
  await prisma.aiCreditLedger.create({
    data: {
      shopId: shop.id,
      delta: 10,
      reason: "purchase",
      metadata: { plan: "starter", credits: 10 },
    },
  });
  await prisma.aiCreditLedger.create({
    data: {
      shopId: shop.id,
      delta: -1,
      reason: "analysis",
      metadata: { suggestionTheme: "Home Office Setup Bundle" },
    },
  });
  console.log("✅ AI credit ledger (10 purchased, 1 used)");

  // ── Analytics Events ──────────────────────────────────────────────────────
  await prisma.analyticsEvent.createMany({
    data: [
      { shopId: shop.id, groupId: fixedGroup.id, eventType: "view",        productId: "gid://shopify/Product/1000000001", sessionId: "sess_001" },
      { shopId: shop.id, groupId: fixedGroup.id, eventType: "click",       productId: "gid://shopify/Product/1000000002", sessionId: "sess_001" },
      { shopId: shop.id, groupId: fixedGroup.id, eventType: "add_to_cart", productId: "gid://shopify/Product/1000000001", sessionId: "sess_001" },
      { shopId: shop.id, groupId: flexGroup.id,  eventType: "view",        productId: "gid://shopify/Product/2000000001", sessionId: "sess_002" },
      { shopId: shop.id, groupId: flexGroup.id,  eventType: "add_to_cart", productId: "gid://shopify/Product/2000000001", sessionId: "sess_002" },
      { shopId: shop.id, groupId: aiGroup.id,    eventType: "popup_shown", productId: "gid://shopify/Product/3000000001", sessionId: "sess_003" },
      { shopId: shop.id, groupId: aiGroup.id,    eventType: "add_to_cart", productId: "gid://shopify/Product/3000000001", sessionId: "sess_003" },
    ],
  });
  console.log("✅ Analytics events");

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });