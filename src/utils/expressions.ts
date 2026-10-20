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

/** The body of every `<script>` and `<style>` element, whatever its attributes. */
export const scriptBody: RegExp = /(?<=<script\b[^>]*>)[\s\S]*?(?=<\/script\s*>)/gi;
export const styleBody: RegExp = /(?<=<style\b[^>]*>)[\s\S]*?(?=<\/style\s*>)/gi;

/** An HTML start tag with attributes. Quoted attribute values may contain `>`. */
export const startTag: RegExp = /<[a-zA-Z][^\s/>]*\s(?:[^>"']|"[^"]*"|'[^']*')*>/g;

/**
 * An attribute inside a start tag, with or without spaces around `=`: the name is group 1, ` = ` group 2,
 * and the value, quoted or not, group 3.
 *
 * Should match: `class="selector selector"`, `id='selector'`, `for=selector`.
 * Shouldn't match: `disabled`, the `id` in `data-id="selector"`.
 */
export const tagAttribute: RegExp = /(?<=\s)([^\s"'<>/=]+)(\s*=\s*)("[^"]*"|'[^']*'|[^\s"'=<>`]+)/g;

/** A same-document link, `#id` with or without quotes: `"#` is group 1, the id group 2. */
export const fragmentLink: RegExp = /^(["']?#)(-?[_a-zA-Z][\w-]*)(?=["']?$)/;

// The JS expressions match up to the opening quote as `head` and the string contents as `value`.

/** An id passed to `.getElementById(` or assigned to `.id` or `.htmlFor`. */
export const idString: RegExp =
  /(?<head>(?<!dataset)\.(?:getElementById\s*\(|(?:id|htmlFor)\s*=)\s*(?<quote>["']))(?<value>(?:\\.|(?!\k<quote>)[^\\\n])*)(?=\k<quote>)/g;

/** Space-separated classes passed to `.getElementsByClassName(` or assigned to `.className` (`=` or `+=`). */
export const classString: RegExp =
  /(?<head>\.(?:getElementsByClassName\s*\(|className\s*\+?=)\s*(?<quote>["']))(?<value>(?:\\.|(?!\k<quote>)[^\\\n])*)(?=\k<quote>)/g;

/** The arguments of `.classList.add/remove/toggle/contains/replace(`, as `args`. */
export const classListCall: RegExp =
  /(?<head>\.classList\.(?:add|remove|toggle|contains|replace)\s*\()(?<args>[^()]*)/g;

/** A single- or double-quoted string literal: the quote is group 1, the contents group 2. */
export const stringLiteral: RegExp = /(["'])((?:\\.|(?!\1)[^\\\n])*)\1/g;

/** A selector string passed to `.querySelector(`, `.querySelectorAll(`, `.closest(` or `.matches(`. */
export const selectorString: RegExp =
  /(?<head>\.(?:querySelector(?:All)?|closest|matches)\s*\(\s*(?<quote>["']))(?<value>(?:\\.|(?!\k<quote>)[^\\\n])*)(?=\k<quote>)/g;

/**
 * A class or id in a selector string: the sigil is group 1, the name group 2. Attribute selectors such
 * as `[href$=".pdf"]` match as a whole, without groups, so that they can be skipped.
 */
export const prefixedSelector: RegExp = /\[[^\]]*\]|([.#])(-?[_a-zA-Z][\w-]*)/g;
