import { readFileSync } from "node:fs";
import { ShorterCSS } from "./impl.ts";

export function fixture(name: string): string {
  return readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
}

/** A fresh instance with empty processors, so each test starts with empty libraries. */
export function fresh(ignores: { classes?: string[]; ids?: string[] } = {}) {
  const instance = new ShorterCSS({ processors: {}, bindings: {}, ignores: { classes: [], ids: [], ...ignores } });
  return { instance, cl: instance.classLibrary, il: instance.idLibrary };
}

/** Full name → shortname, read without counting a use. */
export function mapping(library: { getFullNames(): string[]; get(name: string, dontCount?: boolean): string }) {
  return Object.fromEntries(library.getFullNames().map((name) => [name, library.get(name, true)]));
}
