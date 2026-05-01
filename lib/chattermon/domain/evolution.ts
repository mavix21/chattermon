// Pluggable evolution triggers. Pattern: Strategy.
//
// A species declares an array of `EvolutionRule`s. The first rule whose
// trigger evaluates `true` wins. New trigger kinds are added by writing
// one class — no changes to the level-up service required.

import { Registry } from "../registry/registry";
import type { BiomeId, ItemId, SpeciesId } from "./types";

export interface EvolutionContext {
  level: number;
  biome: BiomeId;
  friendship: number;            // # of battles fought (proxy)
  itemUsed?: ItemId;              // present only when an item triggered the check
}

export interface EvolutionTrigger {
  readonly kind: string;
  evaluate(ctx: EvolutionContext): boolean;
  describe(): string;
}

export class LevelTrigger implements EvolutionTrigger {
  readonly kind = "level";
  constructor(private readonly minLevel: number) {}
  evaluate(ctx: EvolutionContext) { return ctx.level >= this.minLevel; }
  describe() { return `at level ${this.minLevel}`; }
}

export class ItemTrigger implements EvolutionTrigger {
  readonly kind = "item";
  constructor(private readonly itemId: ItemId) {}
  evaluate(ctx: EvolutionContext) { return ctx.itemUsed === this.itemId; }
  describe() { return `using ${this.itemId}`; }
}

export class BiomeLevelTrigger implements EvolutionTrigger {
  readonly kind = "biome+level";
  constructor(private readonly biome: BiomeId, private readonly minLevel: number) {}
  evaluate(ctx: EvolutionContext) {
    return ctx.biome === this.biome && ctx.level >= this.minLevel;
  }
  describe() { return `level ${this.minLevel} in ${this.biome}`; }
}

export class FriendshipTrigger implements EvolutionTrigger {
  readonly kind = "friendship";
  constructor(private readonly minBattles: number) {}
  evaluate(ctx: EvolutionContext) { return ctx.friendship >= this.minBattles; }
  describe() { return `after ${this.minBattles} battles together`; }
}

export interface EvolutionRule {
  trigger: EvolutionTrigger;
  into: SpeciesId;
}

// Optional: a registry per species id (one-to-many). Populated by Species
// constructors when they declare evolutionRules.
export const EvolutionRegistry = new Registry<{
  id: SpeciesId;
  rules: EvolutionRule[];
}>("Evolution");

export function pickEvolution(rules: EvolutionRule[], ctx: EvolutionContext): SpeciesId | null {
  for (const r of rules) if (r.trigger.evaluate(ctx)) return r.into;
  return null;
}
