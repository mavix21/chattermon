// Pure damage resolution. Reads stat stages from the BattleState passed in,
// emits "damage:incoming" so traits/mutations can mutate the amount, and
// finally emits "damage:dealt" once HP is updated.

import { computeDamage } from "../formulas";
import { typeMultiplier, STAB_MULTIPLIER } from "../type-chart";
import { stageMultiplier, type Stages } from "../stats";
import type { Chattermon } from "../chattermon";
import type { Move } from "../move";
import type { BattleEventBus, BattleSide, DamageEventPayload } from "./events";
import type { Rng } from "../rng";

export interface DamageContext {
  attacker: Chattermon;
  defender: Chattermon;
  attackerSide: BattleSide;
  attackerStages: Stages;
  defenderStages: Stages;
  move: Move;
  bus: BattleEventBus;
  rng: Rng;
}

export interface DamageResult {
  damage: number;
  isCrit: boolean;
  effectiveness: number;
  fainted: boolean;
}

export function resolveDamage(ctx: DamageContext): DamageResult {
  const { attacker, defender, move, bus, rng } = ctx;
  const isPhysical = move.category === "physical";

  const aStats = attacker.stats();
  const dStats = defender.stats();
  const a = isPhysical ? aStats.atk : aStats.foc;
  const d = isPhysical ? dStats.def : dStats.foc;
  const aStage = isPhysical ? ctx.attackerStages.atk : ctx.attackerStages.foc;
  const dStage = isPhysical ? ctx.defenderStages.def : ctx.defenderStages.foc;

  const stab = move.type === attacker.species.type ? STAB_MULTIPLIER : 1;
  const eff = typeMultiplier(move.type, defender.species.type);
  const isCrit = rng.next() < attacker.critChance();
  const crit = isCrit ? 1.5 : 1;
  const random = 0.85 + rng.next() * 0.15;

  const base = computeDamage({
    level: attacker.level,
    power: move.power,
    attack: Math.round(a * stageMultiplier(aStage)),
    defense: Math.round(d * stageMultiplier(dStage)),
    stab,
    type: eff,
    crit,
    random,
  });

  const payload: DamageEventPayload = {
    attacker,
    defender,
    attackerSide: ctx.attackerSide,
    defenderSide: ctx.attackerSide === "player" ? "wild" : "player",
    base,
    amount: base,
    type: move.type,
    isCrit,
    isPhysical,
  };

  bus.emit("damage:incoming", payload);

  defender.hp = Math.max(0, defender.hp - payload.amount);

  bus.emit("damage:dealt", payload);

  return {
    damage: payload.amount,
    isCrit,
    effectiveness: eff,
    fainted: defender.isFainted(),
  };
}
