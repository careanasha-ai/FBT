import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create a test shop
  const shop = await prisma.shop.upsert({
    where: { shopDomain: "dev-store.myshopify.com" },
    update: {},
    create: {
      shopDomain: "dev-store.myshopify.com",
      accessToken: "dev-access-token",
      scopes:
        "read_products,write_products,read_script_tags,write_script_tags,read_discounts,write_discounts,read_orders",
    },
  });

  console.log(`✅ Shop created: ${shop.shopDomain}`);

  // Create a test FBT group
  const group = await prisma.fbtGroup.upsert({
    where: {
      shopId_productId: {
        shopId: shop.id,
        productId: "gid://shopify/Product/1234567890",
      },
    },
    update: {},
    create: {
      shopId: shop.id,
      productId: "gid://shopify/Product/1234567890",
      title: "Running Shoes Bundle",
      isActive: true,
      fbtProducts: {
        create: [
          { productId: "gid://shopify/Product/2345678901", position: 0 },
          { productId: "gid://shopify/Product/3456789012", position: 1 },
        ],
      },
      discountRule: {
        create: {
          discountType: "percentage",
          discountValue: 10,
          minItems: 2,
        },
      },
    },
  });

  console.log(`✅ FBT group created: ${group.title}`);

  // Seed some analytics events
  await prisma.analyticsEvent.createMany({
    data: [
      {
        shopId: shop.id,
        groupId: group.id,
        eventType: "view",
        productId: "gid://shopify/Product/1234567890",
        sessionId: "sess_001",
      },
      {
        shopId: shop.id,
        groupId: group.id,
        eventType: "click",
        productId: "gid://shopify/Product/2345678901",
        sessionId: "sess_001",
      },
      {
        shopId: shop.id,
        groupId: group.id,
        eventType: "add_to_cart",
        productId: "gid://shopify/Product/1234567890",
        sessionId: "sess_001",
      },
    ],
  });

  console.log("✅ Analytics events seeded");
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });