import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "named-icons": "src/named-icons.ts",
  },
  format: ["esm"],
  // dts generated separately (scripts/generate-dts.mjs) — tsup splitting
  // mangles exports to `A as FooIcon` and breaks IDE autocomplete.
  dts: false,
  sourcemap: false,
  clean: true,
  treeshake: true,
  splitting: true,
  external: ["react", "react-dom", "react/jsx-runtime"],
  outDir: "dist",
  target: "es2020",
});
