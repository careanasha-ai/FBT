import { defineConfig } from "vite";
import { resolve } from "path";

/**
 * Widget build config — Theme App Extension version.
 *
 * Output goes to extensions/fbt-widget/assets/fbt-widget.js
 * Shopify CLI picks up assets from that directory and serves them
 * via Shopify's CDN on `shopify app deploy`.
 *
 * Format: IIFE — self-executing, no module system required.
 * No external dependencies — fully self-contained bundle.
 */
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "FBTWidget",
      fileName: () => "fbt-widget",
      formats: ["iife"],
    },
    outDir: resolve(__dirname, "../extensions/fbt-widget/assets"),
    emptyOutDir: false,       // Don't wipe the assets dir (Liquid block lives nearby)
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: "fbt-widget.js",
      },
    },
    minify: "esbuild",
    sourcemap: false,
    target: "es2015",         // Broad browser support for storefronts
  },
  resolve: {
    alias: {
      "~": resolve(__dirname, "src"),
    },
  },
});