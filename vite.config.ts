import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const packageSrc = path.resolve(rootDir, "src");

export default defineConfig({
  root: path.resolve(rootDir, "playground"),
  plugins: [
    react(),
    {
      // Playground `root` is nested — chokidar may miss generate:* writes under ../src.
      name: "watch-package-src",
      configureServer(server) {
        server.watcher.add(packageSrc);
      },
    },
  ],
  resolve: {
    alias: [
      {
        find: "@sonojs/icons/icons",
        replacement: path.resolve(rootDir, "src/named-icons.ts"),
      },
      {
        find: "@sonojs/icons",
        replacement: path.resolve(rootDir, "src/index.ts"),
      },
    ],
  },
  build: {
    outDir: path.resolve(rootDir, "playground/dist"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    open: false,
    watch: {
      ignored: ["**/node_modules/**", "**/dist/**"],
    },
    fs: {
      allow: [rootDir],
    },
  },
});
