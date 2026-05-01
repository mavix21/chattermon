// Out-of-battle item application.
//
// Keeps validation + mutation in one place so the bot handlers stay dumb
// and every call site enforces the same rules (target type, HP clamp,
// inventory decrement). Battle-only items (lures, stones, tonics) short-
// circuit via `isBagUsable` so the bag never even renders a Use button
// for them.

import { ItemRegistry, type Item } from "../domain/item";
import { fromSnapshot, toSnapshot } from "../persistence/serialize";
import { ENERGY_MAX } from "./energy.service";
import type {
  ChattermonSnapshot,
  PlayerSnapshot,
} from "../persistence/snapshots";
import type { ItemId } from "../domain/types";

export type UseOutcome =
  | { ok: true; player: PlayerSnapshot; message: string }
  | { ok: false; reason: string };

// Which items should the bag offer a "Use" button for? Lures/stones/
// tonics are gated to other flows (battle, evolution trigger, …).
export function isBagUsable(item: Item): boolean {
  if (item.kind === "berry") {
    if (item.curesStatus) return true;
    if (typeof item.healPct === "number" && item.healPct > 0) return true;
    return false;
  }
  if (item.kind === "potion") return true;
  if (item.kind === "snack" && item.energyRestore) return true;
  return false;
}

// Does using this item from the bag require the player to pick a
// party member as target?
export function requiresTarget(item: Item): boolean {
  return item.kind === "berry" || item.kind === "potion";
}

export class ItemService {
  // Self-targeted items (currently just snack_bar).
  useSelf(player: PlayerSnapshot, itemId: ItemId): UseOutcome {
    const own = player.inventory[itemId] ?? 0;
    if (own <= 0) return { ok: false, reason: "You don't have that item." };
    const item = ItemRegistry.tryGet(itemId);
    if (!item) return { ok: false, reason: "Unknown item." };

    if (item.kind === "snack" && item.energyRestore) {
      if (player.energy >= ENERGY_MAX) {
        return { ok: false, reason: "Energy already full." };
      }
      const before = player.energy;
      const after = Math.min(ENERGY_MAX, before + item.energyRestore);
      return {
        ok: true,
        player: {
          ...player,
          energy: after,
          inventory: decItem(player.inventory, itemId),
        },
        message: `Used ${item.name}. +${after - before}⚡`,
      };
    }

    return { ok: false, reason: "That item needs a target." };
  }

  // Items applied to a specific party member.
  useOnMember(
    player: PlayerSnapshot,
    itemId: ItemId,
    partyIndex: number,
  ): UseOutcome {
    const own = player.inventory[itemId] ?? 0;
    if (own <= 0) return { ok: false, reason: "You don't have that item." };
    const snap = player.party[partyIndex];
    if (!snap) return { ok: false, reason: "Invalid chattermon." };
    const item = ItemRegistry.tryGet(itemId);
    if (!item) return { ok: false, reason: "Unknown item." };

    const c = fromSnapshot(snap);
    const maxHp = c.stats().hp;

    // Revive: fainted-only.
    if (item.kind === "potion" && typeof item.revivePct === "number") {
      if (!c.isFainted()) {
        return { ok: false, reason: `${c.displayName()} isn't fainted.` };
      }
      c.hp = Math.max(1, Math.min(maxHp, Math.floor(maxHp * item.revivePct)));
      return {
        ok: true,
        player: writeBack(
          player,
          partyIndex,
          toSnapshot(c),
          decItem(player.inventory, itemId),
        ),
        message: `Revived ${c.displayName()}! (${c.hp}/${maxHp} HP)`,
      };
    }

    // Heal: living, below max HP.
    if (
      (item.kind === "potion" || item.kind === "berry") &&
      typeof item.healPct === "number" &&
      item.healPct > 0
    ) {
      if (c.isFainted()) {
        return {
          ok: false,
          reason: `${c.displayName()} is fainted — use a Revive.`,
        };
      }
      if (c.hp >= maxHp) {
        return { ok: false, reason: `${c.displayName()} is at full HP.` };
      }
      const gain = Math.max(1, Math.floor(maxHp * item.healPct));
      const healed = Math.min(maxHp, c.hp + gain);
      const delta = healed - c.hp;
      c.hp = healed;
      return {
        ok: true,
        player: writeBack(
          player,
          partyIndex,
          toSnapshot(c),
          decItem(player.inventory, itemId),
        ),
        message: `${c.displayName()} recovered ${delta} HP.`,
      };
    }

    // Status cure.
    if (item.kind === "berry" && item.curesStatus) {
      if (c.isFainted()) {
        return { ok: false, reason: `${c.displayName()} is fainted.` };
      }
      if (!c.status) {
        return {
          ok: false,
          reason: `${c.displayName()} has no status to cure.`,
        };
      }
      const prev = c.status;
      c.status = null;
      return {
        ok: true,
        player: writeBack(
          player,
          partyIndex,
          toSnapshot(c),
          decItem(player.inventory, itemId),
        ),
        message: `${c.displayName()} is no longer ${prev}.`,
      };
    }

    return { ok: false, reason: "That item can't be used from the bag." };
  }
}

function decItem(
  inv: Record<ItemId, number>,
  id: ItemId,
): Record<ItemId, number> {
  const next = { ...inv, [id]: (inv[id] ?? 0) - 1 };
  if (next[id] <= 0) delete next[id];
  return next;
}

function writeBack(
  player: PlayerSnapshot,
  idx: number,
  snap: ChattermonSnapshot,
  inv: Record<ItemId, number>,
): PlayerSnapshot {
  const party = [...player.party];
  party[idx] = snap;
  return { ...player, party, inventory: inv };
}
