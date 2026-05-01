// Applies declarative MoveEffects to mutable battle state.
//
// Keeping this isolated lets us add new effect kinds (weather, stat-swap)
// without touching the damage code.

import { clampStage, type Stages } from "../stats";
import type { Move, MoveEffect } from "../move";
import type { Chattermon } from "../chattermon";
import type { Rng } from "../rng";
import type { StatusId } from "../types";

export interface EffectContext {
  user: Chattermon;
  foe: Chattermon;
  userStages: Stages;
  foeStages: Stages;
  userAsleepTurns: { value: number };
  rng: Rng;
}

export interface EffectLog {
  text: string; // human-readable line for the UI
  appliedStatus?: StatusId; // status applied to foe (if any)
}

export function runEffects(move: Move, ctx: EffectContext): EffectLog[] {
  const logs: EffectLog[] = [];
  for (const e of move.effects) {
    const log = runOne(e, ctx);
    if (log) logs.push(log);
  }
  return logs;
}

function runOne(e: MoveEffect, ctx: EffectContext): EffectLog | null {
  if (e.kind === "stage") {
    if (e.chance && !ctx.rng.chance(e.chance)) return null;
    const stages = e.target === "self" ? ctx.userStages : ctx.foeStages;
    stages[e.stat] = clampStage(stages[e.stat] + e.delta);
    const subject =
      e.target === "self" ? ctx.user.displayName() : ctx.foe.displayName();
    const verb = e.delta > 0 ? "rose" : "fell";
    return { text: `${subject}'s ${e.stat.toUpperCase()} ${verb}.` };
  }

  if (e.kind === "status") {
    if (!ctx.rng.chance(e.chance)) return null;
    const target = e.target === "self" ? ctx.user : ctx.foe;
    if (target.status) return null;
    target.status = e.status;
    return {
      text: `${target.displayName()} is ${e.status}!`,
      appliedStatus: e.status,
    };
  }

  if (e.kind === "heal") {
    const max = ctx.user.stats().hp;
    const heal = Math.max(1, Math.floor(max * e.pct));
    ctx.user.hp = Math.min(max, ctx.user.hp + heal);
    return { text: `${ctx.user.displayName()} healed ${heal} HP.` };
  }

  if (e.kind === "rest") {
    ctx.user.hp = ctx.user.stats().hp;
    ctx.user.status = "asleep";
    ctx.userAsleepTurns.value = 2;
    return { text: `${ctx.user.displayName()} rested up!` };
  }

  // "priority" is consumed by the turn-order resolver, not here.
  return null;
}

// Read priority bonus from a move (used by Arena to compute turn order).
export function priorityOf(move: Move): number {
  for (const e of move.effects) if (e.kind === "priority") return e.bonus;
  return 0;
}
