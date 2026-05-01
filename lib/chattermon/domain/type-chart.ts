import type { ChatterType } from "./types";

// Type effectiveness multipliers (attacker → defender).
// Anything not listed is x1. No immunities for v1.
const CHART: Partial<
  Record<ChatterType, Partial<Record<ChatterType, number>>>
> = {
  normal: { psychic: 0.5 },
  electric: { electric: 0.5, aqua: 2, plant: 0.5, flying: 2 },
  fire: { fire: 0.5, ice: 2, aqua: 0.5, plant: 2 },
  ice: { fire: 0.5, ice: 0.5, plant: 2, flying: 2 },
  aqua: { electric: 0.5, fire: 2, ice: 0.5, aqua: 0.5 },
  plant: { fire: 0.5, aqua: 2, plant: 0.5, flying: 0.5 },
  flying: { electric: 0.5, plant: 2 },
  psychic: { normal: 2, psychic: 0.5 },
};

export function typeMultiplier(atk: ChatterType, def: ChatterType): number {
  return CHART[atk]?.[def] ?? 1;
}

export const STAB_MULTIPLIER = 1.5;
