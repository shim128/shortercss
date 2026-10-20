import { readFileSync } from "node:fs";
import type { Ignores, Library, LibraryInstance } from "../src/index.ts";
import { ShorterCSS } from "./impl.ts";

export function fixture(name: string): string {
  return readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
}

/** A fresh instance with empty processors, so each test starts with empty libraries. */
export function fresh(ignores: Partial<Ignores> = {}): { instance: ShorterCSS; cl: Library; il: Library } {
  const instance = new ShorterCSS({ processors: {}, bindings: {}, ignores: { classes: [], ids: [], ...ignores } });
  return { instance, cl: instance.classLibrary, il: instance.idLibrary };
}

/** Full name → shortname, read without counting a use. */
export function mapping(library: LibraryInstance): Record<string, string> {
  return Object.fromEntries(library.getFullNames().map((name) => [name, library.get(name, true)]));
}
