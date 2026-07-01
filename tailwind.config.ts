import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Shopify Polaris-aligned palette
        shopify: {
          green: "#008060",
          "green-dark": "#004c3f",
          surface: "#f6f6f7",
          border: "#e1e3e5",
          text: "#202223",
          "text-subdued": "#6d7175",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "San Francisco",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;