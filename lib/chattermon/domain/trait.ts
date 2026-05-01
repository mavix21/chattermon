import { Registry } from "../registry/registry";
import type { TraitId, StatKey } from "./types";
import type { BattleEventBus, BattleSide } from "./battle/events";
import type { Chattermon } from "./chattermon";

// A trait is an "ability". Pattern: Strategy + Observer.
//
//   - `multipliers` apply during stat resolution (passive, out-of-battle).
//   - `attach` subscribes to BattleEventBus hooks (active, in-battle).
//
// New traits are added by writing one Trait object; no changes to the
// damage/level-up code are required.
export interface TraitContext {
  bus: BattleEventBus;
  self: Chattermon;
  selfSide: BattleSide;
}

export interface Trait {
  id: TraitId;
  name: string;
  description: string;
  multipliers?: Partial<Record<StatKey, number>>;
  // External effects (loot, xp) — read by services, not battle.
  exploreItemBonus?: number;
  xpBonus?: number;
  encounterRateBonus?: number;
  // Hook-based behavior during a battle.
  attach?(ctx: TraitContext): () => void; // returns cleanup
}

export const TraitRegistry = new Registry<Trait>("Trait");
