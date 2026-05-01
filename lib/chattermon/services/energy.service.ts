// Energy regeneration. Pure logic + a tiny mutator.
// Not a class — services that don't carry state are simpler as functions.

import type { PlayerSnapshot } from "../persistence/snapshots";

export const ENERGY_MAX = 20;
export const ENERGY_REGEN_MS = 10 * 60 * 1000; // +1 every 10 min

export function refillEnergy(
  p: PlayerSnapshot,
  now = Date.now(),
): PlayerSnapshot {
  if (p.energy >= ENERGY_MAX) {
    return { ...p, energyUpdatedAt: now };
  }
  const elapsed = Math.max(0, now - p.energyUpdatedAt);
  const ticks = Math.floor(elapsed / ENERGY_REGEN_MS);
  if (ticks <= 0) return p;
  const newEnergy = Math.min(ENERGY_MAX, p.energy + ticks);
  return {
    ...p,
    energy: newEnergy,
    energyUpdatedAt: p.energyUpdatedAt + ticks * ENERGY_REGEN_MS,
  };
}

export function spendEnergy(
  p: PlayerSnapshot,
  cost = 1,
): PlayerSnapshot | null {
  if (p.energy < cost) return null;
  return { ...p, energy: p.energy - cost };
}

export function msUntilNextEnergy(p: PlayerSnapshot, now = Date.now()): number {
  if (p.energy >= ENERGY_MAX) return 0;
  return Math.max(0, p.energyUpdatedAt + ENERGY_REGEN_MS - now);
}
