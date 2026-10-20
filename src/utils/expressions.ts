// Test these live on https://regex101.com/ to make your life easier.

/** CSS comments and quoted strings, which {@link mask} hides before selectors are replaced. */
export const cssCommentsAndStrings: RegExp = /\/\*[\s\S]*?\*\/|"(?:\\[\s\S]|[^"\\\n])*"|'(?:\\[\s\S]|[^'\\\n])*'/g;

// A selector is followed by `{` before any `;` or `}`, so declaration values (`url(a.png)`, `.5em`, `#fff`)
// never match, and it isn't part of an at-rule prelude (`@media (min-width: 40.5em)`, `@layer a.b`).
function stylesheetSelector(sigil: string): RegExp {
  return new RegExp(String.raw`(?<!@[^{};]*)` + sigil + String.raw`(-?[_a-zA-Z][\w-]*)(?=[^{};]*\{)`, "g");
}

/**
 * Extracts the selector names to shorten from a match of one of the expressions below.
 *
 * Should match: `selector`, `-selector`, `_selector`, `selector0`.
 * Shouldn't match: `3selector`, `:selector`.
 */
export const selectorName: RegExp = /(-?[_a-zA-Z]+[_\w-]*)/g;

/**
 * Class and id selectors defined in a stylesheet, minified or not, nested or not. The name is group 1.
 *
 * Should match: `.selector {`, `#selector{`, `a > .selector:hover,`, `:is(.selector) {`, `&.selector {`.
 * Shouldn't match: `color: #e6e6e6;`, `margin: 0 .5em}`, `url(img/bg.png)}`, `@media (min-width: 40.5em) {`.
 */
export const classSelector: RegExp = stylesheetSelector(String.raw`\.`);
export const idSelector: RegExp = stylesheetSelector("#");

/** An id reference in `url(#id)`, e.g. an SVG gradient or filter: `url(#` is group 1, the id group 2. */
export const urlIdReference: RegExp = /(url\(\s*["']?#)(-?[_a-zA-Z][\w-]*)/g;

/**
 * HTML class, id, for and aria-labelledby attributes, with or without spaces around `=`.
 *
 * Should match: `class="selector"`, `class="selector selector"`, `id="selector"`, `for="selector"`.
 * Shouldn't match: `name="selector"`, `href="selector"`.
 */
export const elementAttribute: RegExp = /(class|id|for|aria-labelledby)\s*=\s*["'](-*_*[\w\s])+["']/g;

/** A single id passed to `.getElementById(` or assigned to `.id =`. */
export const idList: RegExp = /\.(getElementById|id)\s*?[(|=]\s*?(["'])(-*_*[\w\s])+/g;

/**
 * A class passed to `.getElementsByClassName(` or `.classList.add/remove/toggle(`, or assigned to
 * `.className =`.
 */
export const classList: RegExp =
  /\.(getElementsByClassName|classList\.add|classList\.remove|classList\.toggle|className)\s*?[(|=]\s*?(["'])(-*_*[\w\s])+/g;

/** The selector string passed to `.querySelector(` or `.querySelectorAll(`, and the selectors inside it. */
export const querySelector: RegExp = /\.querySelector(All)?\s*?\(\s*?(["'])([#.]?-*_*[\w\s])+/g;
export const prefixedSelector: RegExp = /[#.](-*_*[\w])+/g;
