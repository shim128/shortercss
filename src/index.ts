import { loadConfig, type Config, type Ignores, type Processor } from "./config.ts";
import { Library } from "./utils/library.ts";

/**
 * Holds the processors and the class and id libraries shared by every file of a build. Run each file
 * through `processors[name](file, classLibrary, idLibrary)` for the processor bound to its extension.
 */
export default class ShorterCSS {
  readonly ignores: Ignores;
  readonly processors: Readonly<Record<string, Processor>>;
  /** File extensions handled by each processor, by processor name. */
  readonly bindings: Readonly<Record<string, readonly string[]>>;
  readonly classLibrary: Library;
  readonly idLibrary: Library;

  /**
   * @param config A config object, a path to a config file, or nothing to load
   * shortercss.config.{js,mjs,cjs,ts} from the current working directory.
   */
  constructor(config?: Config | string) {
    const resolved = typeof config === "object" ? config : loadConfig(config);
    // ensure processor names are set as expected
    this.ignores = { classes: [], ids: [], ...resolved.ignores };
    this.bindings = { css: ["css"], html: ["html"], ...resolved.bindings };
    this.processors = resolved.processors;
    this.classLibrary = new Library(this.ignores.classes);
    this.idLibrary = new Library(this.ignores.ids);
  }
}

// `require("shortercss")` returns the class itself (Node ≥ 22.12), as it did in 2.x.
export { ShorterCSS as "module.exports" };

export { defineConfig, loadConfig } from "./config.ts";
export type { Config, Ignores, Processor, ProcessorFunction } from "./config.ts";
export type { IgnorePattern } from "./utils/ignore-matcher.ts";
export { Library, type LibraryInstance } from "./utils/library.ts";
export { default as css } from "./processors/css.ts";
export { default as html } from "./processors/html.ts";
export { default as jsStrings } from "./processors/js-strings.ts";
export { default as removeUnused } from "./processors/remove-unused.ts";
