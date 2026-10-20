import type { Processor } from "../config.ts";

/**
 * Removes the CSS rules of class shortnames that were declared but never used. Run it on CSS that the
 * css processor already reduced. This doesn't get anything with a secondary selector. Help my regex!
 */
const removeUnused: Processor = (file, classLibrary) => {
  let output = file;
  for (const selector of classLibrary.getUnused()) {
    const rule = new RegExp(String.raw`[,?\s*]\.` + selector + String.raw`\s*{[^}]*}`, "g");
    output = output.replace(rule, (match) =>
      // in a selector list only remove the selector, otherwise the whole declaration
      match.startsWith(",") ? match.replace(new RegExp(String.raw`[,?\s*]\.` + selector), "") : "",
    );
  }
  return output;
};

export default removeUnused;
