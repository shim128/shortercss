// Characterization of the 2.1.2 behavior on inputs it handles correctly. Refactors must keep these
// snapshots byte-identical; intentional behavior changes update them in a reviewed commit.
import { describe, expect, test } from "vitest";
import { fixture, fresh, mapping } from "./helpers.ts";
import { css, html, jsStrings, removeUnused, ShorterCSS } from "./impl.ts";

describe("README examples", () => {
  test("input → output table", () => {
    const { cl, il } = fresh();
    expect(css(".class-name { ... }", cl, il)).toBe(".a { ... }");
    expect(css(".another-class { ... }", cl, il)).toBe(".b { ... }");
    expect(css("#an-id { ... }", cl, il)).toBe("#a { ... }");
    expect(html('<div class="class-name"> ... </div>', cl, il)).toBe('<div class="a"> ... </div>');
    expect(jsStrings('document.getElementById("an-id")', cl, il)).toBe('document.getElementById("a")');
  });
});

describe("site fixture (gulp-shortercss order: css → html → js → remove-unused)", () => {
  const { cl, il } = fresh({ classes: ["keep-*"] });
  const cssOut = css(fixture("site.css"), cl, il);
  const htmlOut = html(fixture("page.html"), cl, il);
  const jsOut = jsStrings(fixture("app.js"), cl, il);
  const prunedCss = removeUnused(cssOut, cl, il);

  test("css", async () => {
    await expect(cssOut).toMatchFileSnapshot("./__snapshots__/site.out.css");
  });
  test("html", async () => {
    await expect(htmlOut).toMatchFileSnapshot("./__snapshots__/page.out.html");
  });
  test("js", async () => {
    await expect(jsOut).toMatchFileSnapshot("./__snapshots__/app.out.js");
  });
  test("remove-unused", async () => {
    await expect(prunedCss).toMatchFileSnapshot("./__snapshots__/site.pruned.css");
  });
  test("libraries", () => {
    expect({
      classes: mapping(cl),
      ids: mapping(il),
      unused: cl.getUnused(),
      stats: { classes: cl.stats(), ids: il.stats() },
    }).toMatchSnapshot();
  });
});

describe("config", () => {
  test("loads a config file by project-relative path with a leading slash", () => {
    const instance = new ShorterCSS("/test/fixtures/shortercss.config.cjs");
    expect(instance.ignores).toEqual({ classes: ["keep-*"], ids: ["app"] });
    expect(instance.bindings).toEqual({ css: ["css", "pcss"], html: ["html"] });
  });

  test("merges defaults for omitted ignores and bindings", () => {
    const instance = new ShorterCSS({ processors: {} });
    expect(instance.ignores).toEqual({ classes: [], ids: [] });
    expect(instance.bindings).toEqual({ css: ["css"], html: ["html"] });
  });

  test("throws when no config is given and none exists in the project root", () => {
    expect(() => new ShorterCSS()).toThrow();
  });

  test("ignored names are kept, including globs", () => {
    const { cl, il } = fresh({ classes: ["keep-*", "exact"] });
    expect(css(".keep-me{}\n.exact{}\n.other{}", cl, il)).toBe(".keep-me{}\n.exact{}\n.a{}");
  });
});
