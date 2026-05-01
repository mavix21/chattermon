// Branded ID aliases and shared enums. Kept primitive-only so they survive JSON
// round-trips through the state adapter.

export type ChatterType =
  | "normal"
  | "electric"
  | "fire"
  | "ice"
  | "aqua"
  | "plant"
  | "flying"
  | "psychic";

export const ALL_TYPES: readonly ChatterType[] = [
  "normal",
  "electric",
  "fire",
  "ice",
  "aqua",
  "plant",
  "flying",
  "psychic",
] as const;

export type SpeciesId = string;
export type MoveId = string;
export type TraitId = string;
export type NatureId = string;
export type MutationId = string;
export type ItemId = string;
export type BiomeId = string;
export type ChattermonId = string;

export type StatusId = "paralyzed" | "burn" | "freeze" | "confused" | "asleep";

export type MoveCategory = "physical" | "focus" | "status";

export type StatKey = "hp" | "atk" | "def" | "foc" | "spd";

export const ALL_STAT_KEYS: readonly StatKey[] = [
  "hp",
  "atk",
  "def",
  "foc",
  "spd",
] as const;

// Buff/debuff stages applied during battle (Pokémon-style ±6 cap, excluding hp).
export type StageKey = Exclude<StatKey, "hp">;
