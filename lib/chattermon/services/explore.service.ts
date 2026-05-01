// Explore service: rolls one explore step (encounter / item / egg / flavor).

import { Chattermon } from "../domain/chattermon";
import { HatchService } from "./hatch.service";
import { spendEnergy } from "./energy.service";
import { ItemRegistry } from "../domain/item";
import { fromSnapshot } from "../persistence/serialize";
import type { Rng } from "../domain/rng";
import type { PlayerSnapshot } from "../persistence/snapshots";
import type { ItemId } from "../domain/types";

export type ExploreOutcome =
  | { kind: "encounter"; wild: Chattermon }
  | { kind: "item"; itemId: ItemId; quantity: number }
  | { kind: "egg" }
  | { kind: "flavor"; text: string }
  | { kind: "no_energy" }
  | { kind: "no_party" };

export interface ExploreOptions {
  // Safe mode: same energy cost, but encounter rolls are rerolled into
  // non-encounter outcomes. Used when the whole party is blacked out so
  // the player can still farm items / progress eggs.
  safe?: boolean;
}

const FLAVORS: readonly string[] = [
  "A breeze rustles the grass… nothing of note.",
  "You found a peaceful clearing.",
  "A footprint in the dirt — already cold.",
  "You hear distant chittering, but find no one.",
];

// Weights relative within the item bucket. Total = 30, so revive lands
// at ~1/30 of the 25% item-roll slice ≈ 0.8% of all explore steps.
// Rare but findable.
const FINDABLE_ITEMS: readonly { id: ItemId; weight: number }[] = [
  { id: "basic_lure", weight: 10 },
  { id: "sweet_berry", weight: 8 },
  { id: "spicy_berry", weight: 4 },
  { id: "greater_lure", weight: 2 },
  { id: "snack_bar", weight: 2 },
  { id: "potion", weight: 3 },
  { id: "revive", weight: 1 },
];

export class ExploreService {
  constructor(
    private readonly hatch: HatchService,
    private readonly rng: Rng,
  ) {}

  step(
    player: PlayerSnapshot,
    opts: ExploreOptions = {},
  ): {
    player: PlayerSnapshot;
    outcome: ExploreOutcome;
  } {
    // Blackout guard: no wild encounters allowed with zero living mons.
    // Safe mode explicitly ignores this — its whole purpose is to keep
    // the player moving while blacked out.
    if (!opts.safe && allFainted(player)) {
      return { player, outcome: { kind: "no_party" } };
    }

    const next = spendEnergy(player);
    if (!next) return { player, outcome: { kind: "no_energy" } };

    const lucky = this.leadHasTrait(player, "lucky") ? 0.05 : 0;
    // In safe mode, shift the fate roll out of the encounter bucket
    // (0.0–0.6) into the non-encounter range (0.6–1.0) so the branching
    // below naturally falls through to items/eggs/flavor.
    const r = opts.safe ? 0.6 + this.rng.next() * 0.4 : this.rng.next();

    if (r < 0.6) {
      const lvl = Math.max(1, this.rng.range(1, 6));
      const wild = this.hatch.hatch({ biome: player.biome, level: lvl });
      return { player: next, outcome: { kind: "encounter", wild } };
    }

    if (r < 0.85 + lucky) {
      const item = this.rng.weighted(
        FINDABLE_ITEMS.map((i) => ({ value: i.id, weight: i.weight })),
      );
      const inv = {
        ...next.inventory,
        [item]: (next.inventory[item] ?? 0) + 1,
      };
      const verifyName = ItemRegistry.get(item).name;
      void verifyName;
      return {
        player: { ...next, inventory: inv },
        outcome: { kind: "item", itemId: item, quantity: 1 },
      };
    }

    if (r < 0.88 + lucky) {
      return {
        player: { ...next, eggs: [...next.eggs, { energyToHatch: 5 }] },
        outcome: { kind: "egg" },
      };
    }

    return {
      player: next,
      outcome: { kind: "flavor", text: this.rng.pick(FLAVORS) },
    };
  }

  // Decrement the hatch-countdown on every explore for any held eggs.
  tickEggs(player: PlayerSnapshot): {
    player: PlayerSnapshot;
    hatched: number;
  } {
    let hatched = 0;
    const eggs = player.eggs.flatMap((e) => {
      const remaining = e.energyToHatch - 1;
      if (remaining <= 0) {
        hatched += 1;
        return [];
      }
      return [{ ...e, energyToHatch: remaining }];
    });
    return { player: { ...player, eggs }, hatched };
  }

  private leadHasTrait(p: PlayerSnapshot, traitId: string): boolean {
    return p.party[0]?.traitId === traitId;
  }
}

export function allFainted(p: PlayerSnapshot): boolean {
  if (p.party.length === 0) return false;
  return p.party.every((s) => fromSnapshot(s).isFainted());
}

export function anyFainted(p: PlayerSnapshot): boolean {
  return p.party.some((s) => fromSnapshot(s).isFainted());
}
