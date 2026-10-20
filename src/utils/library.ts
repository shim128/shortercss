import { generateShortname } from "./generate-shortname.ts";
import { compileIgnores, type IgnorePattern } from "./ignore-matcher.ts";

interface Entry {
  shortname: string;
  hits: number;
}

/**
 * Maps full selector names to shortnames and counts how often each name is used outside stylesheets.
 * One library holds classes, another ids; share them across every file of a build.
 */
export class Library {
  readonly #entries = new Map<string, Entry>();
  readonly #ignores: readonly IgnorePattern[];
  readonly #isIgnored: (name: string) => boolean;
  #seed = 0;

  constructor(ignores: readonly IgnorePattern[] = []) {
    this.#ignores = ignores;
    this.#isIgnored = compileIgnores(ignores);
  }

  /** Whether `name` already has a shortname. */
  has(name: string): boolean {
    return this.#entries.has(name);
  }

  /** Shortname for a selector defined in a stylesheet. Doesn't count as a use. */
  declare(name: string): string {
    return this.#lookup(name, false);
  }

  /** Shortname for a selector referenced from markup or scripts. Counts as a use. */
  use(name: string): string {
    return this.#lookup(name, true);
  }

  /** @deprecated Use {@link Library.declare} for `dontCount = true`, {@link Library.use} otherwise. */
  get(name: string, dontCount = false): string {
    return dontCount ? this.declare(name) : this.use(name);
  }

  /** All shortnames, in the order they were assigned. */
  getAll(): string[] {
    return Array.from(this.#entries.values(), (entry) => entry.shortname);
  }

  /** Shortnames that were declared but never used. */
  getUnused(): string[] {
    return Array.from(this.#entries.values())
      .filter((entry) => entry.hits === 0)
      .map((entry) => entry.shortname);
  }

  /** Number of shortnames generated so far, including ones skipped because they are ignored. */
  getSize(): number {
    return this.#seed;
  }

  get size(): number {
    return this.getSize();
  }

  /** All full selector names, in the order they were added. */
  getFullNames(): string[] {
    return Array.from(this.#entries.keys());
  }

  stats(): { size: number; unused: number } {
    return { size: this.getSize(), unused: this.getUnused().length };
  }

  #lookup(name: string, counts: boolean): string {
    const entry = this.#entries.get(name);
    if (entry) {
      if (counts) entry.hits++;
      return entry.shortname;
    }
    if (this.#isIgnored(name)) return name;

    let shortname: string;
    do shortname = generateShortname(this.#seed++);
    while (this.#ignores.includes(shortname));
    this.#entries.set(name, { shortname, hits: counts ? 1 : 0 });
    return shortname;
  }
}

/** The public surface of {@link Library}, for typing processors. */
export type LibraryInstance = Pick<
  Library,
  "has" | "declare" | "use" | "get" | "getAll" | "getUnused" | "getSize" | "size" | "getFullNames" | "stats"
>;
