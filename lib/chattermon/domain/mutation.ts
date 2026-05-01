import { Registry } from "../registry/registry";
import type { MutationId, StatKey } from "./types";

// Mutations are flat stat-multiplier modifiers + flavor flags.
// Behavioral mutations (Echo, Old Soul, Glitched) are handled in services
// that know how to read these flags; the data is intentionally pure.
export interface Mutation {
  id: MutationId;
  name: string;
  weight: number; // selection weight
  multipliers: Partial<Record<StatKey, number>>;
  // Flags the rest of the system can react to.
  flags?: {
    extraStrikeChance?: number; // Echo
    critBonus?: number; // Albino
    evadeBonus?: number; // Tiny
    startLevel?: number; // Old Soul
    glitched?: boolean; // Glitched (chaotic per session)
    altPalette?: "shiny" | "albino";
  };
}

export const MutationRegistry = new Registry<Mutation>("Mutation");

// Total mutation chance applied at hatch / wild encounter.
export const MUTATION_CHANCE = 0.2;
