import { applyMultipliers, baseToLevel, type Stats } from "./stats";
import { natureMultipliers, NatureRegistry, type Nature } from "./nature";
import { MutationRegistry, type Mutation } from "./mutation";
import { TraitRegistry, type Trait } from "./trait";
import { SpeciesRegistry, type Species } from "./species";
import type {
  ChattermonId,
  MoveId,
  StatusId,
} from "./types";

// Per-instance domain class. Composition: holds references to immutable
// Species/Nature/Trait/Mutation registries; mutable state is just numbers
// + arrays of ids so it serializes cleanly.
export class Chattermon {
  static readonly MAX_KNOWN_MOVES = 4;
  static readonly MAX_LEVEL = 50;

  constructor(
    public readonly id: ChattermonId,
    public readonly species: Species,
    public level: number,
    public xp: number,
    public readonly nature: Nature,
    public readonly trait: Trait,
    public readonly mutation: Mutation | null,
    public hp: number,                    // current HP
    public status: StatusId | null,
    public knownMoves: MoveId[],
    public friendship: number,            // battles fought together
    public nickname?: string,
  ) {}

  // ── Stat resolution pipeline ────────────────────────────────────────
  // Order: base → level scaling → nature → trait passive → mutation.
  // Glitched mutation re-rolls per session via a deterministic seed.
  stats(): Stats {
    let s: Stats = baseToLevel(this.species.base, this.level);
    s = applyMultipliers(s, natureMultipliers(this.nature));
    if (this.trait.multipliers) s = applyMultipliers(s, this.trait.multipliers);
    if (this.mutation) s = applyMultipliers(s, this.mutation.multipliers);
    return s;
  }

  displayName(): string {
    return this.nickname ?? this.species.name;
  }

  isFainted(): boolean {
    return this.hp <= 0;
  }

  // Crit base 1/16, plus trait/mutation bonuses.
  critChance(): number {
    let p = 1 / 16;
    if (this.trait.id === "keen") p += 0.1;
    if (this.mutation?.flags?.critBonus) p += this.mutation.flags.critBonus;
    return p;
  }

  evade(): number {
    return this.mutation?.flags?.evadeBonus ?? 0;
  }

  extraStrikeChance(): number {
    let p = 0;
    if (this.trait.id === "echo") p += 0.1;
    if (this.mutation?.id === "echo") p += 0.1;
    return p;
  }

  // ── Move learning ───────────────────────────────────────────────────

  // Returns moves the chattermon should learn at the given level (excluding
  // ones it already knows).
  pendingLearns(level: number): MoveId[] {
    return this.species.learnset
      .filter((l) => l.level === level)
      .map((l) => l.moveId)
      .filter((m) => !this.knownMoves.includes(m));
  }

  forget(moveId: MoveId): void {
    this.knownMoves = this.knownMoves.filter((m) => m !== moveId);
  }

  learn(moveId: MoveId): void {
    if (this.knownMoves.includes(moveId)) return;
    if (this.knownMoves.length < Chattermon.MAX_KNOWN_MOVES) {
      this.knownMoves.push(moveId);
    }
    // If at cap, the caller is responsible for prompting the player to
    // forget one first via `forget(...)`.
  }

  canLearnNow(): boolean {
    return this.knownMoves.length < Chattermon.MAX_KNOWN_MOVES;
  }
}

// Hydrate a Chattermon back from primitive ids. All registry lookups happen
// here so the rest of the system can rely on real object references.
export function hydrateChattermon(snap: {
  id: string;
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
  nickname?: string;
}): Chattermon {
  return new Chattermon(
    snap.id,
    SpeciesRegistry.get(snap.speciesId),
    snap.level,
    snap.xp,
    NatureRegistry.get(snap.natureId),
    TraitRegistry.get(snap.traitId),
    snap.mutationId ? MutationRegistry.get(snap.mutationId) : null,
    snap.hp,
    snap.status,
    [...snap.knownMoves],
    snap.friendship,
    snap.nickname,
  );
}
