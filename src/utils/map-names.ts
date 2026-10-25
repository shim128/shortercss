import { listToken, plainName } from "./expressions.ts";
import type { LibraryInstance } from "./library.ts";

/** Maps every token of a space-separated list that is a plain name; other tokens stay as they are. */
export function mapNames(list: string, library: LibraryInstance): string {
  return list.replace(listToken, (token) => (plainName.test(token) ? library.use(token) : token));
}
