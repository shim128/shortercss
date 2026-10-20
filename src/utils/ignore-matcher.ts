import { posix } from "node:path";

/**
 * A selector name to keep unminified: an exact name, a glob such as `js-*` or `{is,has}-*`, or a RegExp.
 * A leading `!` negates a glob.
 */
export type IgnorePattern = string | RegExp;

interface Rule {
  negated: boolean;
  test(name: string): boolean;
}

const globSyntax = /[*?[\]{}]/;

function toRule(pattern: IgnorePattern): Rule {
  if (typeof pattern !== "string") {
    // Drop stateful flags so repeated .test() calls don't depend on lastIndex.
    const regexp = new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, ""));
    return { negated: false, test: (name) => regexp.test(name) };
  }
  const negated = pattern.startsWith("!");
  const glob = negated ? pattern.slice(1) : pattern;
  // Plain names skip matchesGlob, which is still experimental before Node 22.20.
  if (!globSyntax.test(glob)) return { negated, test: (name) => name === glob };
  return { negated, test: (name) => posix.matchesGlob(name, glob) };
}

/**
 * Compiles ignore patterns into a predicate. Patterns apply in order, and a later `!pattern` re-includes
 * names that an earlier pattern ignored, the same semantics as multimatch.
 */
export function compileIgnores(patterns: readonly IgnorePattern[]): (name: string) => boolean {
  const rules = patterns.map(toRule);
  return (name) => {
    let ignored = false;
    for (const rule of rules) {
      // While not ignored only positive rules can apply; once ignored only negations can.
      if (rule.negated === ignored && rule.test(name)) ignored = !rule.negated;
    }
    return ignored;
  };
}
