// Plain Node, no test runner: uses the built package the way CommonJS consumers of 2.x did (README
// examples, gulp-shortercss). Run after `pnpm build`, or against an installed tarball.
const assert = require("node:assert/strict");

const ShorterCSS = require("shortercss");
assert.equal(typeof ShorterCSS, "function", "require('shortercss') returns the class");

// Deep imports documented in the 2.x README
const css = require("shortercss/dist/processors/css.js").default;
const html = require("shortercss/dist/processors/html.js").default;
const jsStrings = require("shortercss/processors/js-strings").default;
for (const processor of [css, html, jsStrings]) assert.equal(typeof processor, "function");

// gulp-shortercss 2.1.4 compiled code: __importDefault(require("shortercss")).default, then extends it
function importDefault(mod) {
  // oxlint-disable-next-line no-underscore-dangle -- mirrors TypeScript's __importDefault helper
  return mod && mod.__esModule ? mod : { default: mod };
}
class GulpShorterCSS extends importDefault(require("shortercss")).default {
  run(path, contents) {
    const extension = path.split(".").pop();
    let reduced = contents;
    for (const binding in this.bindings) {
      if (this.bindings[binding].includes(extension)) {
        reduced = this.processors[binding](reduced, this.classLibrary, this.idLibrary);
      }
    }
    return reduced;
  }
}

const plugin = new GulpShorterCSS({ processors: { css, html, jsStrings }, bindings: { jsStrings: ["js"] } });
assert.equal(plugin.run("style.css", ".card {\n  color: red;\n}"), ".a {\n  color: red;\n}");
assert.equal(plugin.run("index.html", '<div class="card" id="main"></div>'), '<div class="a" id="a"></div>');
assert.equal(plugin.run("app.js", 'el.classList.add("card")'), 'el.classList.add("a")');
assert.deepEqual(plugin.classLibrary.stats(), { size: 1, unused: 0 });

console.log(`smoke.cjs ok (Node ${process.version})`);
