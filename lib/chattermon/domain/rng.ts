// Tiny seedable RNG so battle outcomes can be reproduced/logged.
// Mulberry32 — one 32-bit state, fast, good enough for game randomness.

export interface Rng {
  next(): number; // [0, 1)
  int(maxExclusive: number): number;
  range(min: number, max: number): number; // inclusive ints
  pick<T>(items: readonly T[]): T;
  weighted<T>(items: readonly { value: T; weight: number }[]): T;
  chance(p: number): boolean;
}

export function createRng(seed: number = Date.now() >>> 0): Rng {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (n) => Math.floor(next() * n),
    range: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (items) => items[Math.floor(next() * items.length)] as never,
    weighted: (items) => {
      const total = items.reduce((acc, it) => acc + it.weight, 0);
      let r = next() * total;
      for (const it of items) {
        r -= it.weight;
        if (r < 0) return it.value;
      }
      return items[items.length - 1].value;
    },
    chance: (p) => next() < p,
  };
}
