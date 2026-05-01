import { Chattermon, hydrateChattermon } from "../domain/chattermon";
import type { ChattermonSnapshot } from "./snapshots";

export function toSnapshot(c: Chattermon): ChattermonSnapshot {
  return {
    id: c.id,
    speciesId: c.species.id,
    level: c.level,
    xp: c.xp,
    natureId: c.nature.id,
    traitId: c.trait.id,
    mutationId: c.mutation?.id ?? null,
    hp: c.hp,
    status: c.status,
    knownMoves: [...c.knownMoves],
    friendship: c.friendship,
    mood: c.mood,
    lastInteractedAt: c.lastInteractedAt,
    nickname: c.nickname,
  };
}

export function fromSnapshot(s: ChattermonSnapshot): Chattermon {
  return hydrateChattermon(s);
}
