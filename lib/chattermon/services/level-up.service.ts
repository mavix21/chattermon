// Level-up + move-learning + evolution check.
//
// Returns a structured result the UI can act on without knowing the rules.

import { Chattermon } from "../domain/chattermon";
import { defeatXp, xpToNext } from "../domain/formulas";
import { pickEvolution, type EvolutionContext } from "../domain/evolution";
import type { MoveId } from "../domain/types";

export interface LevelUpEvent {
  fromLevel: number;
  toLevel: number;
  learned: MoveId[]; // auto-learned (had room)
  pendingLearn: MoveId | null; // needs forget-prompt
  evolveInto: string | null; // species id, if triggered
}

export interface XpAwardResult {
  events: LevelUpEvent[];
  totalXp: number;
}

export class LevelUpService {
  award(
    c: Chattermon,
    foeLevel: number,
    mutated: boolean,
    ctx: Omit<EvolutionContext, "level">,
  ): XpAwardResult {
    const xpBonus = c.trait.xpBonus ?? 0;
    const totalXp = Math.round(defeatXp(foeLevel, mutated) * (1 + xpBonus));
    c.xp += totalXp;
    c.friendship += 1;

    const events: LevelUpEvent[] = [];
    while (c.level < Chattermon.MAX_LEVEL) {
      const need = xpToNext(c.level);
      if (c.xp < need) break;
      c.xp -= need;
      const from = c.level;
      c.level += 1;

      const pending = c.pendingLearns(c.level);
      const learned: MoveId[] = [];
      let pendingLearn: MoveId | null = null;
      for (const m of pending) {
        if (c.canLearnNow()) {
          c.learn(m);
          learned.push(m);
        } else {
          pendingLearn = m;
          break;
        }
      }

      // Heal max HP gain on level-up so battles don't punish progression.
      c.hp = Math.min(c.stats().hp, c.hp + 1);

      const evolveInto = pickEvolution([...c.species.evolutionRules], {
        ...ctx,
        level: c.level,
      });

      events.push({
        fromLevel: from,
        toLevel: c.level,
        learned,
        pendingLearn,
        evolveInto,
      });

      if (pendingLearn) break; // pause progression until UI resolves the prompt
    }

    return { events, totalXp };
  }
}
