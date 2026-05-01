import { Registry } from "../registry/registry";
import type { BaseStats } from "./stats";
import type { ChatterType, MoveId, SpeciesId, TraitId } from "./types";
import type { EvolutionRule } from "./evolution";

// Static species definition. One subclass per creature in `content/species/`.
//
// Composition over inheritance: Chattermon HAS-A Species; species classes
// only differ in their declared data, not their methods. Subclassing is
// used purely for one-instance-per-species discoverability and easy
// pattern-matching by ASCII frames.

export interface LearnsetEntry {
  level: number;
  moveId: MoveId;
}

export abstract class Species {
  abstract readonly id: SpeciesId;
  abstract readonly name: string;
  abstract readonly type: ChatterType;
  // Whether this species can appear in random encounters or hatches.
  // Set to `false` for boss/legendary chattermon that should be gated.
  readonly encounterable: boolean = true;
  // Whether this species is eligible to be the player's first hatch (starter).
  readonly starterEligible: boolean = false;
  abstract readonly base: BaseStats;
  abstract readonly traitPool: readonly TraitId[];
  abstract readonly learnset: readonly LearnsetEntry[];
  abstract readonly frames: readonly string[];

  // Optional — defaults to no evolutions.
  readonly evolutionRules: readonly EvolutionRule[] = [];

  // Default lure capture multiplier — can be overridden per species
  // for "rare" / "boss" creatures.
  readonly catchMod: number = 1;

  movesAtLevel(level: number): MoveId[] {
    return this.learnset.filter((l) => l.level <= level).map((l) => l.moveId);
  }

  initialMoves(): MoveId[] {
    return this.learnset
      .filter((l) => l.level <= 1)
      .map((l) => l.moveId)
      .slice(0, 4);
  }
}

export const SpeciesRegistry = new Registry<Species>("Species");
