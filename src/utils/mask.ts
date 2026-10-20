/** A placeholder left by {@link mask}, for composing patterns that must step over hidden parts. */
// oxlint-disable-next-line no-control-regex -- placeholders are delimited by NUL, which CSS and HTML don't contain
export const placeholder: RegExp = /\x00\d+:\d+\x00/;

export interface Masked {
  /** The source with every hidden part replaced by a placeholder. */
  text: string;
  /** Puts the hidden parts back. */
  unmask: (text: string) => string;
}

let maskId = 0;

/**
 * Hides the parts of `source` that the global `pattern` matches behind placeholders, so that later
 * replacements can't touch them, e.g. strings and comments in CSS or script bodies in HTML. `transform`
 * may rewrite each part before it is put back.
 */
export function mask(source: string, pattern: RegExp, transform?: (part: RegExpExecArray) => string): Masked {
  // Unique per call, so masks can be nested and unmasked in any order.
  const id = maskId++;
  const parts: string[] = [];
  let text = "";
  let last = 0;
  for (const part of source.matchAll(pattern)) {
    parts.push(transform ? transform(part) : part[0]);
    text += source.slice(last, part.index) + `\x00${id}:${parts.length - 1}\x00`;
    last = part.index + part[0].length;
  }
  text += source.slice(last);
  // \x00, not \0: "\0" followed by the id's digits would read as an octal escape.
  const restore = new RegExp(String.raw`\x00${id}:(\d+)\x00`, "g");
  return { text, unmask: (masked) => masked.replace(restore, (_, index: string) => parts[Number(index)] ?? "") };
}
