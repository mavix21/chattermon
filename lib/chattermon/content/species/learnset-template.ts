import type { LearnsetEntry } from "../../domain/species";

// Shared learnset skeleton — keeps content cost low while letting each
// species swap in its STAB and signature move.
export function defaultLearnset(stabMoveId: string, signatureMoveId: string): LearnsetEntry[] {
  return [
    { level: 1,  moveId: "tackle" },
    { level: 1,  moveId: "growl" },
    { level: 5,  moveId: stabMoveId },
    { level: 9,  moveId: "quick_attack" },
    { level: 14, moveId: "headbutt" },
    { level: 18, moveId: "focus_up" },
    { level: 20, moveId: signatureMoveId },
    { level: 28, moveId: "rest" },
  ];
}
