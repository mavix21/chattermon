// Glue between the persistent player snapshot, the ephemeral BattleArena,
// and the level-up service. The Arena does the per-turn work; this
// service handles bookkeeping (xp, captures, party adds, item consumption).

import { BattleArena, type BattleStep } from "../domain/battle/arena";
import { LevelUpService, type LevelUpEvent } from "./level-up.service";
import { fromSnapshot, toSnapshot } from "../persistence/serialize";
import type { Chattermon } from "../domain/chattermon";
import type { ItemId } from "../domain/types";
import type {
  PlayerSnapshot,
  ChattermonSnapshot,
} from "../persistence/snapshots";
import type { Rng } from "../domain/rng";

export interface AfterBattleResult {
  player: PlayerSnapshot;
  step: BattleStep;
  levelUps: LevelUpEvent[];
  captured: ChattermonSnapshot | null;
}

export class BattleService {
  private readonly leveling = new LevelUpService();

  constructor(private readonly rng: Rng) {}

  newArena(
    player: PlayerSnapshot,
    wild: Chattermon,
  ): {
    arena: BattleArena;
    consumeItem: (id: ItemId) => boolean;
    snapshotPlayer: () => PlayerSnapshot;
  } {
    if (player.party.length === 0) {
      throw new Error("BattleService: cannot battle with empty party.");
    }
    const lead = fromSnapshot(player.party[0]);
    const party = [lead, ...player.party.slice(1).map((s) => fromSnapshot(s))];

    let inv = { ...player.inventory };
    const consumeItem = (id: ItemId): boolean => {
      if ((inv[id] ?? 0) <= 0) return false;
      inv = { ...inv, [id]: inv[id] - 1 };
      return true;
    };

    const arena = new BattleArena(lead, wild, party, this.rng, { consumeItem });
    return {
      arena,
      consumeItem,
      snapshotPlayer: (): PlayerSnapshot => {
        const updatedParty = party.map((c) => toSnapshot(c));
        return { ...player, party: updatedParty, inventory: inv };
      },
    };
  }

  // Apply terminal effects of a battle step (xp, captures) and return
  // an updated player snapshot.
  finalize(
    base: PlayerSnapshot,
    leadAfter: Chattermon,
    wild: Chattermon,
    step: BattleStep,
  ): AfterBattleResult {
    let player = { ...base };
    const captured = step.capturedSnapshot
      ? toSnapshot(step.capturedSnapshot)
      : null;
    let levelUps: LevelUpEvent[] = [];

    if (step.phase === "victory" || step.phase === "captured") {
      const xp = this.leveling.award(leadAfter, wild.level, !!wild.mutation, {
        biome: player.biome,
        friendship: leadAfter.friendship,
      });
      levelUps = xp.events;
      step.xpAwarded = xp.totalXp;
    }

    if (captured) {
      const partyHasRoom = player.party.length < 3;
      if (partyHasRoom)
        player = { ...player, party: [...player.party, captured] };
      else player = { ...player, box: [...player.box, captured] };
      player = { ...player, captures: player.captures + 1 };
    }

    // Persist updated lead snapshot back into party[0].
    const updatedLead = toSnapshot(leadAfter);
    const party =
      player.party.length > 0
        ? [updatedLead, ...player.party.slice(1)]
        : [updatedLead];
    player = { ...player, party };

    return { player, step, levelUps, captured };
  }
}
