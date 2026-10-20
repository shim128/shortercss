import type { Processor } from "../config.ts";
import { classSelector, idSelector, selectorName } from "../utils/expressions.ts";

/**
 * Replaces class and id selectors with shortnames. Names are declared in the libraries without counting
 * a use, so that other file types can be reduced with them and unused ones can be removed.
 */
const css: Processor = (file, classLibrary, idLibrary) =>
  file
    .replace(classSelector, (selector) => selector.replace(selectorName, (name) => classLibrary.declare(name)))
    .replace(idSelector, (selector) => selector.replace(selectorName, (name) => idLibrary.declare(name)));

export default css;
