import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Integration tests (*.itest.ts) hit the dev Postgres; kept out of `pnpm test`
// so the unit suite stays pure. Run with `pnpm test:integration` (DB must be up).
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      "server-only": fileURLToPath(new URL("./vitest.server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.itest.ts"],
    fileParallelism: false,
  },
});
