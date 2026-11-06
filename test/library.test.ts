import { describe, expect, test } from "vite-plus/test";
import { Library } from "../src/index.ts";
import { generateShortname } from "../src/utils/generate-shortname.ts";

describe("generateShortname", () => {
  test("counts in bijective base 26", () => {
    expect([0, 1, 25, 26, 27, 51, 52, 701, 702].map(generateShortname)).toEqual([
      "a",
      "b",
      "z",
      "aa",
      "ab",
      "az",
      "ba",
      "zz",
      "aaa",
    ]);
  });

  test("rejects seeds that aren't non-negative integers", () => {
    expect(() => generateShortname(-1)).toThrow(RangeError);
    expect(() => generateShortname(1.5)).toThrow(RangeError);
  });
});

describe("Library", () => {
  test("declare() doesn't count a use, use() does", () => {
    const library = new Library();
    expect(library.declare("used")).toBe("a");
    expect(library.declare("unused")).toBe("b");
    expect(library.use("used")).toBe("a");
    expect(library.getUnused()).toEqual(["b"]);
    expect(library.stats()).toEqual({ size: 2, unused: 1 });
    expect(library.size).toBe(2);
  });

  test("get(name, dontCount) delegates to declare() and use()", () => {
    const library = new Library();
    expect(library.get("x", true)).toBe("a");
    expect(library.getUnused()).toEqual(["a"]);
    expect(library.get("x")).toBe("a");
    expect(library.getUnused()).toEqual([]);
  });

  test("lists names and shortnames in insertion order", () => {
    const library = new Library();
    for (const name of ["one", "two", "three"]) library.declare(name);
    expect(library.getFullNames()).toEqual(["one", "two", "three"]);
    expect(library.getAll()).toEqual(["a", "b", "c"]);
    expect(library.has("two")).toBe(true);
    expect(library.has("four")).toBe(false);
  });

  test("keeps ignored names: exact, glob, RegExp, with ordered negation", () => {
    const library = new Library(["exact", "js-*", /^is-/g, "!js-renamed"]);
    // `is-open` twice: a /g RegExp that kept its lastIndex wouldn't match the second time.
    expect(["exact", "js-hook", "is-open", "is-open", "js-renamed"].map((name) => library.use(name))).toEqual([
      "exact",
      "js-hook",
      "is-open",
      "is-open",
      "a",
    ]);
    expect(library.getFullNames()).toEqual(["js-renamed"]);
  });

  test("a negation alone doesn't ignore anything", () => {
    expect(new Library(["!foo"]).use("foo")).toBe("a");
  });

  test.each([
    ["{is,has}-*", "has-open", "has-open"],
    ["{is,has}-*", "was-open", "a"],
    ["js-?", "js-a", "js-a"],
    ["js-?", "js-ab", "a"],
    ["[ab]-x", "b-x", "b-x"],
    ["[ab]-x", "c-x", "a"],
  ])("the ignore glob %s maps %s to %s", (glob, name, shortname) => {
    expect(new Library([glob]).use(name)).toBe(shortname);
  });
});
