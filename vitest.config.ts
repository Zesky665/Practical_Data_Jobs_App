import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    // React's production CJS bundle strips React.act, which @testing-library/react
    // v16 needs. Force vitest to resolve React's development entry point (which
    // includes act) by adding the "development" condition. Vercel installs deps
    // with NODE_ENV=production so the production bundle is all that's on disk;
    // the "development" condition makes vitest pick the right CJS entry.
    conditions: ["development", "browser"],
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
});
