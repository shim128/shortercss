import { defineConfig, type ViteUserConfig } from "vite-plus";

const generated = ["dist/**", "coverage/**", "test/fixtures/**", "test/__snapshots__/**"];

const config: ViteUserConfig = defineConfig({
  pack: {
    entry: ["src/index.ts", "src/processors/*.ts"],
    format: "esm",
    platform: "node",
    // Mirror src/ so the documented deep imports (shortercss/dist/processors/html.js) keep working.
    unbundle: true,
    fixedExtension: false,
    dts: { generator: "oxc" },
    publint: true,
  },
  test: {
    include: ["test/**/*.test.ts"],
    coverage: { provider: "v8", include: ["src/**"], thresholds: { lines: 95, branches: 90 } },
  },
  lint: {
    plugins: ["typescript", "unicorn", "import", "node", "vitest"],
    categories: { correctness: "error", suspicious: "error", perf: "warn" },
    ignorePatterns: generated,
    options: { typeAware: true, typeCheck: true },
  },
  fmt: {
    printWidth: 120,
    semi: true,
    singleQuote: false,
    trailingComma: "all",
    ignorePatterns: [...generated, "CHANGELOG.md", "pnpm-lock.yaml"],
  },
});

export default config;
