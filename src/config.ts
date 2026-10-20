import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { isAbsolute, resolve } from "node:path";
import type { IgnorePattern } from "./utils/ignore-matcher.ts";
import type { LibraryInstance } from "./utils/library.ts";

/** Rewrites one file's contents, mapping selector names through the class and id libraries. */
export type Processor = (file: string, classLibrary: LibraryInstance, idLibrary: LibraryInstance) => string;

/** @deprecated Renamed to {@link Processor}. */
export type ProcessorFunction = Processor;

/** Selector names to keep as they are. */
export interface Ignores {
  classes: readonly IgnorePattern[];
  ids: readonly IgnorePattern[];
}

export interface Config<P extends Record<string, Processor> = Record<string, Processor>> {
  /** Processors by name. */
  processors: P;
  /** File extensions each processor handles. Defaults to `{ css: ["css"], html: ["html"] }`. */
  bindings?: { readonly [K in keyof NoInfer<P>]?: readonly string[] };
  ignores?: Partial<Ignores>;
}

/** Returns the config unchanged; it exists to type-check it, e.g. that `bindings` only name configured processors. */
export function defineConfig<P extends Record<string, Processor>>(config: Config<P>): Config<P> {
  return config;
}

// Synchronous so that the ShorterCSS constructor can stay synchronous. Loads CommonJS, ES modules
// (require(esm), Node ≥ 22.12) and TypeScript files (type stripping, Node ≥ 22.18).
const load = createRequire(import.meta.url);

const defaultFiles = ["shortercss.config.js", "shortercss.config.mjs", "shortercss.config.cjs", "shortercss.config.ts"];

function resolveConfigPath(file: string | undefined, cwd: string): string {
  if (file === undefined) {
    const found = defaultFiles.map((name) => resolve(cwd, name)).find((path) => existsSync(path));
    if (found === undefined)
      throw new Error(`No shortercss config found in ${cwd} (looked for ${defaultFiles.join(", ")})`);
    return found;
  }
  // 2.x appended the path to the project root, so "/config.js" meant <root>/config.js.
  if (isAbsolute(file) && !existsSync(file)) return resolve(cwd, file.replace(/^[/\\]+/, ""));
  return resolve(cwd, file);
}

function isConfig(value: unknown): value is Config {
  return (
    typeof value === "object" &&
    value !== null &&
    "processors" in value &&
    typeof value.processors === "object" &&
    value.processors !== null
  );
}

/**
 * Loads a config file. Relative paths resolve from `cwd`. Without a path, the first existing
 * shortercss.config.{js,mjs,cjs,ts} in `cwd` is used.
 */
export function loadConfig(file?: string, cwd: string = process.cwd()): Config {
  const path = resolveConfigPath(file, cwd);
  const exported: unknown = load(path);
  // ES modules (and transpiled CommonJS) export the config as `default`.
  const config: unknown =
    typeof exported === "object" && exported !== null && "default" in exported ? exported.default : exported;
  if (!isConfig(config)) throw new TypeError(`${path} must export a config object with processors`);
  return config;
}
