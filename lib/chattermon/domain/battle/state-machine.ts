// Battle state machine. Pattern: State.
//
// Models valid transitions between phases of a wild-encounter battle.
// The Arena drives this FSM and re-renders UI whenever the state
// transitions to AwaitPlayer.

export type BattlePhase =
  | "intro"
  | "await_player"
  | "resolve_turn"
  | "check_end"
  | "await_swap"
  | "victory"
  | "defeat"
  | "captured"
  | "fled";

export class BattleStateMachine {
  private phase: BattlePhase = "intro";
  private turn = 0;

  current(): BattlePhase {
    return this.phase;
  }
  turnNumber(): number {
    return this.turn;
  }

  private static readonly TRANSITIONS: Record<
    BattlePhase,
    readonly BattlePhase[]
  > = {
    intro: ["await_player"],
    await_player: ["resolve_turn", "fled", "captured"],
    resolve_turn: ["check_end"],
    check_end: ["await_player", "await_swap", "victory", "defeat", "captured"],
    await_swap: ["resolve_turn", "defeat"],
    victory: [],
    defeat: [],
    captured: [],
    fled: [],
  };

  to(next: BattlePhase): void {
    const allowed = BattleStateMachine.TRANSITIONS[this.phase];
    if (!allowed.includes(next)) {
      throw new Error(`BattleFSM: illegal ${this.phase} → ${next}`);
    }
    if (next === "resolve_turn") this.turn += 1;
    this.phase = next;
  }

  isTerminal(): boolean {
    return ["victory", "defeat", "captured", "fled"].includes(this.phase);
  }
}
