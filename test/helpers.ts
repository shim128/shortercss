import { readFileSync } from "node:fs";
import ShorterCSS, {
  css,
  html,
  jsStrings,
  removeUnused,
  type Ignores,
  type Library,
  type LibraryInstance,
} from "../src/index.ts";

function fixture(name: string): string {
  return readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
}

/** A fresh instance with empty processors, so each test starts with empty libraries. */
export function fresh(ignores: Partial<Ignores> = {}): { instance: ShorterCSS; cl: Library; il: Library } {
  const instance = new ShorterCSS({ processors: {}, bindings: {}, ignores: { classes: [], ids: [], ...ignores } });
  return { instance, cl: instance.classLibrary, il: instance.idLibrary };
}

/** Full name → shortname, read without counting a use. */
export function mapping(library: LibraryInstance): Record<string, string> {
  return Object.fromEntries(library.getFullNames().map((name) => [name, library.declare(name)]));
}

interface Site {
  cl: Library;
  il: Library;
  cssOut: string;
  htmlOut: string;
  jsOut: string;
  prunedCss: string;
}

/** Runs the site fixture in gulp-shortercss order: css → html → js → remove-unused. `prepare` rewrites each file first. */
export function runSite(prepare: (source: string) => string = (source) => source): Site {
  const { cl, il } = fresh();
  const cssOut = css(prepare(fixture("site.css")), cl, il);
  const htmlOut = html(prepare(fixture("page.html")), cl, il);
  const jsOut = jsStrings(prepare(fixture("app.js")), cl, il);
  return { cl, il, cssOut, htmlOut, jsOut, prunedCss: removeUnused(cssOut, cl, il) };
}
