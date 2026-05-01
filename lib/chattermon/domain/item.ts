import { Registry } from "../registry/registry";
import type { ItemId } from "./types";

export type ItemKind =
  | "lure"
  | "berry"
  | "potion"
  | "snack"
  | "egg"
  | "tonic"
  | "stone";

export interface Item {
  id: ItemId;
  name: string;
  kind: ItemKind;
  description: string;
  // Lure-specific
  lureMod?: number;
  // Berry / potion (heal % of max HP or status flag)
  healPct?: number;
  curesStatus?: boolean;
  // Potion revive (% of max HP restored on a fainted target)
  revivePct?: number;
  // Snack-specific
  energyRestore?: number;
  // Stone-specific (read by EvolutionTrigger)
  stoneId?: string;
}

export const ItemRegistry = new Registry<Item>("Item");
