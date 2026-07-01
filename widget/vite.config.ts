import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "FBTWidget",
      fileName: "fbt-widget",
      formats: ["iife"], // Self-executing for ScriptTag injection
    },
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // No external deps — fully self-contained bundle
        inlineDynamicImports: true,
      },
    },
    minify: "terser",
    sourcemap: false,
    target: "es2015", // Broad browser support
  },
});