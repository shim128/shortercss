import { createRequire } from "node:module";

// Implementation under test. Phase 0: the 2.1.2 CommonJS build, which is the oracle for the snapshots.
const load = createRequire(import.meta.url);

export const ShorterCSS = load("../dist/index.js");
export const css = load("../dist/processors/css.js").default;
export const html = load("../dist/processors/html.js").default;
export const jsStrings = load("../dist/processors/js-strings.js").default;
export const removeUnused = load("../dist/processors/remove-unused.js").default;
