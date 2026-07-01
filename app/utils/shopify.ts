/**
 * Shopify GID (Global ID) helpers and API formatters
 */

// ─── GID Helpers ──────────────────────────────────────────────────────────────

/**
 * Extract numeric ID from a Shopify GID
 * e.g. "gid://shopify/Product/1234567890" → "1234567890"
 */
export function parseGid(gid: string): string {
  const parts = gid.split("/");
  return parts[parts.length - 1];
}

/**
 * Build a Shopify GID from a resource type and numeric ID
 * e.g. ("Product", "1234567890") → "gid://shopify/Product/1234567890"
 */
export function buildGid(resource: string, id: string | number): string {
  return `gid://shopify/${resource}/${id}`;
}

/**
 * Extract the resource type from a Shopify GID
 * e.g. "gid://shopify/Product/1234567890" → "Product"
 */
export function getGidType(gid: string): string {
  const parts = gid.split("/");
  return parts[parts.length - 2] ?? "";
}

/**
 * Check if a string is a valid Shopify GID
 */
export function isValidGid(gid: string): boolean {
  return /^gid:\/\/shopify\/\w+\/\d+$/.test(gid);
}

// ─── Product Helpers ──────────────────────────────────────────────────────────

export interface ShopifyProductVariant {
  id: string;
  title: string;
  price: string;
  availableForSale: boolean;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  featuredImage?: {
    url: string;
    altText?: string;
  };
  priceRangeV2: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  variants?: {
    nodes: ShopifyProductVariant[];
  };
}

/**
 * Format a Shopify money amount for display
 */
export function formatMoney(amount: string, currencyCode: string): string {
  const num = parseFloat(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(num);
}

// ─── GraphQL Query Builders ───────────────────────────────────────────────────

export const PRODUCT_FRAGMENT = `
  fragment ProductFields on Product {
    id
    title
    handle
    featuredImage {
      url
      altText
    }
    priceRangeV2 {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    variants(first: 1) {
      nodes {
        id
        title
        price
        availableForSale
      }
    }
  }
`;

export const SEARCH_PRODUCTS_QUERY = `
  ${PRODUCT_FRAGMENT}
  query SearchProducts($query: String!, $first: Int!) {
    products(first: $first, query: $query) {
      nodes {
        ...ProductFields
      }
    }
  }
`;

export const GET_PRODUCTS_BY_IDS_QUERY = `
  ${PRODUCT_FRAGMENT}
  query GetProductsByIds($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        ...ProductFields
      }
    }
  }
`;