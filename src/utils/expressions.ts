// Test these live on https://regex101.com/ to make your life easier.

function stylesheetSelector(sigil: RegExp): RegExp {
  return new RegExp(/(?<!:\s*)/.source + sigil.source + /(-*_*[\w])+(?!(.)*;)/.source, "gi");
}

/**
 * Extracts the selector names to shorten from a match of one of the expressions below.
 *
 * Should match: `selector`, `-selector`, `_selector`, `selector0`.
 * Shouldn't match: `3selector`, `:selector`.
 */
export const selectorName: RegExp = /(-?[_a-zA-Z]+[_\w-]*)/g;

/**
 * Class and id selectors defined in a stylesheet.
 *
 * Should match: `.selector`, `#selector`.
 * Shouldn't match: `#e6e6e6;`, `body`, `#666`, `:pseudo`.
 */
export const classSelector: RegExp = stylesheetSelector(/\./);
export const idSelector: RegExp = stylesheetSelector(/#/);

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
