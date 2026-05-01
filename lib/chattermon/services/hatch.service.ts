// Hatch service. Pattern: Factory.
//
// Centralizes RNG over species, nature, trait, and mutation so the rest
// of the system never re-implements "make a random chattermon".

import { Chattermon } from "../domain/chattermon";
import { MutationRegistry, MUTATION_CHANCE } from "../domain/mutation";
import { NatureRegistry } from "../domain/nature";
import { SpeciesRegistry, type Species } from "../domain/species";
import { TraitRegistry } from "../domain/trait";
import { BiomeRegistry } from "../content/biomes";
import type { Rng } from "../domain/rng";
import type { BiomeId, ChatterType } from "../domain/types";

export interface HatchOptions {
  biome?: BiomeId;
  level?: number; // override starting level
  speciesId?: string; // force a species (eggs / debug)
}

export class HatchService {
  constructor(private readonly rng: Rng) {}

  hatch(opts: HatchOptions = {}): Chattermon {
    const species = opts.speciesId
      ? SpeciesRegistry.get(opts.speciesId)
      : this.pickSpecies(opts.biome ?? "meadow");

    const trait = TraitRegistry.get(
      this.rng.pick(species.traitPool as readonly string[]),
    );
    const nature = this.rng.pick(NatureRegistry.all());
    const mutation = this.rng.chance(MUTATION_CHANCE)
      ? this.rng.weighted(
          MutationRegistry.all().map((m) => ({ value: m, weight: m.weight })),
        )
      : null;

    const startLevel = opts.level ?? mutation?.flags?.startLevel ?? 1;
    const baby = new Chattermon(
      `cm_${this.rng.int(1e9).toString(36)}`,
      species,
      startLevel,
      0,
      nature,
      trait,
      mutation,
      1,
      null,
      species.movesAtLevel(startLevel).slice(-4),
      0,
    );
    baby.hp = baby.stats().hp;
    return baby;
  }

  private pickSpecies(biomeId: BiomeId): Species {
    const biome = BiomeRegistry.tryGet(biomeId) ?? BiomeRegistry.get("meadow");
    const all = SpeciesRegistry.all();
    // Filter out non-encounterable species (bosses / legendaries).
    const candidates = all.filter((sp) => sp.encounterable);
    const pool = candidates.length > 0 ? candidates : all;
    const weighted = pool.map((sp) => ({
      value: sp,
      weight: biome.typeWeights[sp.type as ChatterType] ?? 0.5,
    }));
    return this.rng.weighted(weighted);
  }
}
