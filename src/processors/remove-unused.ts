import type { Processor } from "../config.ts";
import { cssCommentsAndStrings } from "../utils/expressions.ts";
import { mask, placeholder } from "../utils/mask.ts";

/** A rule without nested rules: the prelude is group 1, the declarations group 2. */
const leafRule = /([^{};]+)\{([^{}]*)\}/g;
/** Whitespace and (masked) comments before a prelude's first selector. */
const leadingTrivia = new RegExp(String.raw`^(?:\s|${placeholder.source})*`);
const classToken = /\.(-?[_a-zA-Z][\w-]*)/g;

/** Splits a selector list on the commas that aren't inside parentheses, e.g. in `:is(.a, .b)`. */
function splitSelectorList(selectorList: string): string[] {
  const selectors: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < selectorList.length; i++) {
    const char = selectorList[i];
    if (char === "(") depth++;
    else if (char === ")") depth--;
    else if (char === "," && depth === 0) {
      selectors.push(selectorList.slice(start, i));
      start = i + 1;
    }
  }
  selectors.push(selectorList.slice(start));
  return selectors;
}

/**
 * Removes selectors that reference a class which was declared but never used, and rules left without
 * selectors. Run it on CSS that the css processor already reduced, after every other file.
 */
const removeUnused: Processor = (file, classLibrary) => {
  const unused = new Set(classLibrary.getUnused());
  if (unused.size === 0) return file;
  // `:not(.unused)` or `:is(.unused, .used)` can still match, so selectors with arguments are kept.
  const isDead = (selector: string): boolean =>
    !selector.includes("(") &&
    Array.from(selector.matchAll(classToken), ([, name]) => name ?? "").some((name) => unused.has(name));

  const { text, unmask } = mask(file, cssCommentsAndStrings);
  const pruned = text.replace(leafRule, (rule, prelude: string, declarations: string) => {
    const leading = leadingTrivia.exec(prelude)?.[0] ?? "";
    const selectorList = prelude.slice(leading.length);
    if (selectorList.startsWith("@")) return rule;

    const selectors = splitSelectorList(selectorList);
    const kept = selectors.filter((selector) => !isDead(selector));
    if (kept.length === selectors.length) return rule;
    // Keep comments before a removed rule, but not the whitespace that separated it from the previous one.
    if (kept.length === 0) return leading.trimEnd();

    const separator = "," + (/,(\s*)/.exec(selectorList)?.[1] ?? " ");
    const trailing = /\s*$/.exec(selectorList)?.[0] ?? "";
    return leading + kept.map((selector) => selector.trim()).join(separator) + trailing + "{" + declarations + "}";
  });
  return unmask(pruned);
};

export default removeUnused;
