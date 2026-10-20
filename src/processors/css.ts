import type { Processor } from "../config.ts";
import { classSelector, cssCommentsAndStrings, idSelector, urlIdReference } from "../utils/expressions.ts";
import { mask } from "../utils/mask.ts";

/**
 * Replaces class and id selectors with shortnames. Names are declared in the libraries without counting
 * a use, so that other file types can be reduced with them and unused ones can be removed. `url(#id)`
 * references count as uses of the id.
 */
const css: Processor = (file, classLibrary, idLibrary) => {
  // Comments and strings can contain anything, e.g. `content: ".a{"` or `[href$=".pdf"]`.
  const { text, unmask } = mask(file, cssCommentsAndStrings);
  const reduced = text
    .replace(classSelector, (_, name: string) => "." + classLibrary.declare(name))
    .replace(idSelector, (_, name: string) => "#" + idLibrary.declare(name));
  return unmask(reduced).replace(urlIdReference, (_, url: string, name: string) => url + idLibrary.use(name));
};

export default css;
