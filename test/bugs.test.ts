// Regression tests for the bugs found in the 2.1.2 review. Each asserts the correct behavior and stays
// `test.fails` until fixed, then becomes a plain `test`.
import { describe, expect, test } from "vite-plus/test";
import { fresh } from "./helpers.ts";
import { css, html, jsStrings, removeUnused, ShorterCSS } from "./impl.ts";

describe("css", () => {
  test("#1 renames selectors in minified CSS", () => {
    const { cl, il } = fresh();
    expect(css(".alpha{color:red;}.beta{color:blue;}", cl, il)).toBe(".a{color:red;}.b{color:blue;}");
  });

  test("#2 leaves declaration values alone", () => {
    const { cl, il } = fresh();
    expect(css(".hero{background:url(img/bg.png)}", cl, il)).toBe(".a{background:url(img/bg.png)}");
    expect(css(".box{margin:0 .5em}", cl, il)).toBe(".b{margin:0 .5em}");
  });

  test("#2 maps url(#id) references to the id library", () => {
    const { cl, il } = fresh();
    const out = html('<svg><linearGradient id="grad"></linearGradient></svg>', cl, il);
    expect(css(".shape{fill:url(#grad);}", cl, il)).toBe(".a{fill:url(#a);}");
    expect(css('.mask{mask:url("#grad")}', cl, il)).toBe('.b{mask:url("#a")}');
    expect(out).toBe('<svg><linearGradient id="a"></linearGradient></svg>');
  });

  test.each([
    ["@media (min-width:40.5em){.alpha{x:y}}", "@media (min-width:40.5em){.a{x:y}}"],
    ["@layer base.components{.alpha{x:y}}", "@layer base.components{.a{x:y}}"],
    [".alpha{background:url(a.png);.beta{x:y}&.gamma{x:y}}", ".a{background:url(a.png);.b{x:y}&.c{x:y}}"],
    [":is(.alpha,.beta) > #main:not(.gamma){x:y}", ":is(.a,.b) > #a:not(.c){x:y}"],
    ['a[href$=".pdf"]{x:y} /* .comment { */ .alpha{x:y}', 'a[href$=".pdf"]{x:y} /* .comment { */ .a{x:y}'],
    ['.alpha{content:".fake{"}', '.a{content:".fake{"}'],
    ["#fff{x:y}.alpha{color:#fff}", "#a{x:y}.a{color:#fff}"],
  ])("#2 only renames selectors: %s", (input, output) => {
    const { cl, il } = fresh();
    expect(css(input, cl, il)).toBe(output);
  });
});

describe("html", () => {
  test("#3 does not re-process script content with the attribute pass", () => {
    const { cl, il } = fresh();
    expect(html('<div id="foo"></div><script>el.id = "foo";</script>', cl, il)).toBe(
      '<div id="a"></div><script>el.id = "a";</script>',
    );
  });

  test("#4 maps id references (aria-*, href fragments) with the id library", () => {
    const { cl, il } = fresh();
    css(".x{a:b}\n.y{a:b}", cl, il);
    expect(html('<h2 id="title"></h2><div aria-labelledby="title"></div>', cl, il)).toBe(
      '<h2 id="a"></h2><div aria-labelledby="a"></div>',
    );
    expect(html('<p id="hint"></p><input aria-describedby="hint"><a href="#hint">?</a>', cl, il)).toBe(
      '<p id="b"></p><input aria-describedby="b"><a href="#b">?</a>',
    );
  });

  test("#5 ignores attributes that only end in class/id/for", () => {
    const { cl, il } = fresh();
    expect(html('<div data-id="user-42" class="card"></div>', cl, il)).toBe('<div data-id="user-42" class="a"></div>');
  });

  test("#6 processes every script block, with or without attributes", () => {
    const { cl, il } = fresh();
    expect(
      html('<script>a.getElementById("one")</script><script type="module">a.getElementById("two")</script>', cl, il),
    ).toBe('<script>a.getElementById("a")</script><script type="module">a.getElementById("b")</script>');
  });

  test.each([
    ["<div class=card id=main></div>", "<div class=a id=a></div>"],
    ['<div title="a > b" class="card"></div>', '<div title="a > b" class="a"></div>'],
    [
      '<style media="screen">.card { x: y; }</style><p CLASS="card">',
      '<style media="screen">.a { x: y; }</style><p CLASS="a">',
    ],
    [
      '<a href="https://example.com/#intro">x</a><a href="#">top</a>',
      '<a href="https://example.com/#intro">x</a><a href="#">top</a>',
    ],
    ['<p>Set id="foo" in the markup</p>', '<p>Set id="foo" in the markup</p>'],
    [
      '<td headers="a-col b-row"></td><svg><use xlink:href="#icon"/></svg>',
      '<td headers="a b"></td><svg><use xlink:href="#c"/></svg>',
    ],
  ])("#5 only rewrites class names and id references in start tags: %s", (input, output) => {
    const { cl, il } = fresh();
    expect(html(input, cl, il)).toBe(output);
  });
});

describe("library", () => {
  test("#7 handles names that exist on Object.prototype", () => {
    const { cl, il } = fresh();
    expect(css(".constructor{a:b}\n.toString{a:b}\n.normal{a:b}", cl, il)).toBe(".a{a:b}\n.b{a:b}\n.c{a:b}");
  });

  test("#8 never generates a shortname that an ignore pattern keeps", () => {
    const { cl, il } = fresh({ classes: ["a*"] });
    expect(css(".foo{x:y}\n.ab{x:y}\n.bar{x:y}", cl, il)).toBe(".b{x:y}\n.ab{x:y}\n.c{x:y}");
    expect(cl.getSize()).toBe(2);
  });

  test("#12 never emits ad-blocker-prone shortnames", () => {
    const { cl } = fresh();
    const names = Array.from({ length: 1000 }, (_, i) => cl.get(`c${i}`, true));
    expect(names.filter((name) => ["ad", "ads", "adv"].includes(name))).toEqual([]);
  });
});

describe("remove-unused", () => {
  test.fails("#9 removes only the unused selector from a selector list", () => {
    const { cl, il } = fresh();
    const out = css(".keep, .drop {margin:0}\n.drop2 {x:y}", cl, il);
    html('<div class="keep"></div>', cl, il);
    expect(removeUnused(out, cl, il).replace(/\s+/g, " ").trim()).toBe(".a {margin:0}");
  });
});

describe("js-strings", () => {
  test("#10 maps every selector in querySelector arguments", () => {
    const { cl, il } = fresh();
    expect(jsStrings('document.querySelector(".nav > .item")', cl, il)).toBe('document.querySelector(".a > .b")');
    expect(jsStrings('document.querySelectorAll("#an-id > .class-name")', cl, il)).toBe(
      'document.querySelectorAll("#a > .c")',
    );
  });

  test("#10 maps every argument of classList methods", () => {
    const { cl, il } = fresh();
    expect(jsStrings('el.classList.add("one", "two")', cl, il)).toBe('el.classList.add("a", "b")');
  });

  test("#13 splits space-separated class lists", () => {
    const { cl, il } = fresh();
    expect(jsStrings('el.className = "card active"', cl, il)).toBe('el.className = "a b"');
    expect(jsStrings('document.getElementsByClassName("card active")', cl, il)).toBe(
      'document.getElementsByClassName("a b")',
    );
  });

  test.each([
    ["label.htmlFor = \"email\"; input.id = 'email'", "label.htmlFor = \"a\"; input.id = 'a'"],
    ['el.dataset.id = "user-42"; if (el.id === "main") {}', 'el.dataset.id = "user-42"; if (el.id === "main") {}'],
    ['el.closest(".card"); el.matches("#main .item")', 'el.closest(".a"); el.matches("#a .b")'],
    ["document.querySelector('[data-file=\".pdf\"] .item')", "document.querySelector('[data-file=\".pdf\"] .a')"],
    [
      'el.classList.toggle("open", force); el.classList.replace("open", "closed")',
      'el.classList.toggle("a", force); el.classList.replace("a", "b")',
    ],
    ['el.className += " active"', 'el.className += " a"'],
    ["el.className = `card ${state}`", "el.className = `card ${state}`"],
  ])("#10 maps selector strings: %s", (input, output) => {
    const { cl, il } = fresh();
    expect(jsStrings(input, cl, il)).toBe(output);
  });
});

describe("config", () => {
  test("#11 resolves a config path relative to the project root", () => {
    const instance = new ShorterCSS("test/fixtures/shortercss.config.cjs");
    expect(instance.ignores).toEqual({ classes: ["keep-*"], ids: ["app"] });
  });
});
