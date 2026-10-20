// Plain Node, no test runner: uses the built package as an ES module consumer.
import assert from "node:assert/strict";
import ShorterCSS, { css, defineConfig, html, jsStrings, Library, loadConfig, removeUnused } from "shortercss";
import htmlProcessor from "shortercss/processors/html";

assert.equal(htmlProcessor, html, "subpath and root export are the same module");
assert.equal(typeof loadConfig, "function");
assert.ok(new ShorterCSS({ processors: {} }).classLibrary instanceof Library);

const { processors, ignores } = defineConfig({ processors: { css, html, jsStrings }, ignores: { classes: ["js-*"] } });
const instance = new ShorterCSS({ processors, ignores });
const { classLibrary, idLibrary } = instance;

const stylesheet = css(
  ".card {\n  color: red;\n}\n.js-hook {\n  color: blue;\n}\n.unused {\n  color: green;\n}",
  classLibrary,
  idLibrary,
);
assert.equal(html('<div class="card js-hook"></div>', classLibrary, idLibrary), '<div class="a js-hook"></div>');
assert.equal(
  removeUnused(stylesheet, classLibrary, idLibrary),
  ".a {\n  color: red;\n}\n.js-hook {\n  color: blue;\n}",
);

console.log(`smoke.mjs ok (Node ${process.version})`);
