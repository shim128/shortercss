// CRLF input must give the LF result with its line endings kept. CRLF is generated here, not committed: with `eol=lf`
// in .gitattributes, git stores a CRLF fixture as LF, and a test reading it would pass without testing anything.
import { describe, expect, test } from "vite-plus/test";
import { css, html, jsStrings, removeUnused, type Processor } from "../src/index.ts";
import { fresh, mapping, runSite } from "./helpers.ts";

const crlf = (text: string): string => text.replaceAll("\n", "\r\n");

function run(processor: Processor, source: string): string {
  const { cl, il } = fresh();
  return processor(source, cl, il);
}

/** `keep` and `keep2` are used in markup; `drop` isn't. */
function prune(stylesheet: string): string {
  const { cl, il } = fresh();
  const reduced = css(stylesheet, cl, il);
  html('<div class="keep keep2"></div>', cl, il);
  return removeUnused(reduced, cl, il);
}

test("the site fixture gives the LF result with CRLF kept", () => {
  const lf = runSite();
  const windows = runSite(crlf);
  expect(windows.cssOut).toBe(crlf(lf.cssOut));
  expect(windows.htmlOut).toBe(crlf(lf.htmlOut));
  expect(windows.jsOut).toBe(crlf(lf.jsOut));
  expect(windows.prunedCss).toBe(crlf(lf.prunedCss));
  expect(mapping(windows.cl)).toEqual(mapping(lf.cl));
  expect(mapping(windows.il)).toEqual(mapping(lf.il));
});

test("mixed line endings stay as they are", () => {
  expect(run(css, ".alpha {\r\n  x: y;\n}\r\n.beta {\n  x: y;\r\n}\n")).toBe(
    ".a {\r\n  x: y;\n}\r\n.b {\n  x: y;\r\n}\n",
  );
});

describe("constructs that span lines", () => {
  test.each([
    ".alpha,\n.beta {\n  x: y;\n}\n",
    ".alpha\n{\n  x: y;\n}\n",
    ".alpha\n.beta\n{}\n",
    ".parent {\n  & .kid\n  {\n    x: y;\n  }\n}\n",
    "/* multi\n line .fake { */\n.alpha {\n  x: y;\n}\n",
    '.alpha::before {\n  content: "x\\\n.fake{y";\n}\n.beta { x: y }\n',
    ".alpha::before {\n  content: 'x\\\n#fake{y';\n}\n",
    '.alpha {\n  background: url(\n    "a.png"\n  );\n}\n',
    ".shape {\n  fill: url(\n    #grad\n  );\n}\n",
    "@media\n  (min-width: 1px)\n{\n  .alpha { x: y }\n}\n",
  ])("css: %j", (source) => {
    expect(run(css, crlf(source))).toBe(crlf(run(css, source)));
  });

  test.each([
    '<div\n  class="one\n    two"\n  id="main"\n>\n</div>\n',
    '<a\n  href="#main"\n>x</a>\n',
    '<label\n  for = "main"\n>x</label>\n',
    '<td headers="a\n  b"></td>\n',
    '<script>\n  el.id = "x";\n</script>\n<style>\n.a {\n  x: y;\n}\n</style>\n',
    '<script\n  type="module"\n>\n  el.id = "x";\n</script\n>\n',
  ])("html: %j", (source) => {
    expect(run(html, crlf(source))).toBe(crlf(run(html, source)));
  });

  test.each([
    'el.classList.add(\n  "one",\n  "two",\n);\n',
    'document.querySelector(\n  ".a > .b"\n);\n',
    'document.getElementById(\n  "main"\n);\n',
    'el.className =\n  "card active";\n',
    'el.id =\n  "x";\n',
    'const s = "x\\\ny";\nel.id = "main";\n',
    'el.className = "a \\\nb";\n',
  ])("jsStrings: %j", (source) => {
    expect(run(jsStrings, crlf(source))).toBe(crlf(run(jsStrings, source)));
  });

  test.each([
    ".keep,\n.drop,\n.keep2 {\n  x: y;\n}\n",
    ".drop,\n.keep {\n  x: y;\n}\n",
    ".keep,\n.drop\n{\n  x: y;\n}\n",
    "/* license */\n.drop {\n  x: y;\n}\n.keep {\n  x: y;\n}\n",
    ".keep {\n  x: y;\n}\n\n.drop {\n  x: y;\n}\n\n.keep2 {\n  x: y;\n}\n",
    ".keep {\n  .drop {\n    x: y;\n  }\n  &.keep2 {\n    x: y;\n  }\n}\n",
    "@media print {\n  .drop {\n    x: y;\n  }\n}\n",
  ])("removeUnused: %j", (source) => {
    expect(prune(crlf(source))).toBe(crlf(prune(source)));
  });
});
