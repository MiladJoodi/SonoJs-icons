import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@sonojs/icons": path.resolve(rootDir, "src/index.ts"),
      "@sonojs/icons/icons": path.resolve(rootDir, "src/named-icons.ts"),
    },
  },
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "jsdom",
    globals: false,
    include: ["tests/**/*.{test,spec}.{ts,tsx,mjs}"],
  },
});
