const alphabet = "abcdefghijklmnopqrstuvwxyz";

/**
 * Bijective base-26 name for a seed: 0 → "a", 25 → "z", 26 → "aa", 27 → "ab", …
 */
export function generateShortname(seed: number): string {
  if (!Number.isSafeInteger(seed) || seed < 0) throw new RangeError(`Seed must be a non-negative integer, got ${seed}`);
  // break the seed down if it is larger than the alphabet
  const prefix = seed >= alphabet.length ? generateShortname(Math.floor(seed / alphabet.length) - 1) : "";
  return prefix + alphabet.charAt(seed % alphabet.length);
}
