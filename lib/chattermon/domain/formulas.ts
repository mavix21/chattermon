// Pure functions: damage, capture, xp, level curve.

import type { Rng } from "./rng";

// XP curve: 20 * L^2 → cumulative ~25k at level 50.
export function xpToNext(level: number): number {
  return 20 * level * level;
}

export function totalXpForLevel(level: number): number {
  let n = 0;
  for (let l = 1; l < level; l++) n += xpToNext(l);
  return n;
}

// Defeat XP: base 10 + 5*foeLevel. Mutated foe doubles, capture matches defeat.
export function defeatXp(foeLevel: number, mutated: boolean): number {
  const base = 10 + 5 * foeLevel;
  return mutated ? base * 2 : base;
}

// Battle damage. STAB and type multipliers come from caller.
export interface DamageInput {
  level: number;
  power: number;
  attack: number;
  defense: number;
  stab: number;
  type: number;
  crit: number; // 1.0 or 1.5
  random: number; // 0.85..1.0 typically
}

export function computeDamage(d: DamageInput): number {
  const base =
    Math.floor(
      (((2 * d.level) / 5 + 2) *
        d.power *
        (d.attack / Math.max(1, d.defense))) /
        50,
    ) + 2;
  return Math.max(1, Math.floor(base * d.stab * d.type * d.crit * d.random));
}

// Capture chance (lure). hpPct in [0,1], lureMod (1, 1.6, ∞).
export function captureChance(
  hpPct: number,
  level: number,
  lureMod: number,
  mutated: boolean,
): number {
  if (!isFinite(lureMod)) return 1;
  const mut = mutated ? 0.5 : 1;
  const raw = (1 - hpPct) * lureMod * mut * (1 - level / 120);
  return Math.max(0.05, Math.min(0.95, raw));
}

export function rollCapture(
  rng: Rng,
  hpPct: number,
  level: number,
  lureMod: number,
  mutated: boolean,
): { caught: boolean; chance: number } {
  const chance = captureChance(hpPct, level, lureMod, mutated);
  return { caught: rng.next() < chance, chance };
}
