import { Registry } from "../registry/registry";
import type { BiomeId, ChatterType, SpeciesId } from "../domain/types";

export interface Biome {
  id: BiomeId;
  name: string;
  unlockCaptures: number; // captures required to enter
  // Type weights for wild encounters and egg hatches in this biome.
  typeWeights: Partial<Record<ChatterType, number>>;
  // Optional explicit species weighting (else falls back to typeWeights).
  speciesWeights?: Partial<Record<SpeciesId, number>>;
}

export const BiomeRegistry = new Registry<Biome>("Biome");

const BIOMES: Biome[] = [
  {
    id: "meadow",
    name: "Meadow",
    unlockCaptures: 0,
    typeWeights: { normal: 3, plant: 3, electric: 2 },
  },
  {
    id: "coast",
    name: "Coast",
    unlockCaptures: 3,
    typeWeights: { aqua: 3, flying: 3, normal: 1 },
  },
  {
    id: "volcano",
    name: "Volcano",
    unlockCaptures: 5,
    typeWeights: { fire: 4, normal: 1 },
  },
  {
    id: "glacier",
    name: "Glacier",
    unlockCaptures: 8,
    typeWeights: { ice: 4, psychic: 2 },
  },
];

for (const b of BIOMES) BiomeRegistry.register(b);
