# ShorterCSS - An Open Source Solution for shortening/obfuscating CSS selectors

This project continues the idea of [gulp-selectors](https://github.com/cazzer/gulp-selectors/), and revives
[Matb85/shortercss](https://github.com/Matb85/shortercss).

> Minify those pesky selector names down to nothing. Minified selectors are applied consistently across every
> CSS, HTML and JavaScript file you run through the same instance.

| Input                                               | Output                                 |
| --------------------------------------------------- | -------------------------------------- |
| `.class-name { ... }`                               | `.a { ... }`                           |
| `.another-class { ... }`                            | `.b { ... }`                           |
| `#an-id { ... }`                                    | `#a { ... }`                           |
| `<div class="class-name"> ... </div>`               | `<div class="a"> ... </div>`           |
| `document.getElementById("an-id")`                  | `document.getElementById("a")`         |
| `document.querySelectorAll("#an-id > .class-name")` | `document.querySelectorAll("#a > .a")` |

_You're like: `.some-super-descriptive-selector-name {...}`, and it's like: `.a {...}`_

## Install

Requires Node.js 22.12 or later. The package isn't published to npm (the `shortercss` name belongs to the
original author); install a release tarball instead:

```sh
pnpm add -D https://github.com/shim128/shortercss/releases/download/v3.0.0/shortercss-3.0.0.tgz
```

## Usage

```js
import ShorterCSS, { css, html, jsStrings, removeUnused } from "shortercss";

const { classLibrary, idLibrary } = new ShorterCSS({ processors: { css, html, jsStrings } });

css(".some__class { color: red; }", classLibrary, idLibrary); // ".a { color: red; }"
html('<h1 class="some__class"></h1>', classLibrary, idLibrary); // '<h1 class="a"></h1>'
```

Use one instance for every file of a build. Run stylesheets first, then markup and scripts, and
`removeUnused` last, on the reduced stylesheets.

The package is an ES module. CommonJS works too, through Node's `require(esm)`: `require("shortercss")`
returns the class, as in 2.x, and the processors are available as subpaths:

```js
const ShorterCSS = require("shortercss");
const css = require("shortercss/processors/css").default;
```

### Config

Pass a config object to the constructor, a path to a config file, or nothing to load
`shortercss.config.{js,mjs,cjs,ts}` from the current working directory (`.ts` needs Node 22.18 or later):

```ts
// shortercss.config.ts
import { css, defineConfig, html, jsStrings } from "shortercss";

export default defineConfig({
  // the processors to use - html, css and jsStrings are built in, or write your own
  processors: { css, html, jsStrings },
  // file extensions per processor, for task runners; defaults to { css: ["css"], html: ["html"] }
  bindings: { html: ["html", "pug"], jsStrings: ["js"] },
  // names to keep as they are: exact names, globs or regular expressions; "!" re-includes a name
  ignores: {
    classes: ["js-*", /^is-/, "!js-renamed"],
    ids: ["app"],
  },
});
```

```js
const fromCwd = new ShorterCSS();
const fromPath = new ShorterCSS("config/shortercss.config.js"); // relative to the working directory
```

`defineConfig` only type-checks the config; for example, it rejects `bindings` for processors you didn't
configure. `loadConfig(path?, cwd?)` loads a config file without creating an instance.

### Processors

A processor is a function that maps the selector names in one file through the libraries:

```ts
type Processor = (file: string, classLibrary: LibraryInstance, idLibrary: LibraryInstance) => string;
```

| Processor      | Rewrites                                                                                                                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `css`          | class and id selectors, minified or not, nested or not; `url(#id)` references                                                                                                                                                                    |
| `html`         | `class` and id-reference attributes (`id`, `for`, `form`, `list`, `headers`, `popovertarget`, `commandfor`, `aria-labelledby`, `aria-describedby` and the other `aria-*` id references, `href="#id"`), and every inline `<script>` and `<style>` |
| `jsStrings`    | string literals passed to `getElementById`, `getElementsByClassName`, `querySelector(All)`, `closest`, `matches`, `classList.add/remove/toggle/contains/replace`, or assigned to `id`, `htmlFor`, `className`                                    |
| `removeUnused` | removes selectors of classes that stylesheets declare but no markup or script uses, and rules left without selectors                                                                                                                             |

Inside a processor, get shortnames from the libraries (`Library`, exported from the package):

```ts
interface LibraryInstance {
  declare(name: string): string; // shortname for a selector defined in a stylesheet
  use(name: string): string; // shortname for a selector used in markup or scripts (counts a use)
  has(name: string): boolean;
  getAll(): string[]; // all shortnames
  getUnused(): string[]; // shortnames declared but never used
  getFullNames(): string[];
  getSize(): number;
  stats(): { size: number; unused: number };
  /** @deprecated use declare() (dontCount = true) or use() */
  get(name: string, dontCount?: boolean): string;
}
```

Shortnames are never generated when an ignore pattern matches them, and never `ad`, `ads` or `adv`, which ad
blockers hide.

### Limitations

The built-in processors are regex-based and don't parse JavaScript or HTML. They don't follow names built at
runtime (string concatenation, template literals) or set with `setAttribute`, and don't handle escaped class
names such as Tailwind's `.md\:flex`, non-ASCII names, or selectors inside `@scope` and `@supports selector()`
preludes.

## Migrating from 2.x

- Node.js 22.12 or later, and the package is an ES module. `require("shortercss")` still returns the class.
- Only `shortercss`, `shortercss/processors/*` and the 2.x `shortercss/dist/processors/*.js` paths can be
  imported. Import `Library` and the processors from the package root.
- Config paths resolve from the current working directory instead of the project root found by
  `app-root-path`; the 2.x form with a leading slash (`"/config/shortercss.config.js"`) still works. Config
  files must export an object with `processors`.
- `Library#get(name, dontCount)` is deprecated in favor of `declare(name)` and `use(name)`. `_library` and
  `_ignores` are private, `size` is read-only, and `getSize()` counts entries.
- Output changes, all bug fixes: minified CSS is renamed; declaration values (`url(…)`, `.5em`) are left alone;
  id references and more DOM calls are mapped; class lists are split; inline scripts are no longer mapped twice;
  `removeUnused` no longer removes declarations shared with used selectors; the shortname sequence skips
  ignored and reserved names.

## Use ShorterCSS with a task runner/bundler

- [gulp-shortercss](https://github.com/Matb85/gulp-shortercss) (archived) depends on `shortercss@^2`; point it at
  this version with a pnpm override:

  ```yaml
  # pnpm-workspace.yaml
  overrides:
    shortercss: https://github.com/shim128/shortercss/releases/download/v3.0.0/shortercss-3.0.0.tgz
  ```

## Contributing

Sure, if you think you can improve this project, go ahead! Use [TypeScript][1] and follow the
[Conventional Commits specification][2].

```sh
pnpm install
pnpm check     # format, lint and type-check (Vite+)
pnpm test      # unit and characterization tests
pnpm build     # dist/ (vp pack)
pnpm test:dist # the built package as CommonJS and ES module consumers
pnpm release   # bump the version, update CHANGELOG.md and tag
```

Developing needs Node.js 22.18, 24.11 or later for the Vite+ toolchain. Upgrade `vite-plus` and
`@vitest/coverage-v8` together: the coverage provider must match the Vitest version that Vite+ bundles.

[1]: https://www.typescriptlang.org/
[2]: https://www.conventionalcommits.org/en/v1.0.0/
