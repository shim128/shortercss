import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vite-plus/test";
import { css, defineConfig, html, loadConfig } from "../src/index.ts";

const fixtures = fileURLToPath(new URL("./fixtures/", import.meta.url));
const nodeVersion = process.versions.node.split(".").map(Number);
const hasTypeStripping = (nodeVersion[0] ?? 0) > 22 || (nodeVersion[0] === 22 && (nodeVersion[1] ?? 0) >= 18);

describe("loadConfig", () => {
  test("finds shortercss.config.* in cwd", () => {
    expect(loadConfig(undefined, fixtures).ignores).toEqual({ classes: ["keep-*"], ids: ["app"] });
  });

  test("loads ES module configs", () => {
    expect(loadConfig("config-esm/shortercss.config.js", fixtures).ignores).toEqual({ classes: ["from-esm"] });
  });

  test.runIf(hasTypeStripping)("loads TypeScript configs", () => {
    expect(loadConfig("config-ts/shortercss.config.ts", fixtures).ignores).toEqual({ classes: ["from-ts"] });
  });

  test("keeps 2.x leading-slash paths project-relative", () => {
    expect(loadConfig("/config-esm/shortercss.config.js", fixtures).ignores).toEqual({ classes: ["from-esm"] });
  });

  test("rejects modules that don't export a config", () => {
    expect(() => loadConfig("config-invalid/shortercss.config.js", fixtures)).toThrow(
      /must export a config object with processors/,
    );
  });

  test("says where it looked when there is no config", () => {
    expect(() => loadConfig(undefined, fileURLToPath(new URL(".", import.meta.url)))).toThrow(
      /No shortercss config found in .* \(looked for shortercss\.config\.js, /,
    );
  });
});

describe("defineConfig", () => {
  test("returns the config unchanged", () => {
    const config = { processors: { css, html }, bindings: { html: ["html", "htm"] } };
    expect(defineConfig(config)).toBe(config);
  });

  test("only accepts bindings for configured processors", () => {
    const config = defineConfig({
      processors: { css },
      // @ts-expect-error -- `scss` is not a configured processor
      bindings: { css: ["css"], scss: ["scss"] },
    });
    expect(Object.keys(config.bindings ?? {})).toEqual(["css", "scss"]);
  });
});
