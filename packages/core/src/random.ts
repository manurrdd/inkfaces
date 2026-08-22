/**
 * Deterministic randomness.
 *
 * Every part of an avatar draws from its own stream, derived from the seed and
 * the part's own name. That isolation is the reason a new hairstyle can be
 * added without changing anybody's eyes: streams do not share state, so a draw
 * in one part can never shift the draws in another.
 */

/** FNV-1a. Small, fast, and stable across engines — which is all we need. */
export function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32: 32 bits of state, good distribution, four lines long. */
function mulberry32(state: number): () => number {
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Random {
  /** Uniform in [0, 1). */
  num(): number;
  /** Uniform in [min, max). */
  between(min: number, max: number): number;
  /** Uniform integer in [min, max], both ends included. */
  int(min: number, max: number): number;
  /** Uniform element of a non-empty list. */
  pick<T>(items: readonly T[]): T;
  /** True with probability `chance` (0 to 1). */
  chance(chance: number): boolean;
  /** Uniform in [-spread, spread). Reads better than `between(-x, x)` at call sites. */
  jitter(spread: number): number;
}

export function createRandom(seed: string): Random {
  const next = mulberry32(hash(seed));
  return {
    num: next,
    between: (min, max) => min + next() * (max - min),
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: <T,>(items: readonly T[]): T => items[Math.floor(next() * items.length)] as T,
    chance: (chance) => next() < chance,
    jitter: (spread) => (next() - 0.5) * 2 * spread,
  };
}

/**
 * The stream for one part of one avatar.
 *
 * `style` is the frozen style version. Bumping it re-rolls every avatar on
 * purpose; that is the only sanctioned way to change what existing seeds look
 * like.
 */
export function streamFor(seed: string, part: string, style: number): Random {
  return createRandom(`inkfaces/${style}/${part}/${seed}`);
}
