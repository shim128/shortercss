import type { Processor } from "../config.ts";
import { fragmentLink, scriptBody, selectorName, startTag, styleBody, tagAttribute } from "../utils/expressions.ts";
import { mask } from "../utils/mask.ts";
import css from "./css.ts";
import jsStrings from "./js-strings.ts";

/** Attributes whose values are class names, id references, or a same-document `#id` link. */
const attributeTargets = new Map<string, "class" | "id" | "fragment">([
  ["class", "class"],
  ["id", "id"],
  ["for", "id"],
  ["form", "id"],
  ["list", "id"],
  ["headers", "id"],
  ["popovertarget", "id"],
  ["commandfor", "id"],
  ["aria-activedescendant", "id"],
  ["aria-controls", "id"],
  ["aria-describedby", "id"],
  ["aria-details", "id"],
  ["aria-errormessage", "id"],
  ["aria-flowto", "id"],
  ["aria-labelledby", "id"],
  ["aria-owns", "id"],
  ["href", "fragment"],
  ["xlink:href", "fragment"],
]);

/**
 * Runs every inline script and style through the jsStrings and css processors, then replaces class names
 * and id references in the attributes of the remaining markup.
 */
const html: Processor = (file, classLibrary, idLibrary) => {
  // Masked so that the attribute pass can't match inside them, e.g. `el.id = "foo"` in a script.
  const scripts = mask(file, scriptBody, ([body]) => jsStrings(body, classLibrary, idLibrary));
  const styles = mask(scripts.text, styleBody, ([body]) => css(body, classLibrary, idLibrary));
  const markup = styles.text.replace(startTag, (tag) =>
    tag.replace(tagAttribute, (attribute, name: string, assign: string, value: string) => {
      switch (attributeTargets.get(name.toLowerCase())) {
        case "class":
          return name + assign + value.replace(selectorName, (selector) => classLibrary.use(selector));
        case "id":
          return name + assign + value.replace(selectorName, (selector) => idLibrary.use(selector));
        case "fragment":
          return name + assign + value.replace(fragmentLink, (_, hash: string, id: string) => hash + idLibrary.use(id));
        default:
          return attribute;
      }
    }),
  );
  return scripts.unmask(styles.unmask(markup));
};

export default html;
