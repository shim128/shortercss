import type { Processor } from "../config.ts";
import { elementAttribute, selectorName } from "../utils/expressions.ts";
import css from "./css.ts";
import jsStrings from "./js-strings.ts";

/**
 * Replaces class, id, for and aria-labelledby attribute values, after running the inline script and
 * style through the jsStrings and css processors.
 */
const html: Processor = (file, classLibrary, idLibrary) =>
  file
    .replace(/<script>([\s\S]*?)<\/script>/im, (code) => jsStrings(code, classLibrary, idLibrary))
    .replace(/<style>([\s\S]*?)<\/style>/im, (code) => css(code, classLibrary, idLibrary))
    .replace(elementAttribute, (attribute) => {
      const [name = "", value = ""] = attribute.split("=");
      const library = /(id|for)/.test(name) ? idLibrary : classLibrary;
      return name + "=" + value.replace(selectorName, (selector) => library.use(selector));
    });

export default html;
