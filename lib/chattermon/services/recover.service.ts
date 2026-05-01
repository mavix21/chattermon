// Energy-powered emergency revive. The soft-lock escape hatch.
//
// Spends a fixed chunk of energy to bring one fainted party member back
// to 50% HP. Intentionally narrow: no healing path, no scaling — items
// handle the nuanced cases, this exists so an out-of-items player can
// always dig themselves out.

import { fromSnapshot, toSnapshot } from "../persistence/serialize";
import { spendEnergy } from "./energy.service";
import type { PlayerSnapshot } from "../persistence/snapshots";

export const RECOVER_COST = 5;
export const RECOVER_HP_PCT = 0.5;

export type RecoverOutcome =
  | { ok: true; player: PlayerSnapshot; message: string }
  | { ok: false; reason: string };

export function recover(
  player: PlayerSnapshot,
  partyIndex: number,
): RecoverOutcome {
  const snap = player.party[partyIndex];
  if (!snap) return { ok: false, reason: "Invalid chattermon." };
  const c = fromSnapshot(snap);
  if (!c.isFainted()) {
    return { ok: false, reason: `${c.displayName()} isn't fainted.` };
  }

  const next = spendEnergy(player, RECOVER_COST);
  if (!next) return { ok: false, reason: `Need ${RECOVER_COST}⚡ to Recover.` };

  const maxHp = c.stats().hp;
  c.hp = Math.max(1, Math.floor(maxHp * RECOVER_HP_PCT));
  const party = [...next.party];
  party[partyIndex] = toSnapshot(c);
  return {
    ok: true,
    player: { ...next, party },
    message: `Recovered ${c.displayName()} to ${c.hp}/${maxHp} HP.`,
  };
}
