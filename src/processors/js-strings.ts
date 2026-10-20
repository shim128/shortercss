import type { Processor } from "../config.ts";
import type { LibraryInstance } from "../utils/library.ts";
import {
  classListCall,
  classString,
  idString,
  prefixedSelector,
  selectorName,
  selectorString,
  stringLiteral,
} from "../utils/expressions.ts";

function mapNames(value: string, library: LibraryInstance): string {
  return value.replace(selectorName, (name) => library.use(name));
}

/**
 * Dumb search for selector strings passed to DOM methods and properties. This only works on libraries
 * which are fully built, and doesn't follow names built at runtime (concatenation, template literals).
 */
const jsStrings: Processor = (file, classLibrary, idLibrary) =>
  file
    // ids, e.g. getElementById("main"), el.id = "main"
    .replace(idString, (_, head: string, _quote: string, value: string) => head + mapNames(value, idLibrary))
    // space-separated classes, e.g. getElementsByClassName("card active"), el.className = "card"
    .replace(classString, (_, head: string, _quote: string, value: string) => head + mapNames(value, classLibrary))
    // every string argument, e.g. classList.add("card", "active"), classList.toggle("open", force)
    .replace(
      classListCall,
      (_, head: string, args: string) =>
        head +
        args.replace(
          stringLiteral,
          (_literal, quote: string, value: string) => quote + mapNames(value, classLibrary) + quote,
        ),
    )
    // prefixed ids and classes, e.g. querySelector(".nav > .item"), closest("#main")
    .replace(
      selectorString,
      (_, head: string, _quote: string, value: string) =>
        head +
        value.replace(prefixedSelector, (selector, sigil: string | undefined, name: string | undefined) =>
          sigil === undefined || name === undefined
            ? selector
            : sigil + (sigil === "#" ? idLibrary : classLibrary).use(name),
        ),
    );

export default jsStrings;
