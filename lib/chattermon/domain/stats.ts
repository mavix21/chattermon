import type { StageKey, StatKey } from "./types";

// Plain stat block — used both as base stats (per species) and resolved
// stats (per Chattermon instance at a given level + nature + trait + …).
export interface Stats {
  hp: number;
  atk: number;
  def: number;
  foc: number;
  spd: number;
}

export type BaseStats = Stats;

export const ZERO_STATS: Stats = { hp: 0, atk: 0, def: 0, foc: 0, spd: 0 };

// In-battle ±6 stage modifiers (Pokémon-style).
export type Stages = Record<StageKey, number>;

export const ZERO_STAGES: Stages = { atk: 0, def: 0, foc: 0, spd: 0 };

export function clampStage(n: number): number {
  return Math.max(-6, Math.min(6, n));
}

export function stageMultiplier(stage: number): number {
  // 2/2, 2/3, 2/4, … and 3/2, 4/2, … like Pokémon.
  if (stage >= 0) return (2 + stage) / 2;
  return 2 / (2 - stage);
}

// Pokémon-style level scaling. No IV/EV layer.
export function statAtLevel(
  base: number,
  level: number,
  isHp: boolean,
): number {
  if (isHp) {
    return Math.floor((2 * base * level) / 100) + level + 10;
  }
  return Math.floor((2 * base * level) / 100) + 5;
}

export function baseToLevel(base: BaseStats, level: number): Stats {
  return {
    hp: statAtLevel(base.hp, level, true),
    atk: statAtLevel(base.atk, level, false),
    def: statAtLevel(base.def, level, false),
    foc: statAtLevel(base.foc, level, false),
    spd: statAtLevel(base.spd, level, false),
  };
}

export function applyMultipliers(
  stats: Stats,
  mults: Partial<Record<StatKey, number>>,
): Stats {
  return {
    hp: Math.round(stats.hp * (mults.hp ?? 1)),
    atk: Math.round(stats.atk * (mults.atk ?? 1)),
    def: Math.round(stats.def * (mults.def ?? 1)),
    foc: Math.round(stats.foc * (mults.foc ?? 1)),
    spd: Math.round(stats.spd * (mults.spd ?? 1)),
  };
}
