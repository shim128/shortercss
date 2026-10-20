import type { Processor } from "../config.ts";
import { classList, idList, prefixedSelector, querySelector } from "../utils/expressions.ts";

/** Maps the part of `match` after its opening quote. */
function afterQuote(match: string, map: (rest: string) => string): string {
  const quote = match.search(/["']/) + 1;
  return match.slice(0, quote) + map(match.slice(quote));
}

/**
 * Dumb search for selector strings passed to DOM methods. This only works on libraries which are fully
 * built.
 */
const jsStrings: Processor = (file, classLibrary, idLibrary) =>
  file
    // methods that take a single id, e.g. getElementById
    .replace(idList, (match) => afterQuote(match, (name) => idLibrary.use(name)))
    // methods that take a single class, e.g. getElementsByClassName or classList.add
    .replace(classList, (match) => afterQuote(match, (name) => classLibrary.use(name)))
    // methods that take prefixed ids and classes, e.g. querySelector
    .replace(querySelector, (match) =>
      afterQuote(match, (selectors) =>
        selectors.replace(prefixedSelector, (selector) =>
          selector.startsWith("#") ? "#" + idLibrary.use(selector.slice(1)) : "." + classLibrary.use(selector.slice(1)),
        ),
      ),
    );

export default jsStrings;
