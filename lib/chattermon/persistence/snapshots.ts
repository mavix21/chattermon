// Pure JSON DTOs for the chat state adapter. Keeping these primitive-only
// means we can swap from memory state → Redis state without changing the
// repository or domain layer.

import type {
  BiomeId,
  ChattermonId,
  ItemId,
  MoveId,
  StatusId,
} from "../domain/types";

export const PLAYER_SNAPSHOT_VERSION = 1 as const;

export interface ChattermonSnapshot {
  id: ChattermonId;
  speciesId: string;
  level: number;
  xp: number;
  natureId: string;
  traitId: string;
  mutationId: string | null;
  hp: number;
  status: StatusId | null;
  knownMoves: MoveId[];
  friendship: number;
  mood: number;              // 0–100
  lastInteractedAt: number;  // epoch ms
  nickname?: string;
}

export interface EggSnapshot {
  speciesHint?: string;
  energyToHatch: number;
}

export interface PlayerSnapshot {
  v: typeof PLAYER_SNAPSHOT_VERSION;
  party: ChattermonSnapshot[]; // length ≤ 3
  box: ChattermonSnapshot[];
  energy: number;
  energyUpdatedAt: number; // epoch ms
  inventory: Record<ItemId, number>;
  captures: number;
  biome: BiomeId;
  eggs: EggSnapshot[];
  // Pending UI states (e.g., active battle, learn-move prompt) live in a
  // separate state slot — see `ui-state.ts`.
}
