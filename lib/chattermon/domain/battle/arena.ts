// Battle Arena — the orchestrator that wires together the FSM, event bus,
// damage pipeline, and effect runner around a single wild encounter.
//
// The Arena is intentionally I/O-free: it returns BattleStep results that
// the service/UI layer renders. This keeps the domain unit-testable.

import { Chattermon } from "../chattermon";
import { MoveRegistry } from "../move";
import { ZERO_STAGES, type Stages } from "../stats";
import { resolveDamage } from "./damage";
import { priorityOf, runEffects } from "./effect-runner";
import { BattleEventBus, type BattleSide } from "./events";
import { BattleStateMachine } from "./state-machine";
import { rollCapture } from "../formulas";
import { ItemRegistry } from "../item";
import type { BattleCommand } from "./commands";
import type { Rng } from "../rng";
import type { ItemId, StatusId } from "../types";

// A "frame" is a single narration line plus a snapshot of each combatant
// at the moment the line was emitted. The UI walks frames one at a time,
// so HP bars and statuses animate in lockstep with the text.
export interface BattleFrame {
  text: string;
  playerHp: number;
  wildHp: number;
  playerStatus: StatusId | null;
  wildStatus: StatusId | null;
}

export interface BattleStep {
  frames: BattleFrame[];
  phase: ReturnType<BattleStateMachine["current"]>;
  capturedSnapshot?: Chattermon; // present on phase=captured
  xpAwarded?: number;
}

export interface BattleConfig {
  consumeItem: (itemId: ItemId) => boolean; // returns true if consumed
}

export class BattleArena {
  readonly bus = new BattleEventBus();
  readonly fsm = new BattleStateMachine();

  player: Chattermon; // Make mutable to support swaps
  private playerStages: Stages = { ...ZERO_STAGES };
  private wildStages: Stages = { ...ZERO_STAGES };
  private playerAsleepTurns = { value: 0 };
  private wildAsleepTurns = { value: 0 };
  private detachers: Array<() => void> = [];

  // Frames accumulated for the in-flight `submit()` call. Cleared at the
  // top of every submit so callers always get a fresh sequence.
  private pendingFrames: BattleFrame[] = [];

  constructor(
    initialPlayer: Chattermon,
    public readonly wild: Chattermon,
    public readonly playerParty: Chattermon[],
    private readonly rng: Rng,
    private readonly cfg: BattleConfig,
  ) {
    this.player = initialPlayer;
    this.attachActor(initialPlayer, "player");
    this.attachActor(wild, "wild");
  }

  private attachActor(c: Chattermon, side: BattleSide): void {
    if (c.trait.attach)
      this.detachers.push(
        c.trait.attach({ bus: this.bus, self: c, selfSide: side }),
      );
  }

  private detachActor(): void {
    // Detach all current detachers. In a full implementation,
    // we'd track them per-side, but for simplicity we clear all on swap.
    for (const d of this.detachers) d();
    this.detachers = [];
  }

  // Single point of state capture. Every narration line is recorded
  // alongside the current HPs and statuses so the UI can animate.
  private pushLine(text: string): void {
    this.pendingFrames.push({
      text,
      playerHp: this.player.hp,
      wildHp: this.wild.hp,
      playerStatus: this.player.status,
      wildStatus: this.wild.status,
    });
  }

  start(): BattleStep {
    this.pendingFrames = [];
    this.pushLine(
      `A wild ${this.wild.displayName()} (Lv.${this.wild.level}) appeared!`,
    );
    this.fsm.to("await_player");
    return { frames: this.pendingFrames, phase: this.fsm.current() };
  }

  // Submit one player command. Wild AI picks a random known move and the
  // turn resolves in speed order.
  submit(cmd: BattleCommand): BattleStep {
    if (
      this.fsm.current() !== "await_player" &&
      this.fsm.current() !== "await_swap"
    ) {
      throw new Error("Arena: cannot submit while not awaiting player");
    }

    this.pendingFrames = [];

    if (cmd.kind === "swap") {
      const target = this.playerParty[cmd.partyIndex];
      if (!target) return this.errStep("Invalid party member.");
      if (target === this.player) return this.errStep("Already active.");
      if (target.isFainted()) return this.errStep("That chattermon fainted.");
      this.detachActor();
      this.player = target;
      this.attachActor(target, "player");
      this.pushLine(`${target.displayName()} switched in!`);
      this.fsm.to("resolve_turn");
      this.runWildAttack();
      return this.afterTurn();
    }

    if (cmd.kind === "run") {
      this.fsm.to("fled");
      this.pushLine(`${this.player.displayName()} fled the battle!`);
      this.cleanup();
      return { frames: this.pendingFrames, phase: "fled" };
    }

    if (cmd.kind === "lure") {
      const item = ItemRegistry.get(cmd.itemId);
      if (!item.lureMod) return this.errStep("That item is not a lure.");
      if (!this.cfg.consumeItem(cmd.itemId))
        return this.errStep("You don't have that item.");
      const hpPct = this.wild.hp / this.wild.stats().hp;
      const { caught, chance } = rollCapture(
        this.rng,
        hpPct,
        this.wild.level,
        item.lureMod,
        !!this.wild.mutation,
      );
      this.pushLine(
        `Threw ${item.name}… (${Math.round(chance * 100)}% chance)`,
      );
      if (caught) {
        this.fsm.to("captured");
        this.pushLine(`Caught ${this.wild.displayName()}!`);
        this.cleanup();
        return {
          frames: this.pendingFrames,
          phase: "captured",
          capturedSnapshot: this.wild,
        };
      }
      this.pushLine("It broke free!");
      // Lure throw counts as the player's action; wild gets a free turn.
      this.fsm.to("resolve_turn");
      this.runWildAttack();
      return this.afterTurn();
    }

    if (cmd.kind !== "attack") {
      return this.errStep("Unsupported command in v1.");
    }

    const playerMove = MoveRegistry.get(cmd.moveId);
    const wildMoveId = this.rng.pick(this.wild.knownMoves);
    const wildMove = MoveRegistry.get(wildMoveId);

    this.fsm.to("resolve_turn");
    this.bus.emit("turn:start", {
      turn: this.fsm.turnNumber(),
      active: "player",
    });

    // Determine order: priority first, then speed.
    const playerSpd = this.player.stats().spd;
    const wildSpd = this.wild.stats().spd;
    const playerFirst =
      priorityOf(playerMove) !== priorityOf(wildMove)
        ? priorityOf(playerMove) > priorityOf(wildMove)
        : playerSpd === wildSpd
          ? this.rng.chance(0.5)
          : playerSpd > wildSpd;

    const order: Array<"player" | "wild"> = playerFirst
      ? ["player", "wild"]
      : ["wild", "player"];
    for (const side of order) {
      if (this.player.isFainted() || this.wild.isFainted()) break;
      if (side === "player") this.runPlayerMove(playerMove);
      else this.runWildAttack(wildMove);
    }

    this.bus.emit("turn:end", {
      turn: this.fsm.turnNumber(),
      active: "player",
    });
    return this.afterTurn();
  }

  private runPlayerMove(move: ReturnType<typeof MoveRegistry.get>): void {
    if (this.skippingTurn(this.player, this.playerAsleepTurns, "player"))
      return;
    this.pushLine(`${this.player.displayName()} used ${move.name}!`);
    if (this.rng.next() * 100 > move.accuracy) {
      this.pushLine("It missed!");
      return;
    }
    this.applyMove(move, "player");
  }

  private runWildAttack(move?: ReturnType<typeof MoveRegistry.get>): void {
    if (this.skippingTurn(this.wild, this.wildAsleepTurns, "wild")) return;
    const m = move ?? MoveRegistry.get(this.rng.pick(this.wild.knownMoves));
    this.pushLine(`Wild ${this.wild.displayName()} used ${m.name}!`);
    if (this.rng.next() * 100 > m.accuracy) {
      this.pushLine("It missed!");
      return;
    }
    this.applyMove(m, "wild");
  }

  private applyMove(
    move: ReturnType<typeof MoveRegistry.get>,
    side: BattleSide,
  ): void {
    const attacker = side === "player" ? this.player : this.wild;
    const defender = side === "player" ? this.wild : this.player;
    const attackerStages =
      side === "player" ? this.playerStages : this.wildStages;
    const defenderStages =
      side === "player" ? this.wildStages : this.playerStages;

    if (move.power > 0) {
      const hits = 1 + (this.rng.chance(attacker.extraStrikeChance()) ? 1 : 0);
      let totalDmg = 0;
      let last = { isCrit: false, effectiveness: 1, fainted: false };
      for (let i = 0; i < hits; i++) {
        if (defender.isFainted()) break;
        const r = resolveDamage({
          attacker,
          defender,
          attackerSide: side,
          attackerStages,
          defenderStages,
          move,
          bus: this.bus,
          rng: this.rng,
        });
        // Echo / mutation second strikes do half damage.
        if (i > 0)
          defender.hp = Math.max(0, defender.hp + Math.floor(r.damage / 2));
        totalDmg += r.damage;
        last = r;
      }
      this.pushLine(
        `Dealt ${totalDmg} damage${last.isCrit ? " (crit!)" : ""}${last.effectiveness > 1 ? " — super effective!" : last.effectiveness < 1 ? " — not very effective…" : ""}.`,
      );
      if (defender.isFainted()) {
        this.pushLine(`${defender.displayName()} fainted!`);
        this.bus.emit("ko", {
          side: side === "player" ? "wild" : "player",
          victim: defender,
        });
      }
    }

    const fxLogs = runEffects(move, {
      user: attacker,
      foe: defender,
      userStages: attackerStages,
      foeStages: defenderStages,
      userAsleepTurns:
        side === "player" ? this.playerAsleepTurns : this.wildAsleepTurns,
      rng: this.rng,
    });
    for (const l of fxLogs) this.pushLine(l.text);
  }

  private skippingTurn(
    c: Chattermon,
    asleep: { value: number },
    side: BattleSide,
  ): boolean {
    if (c.status === "asleep") {
      if (asleep.value > 0) {
        asleep.value -= 1;
        this.pushLine(`${c.displayName()} is asleep…`);
        return true;
      }
      c.status = null;
      this.pushLine(`${c.displayName()} woke up!`);
    }
    if (c.status === "freeze") {
      if (this.rng.chance(0.2)) {
        c.status = null;
        this.pushLine(`${c.displayName()} thawed out!`);
      } else {
        this.pushLine(`${c.displayName()} is frozen solid!`);
        return true;
      }
    }
    if (c.status === "paralyzed" && this.rng.chance(0.25)) {
      this.pushLine(`${c.displayName()} is paralyzed and can't move!`);
      return true;
    }
    if (c.status === "burn") {
      const max = c.stats().hp;
      const tick = Math.max(1, Math.floor(max / 16));
      c.hp = Math.max(0, c.hp - tick);
      this.pushLine(`${c.displayName()} took ${tick} burn damage.`);
      if (c.isFainted()) {
        this.bus.emit("ko", { side, victim: c });
        return true;
      }
    }
    return false;
  }

  private afterTurn(): BattleStep {
    this.fsm.to("check_end");
    if (this.wild.isFainted()) {
      this.fsm.to("victory");
      this.cleanup();
      return { frames: this.pendingFrames, phase: "victory" };
    }
    if (this.player.isFainted()) {
      // Check if player has any alive chattermon left
      const aliveBackups = this.playerParty.some(
        (c) => c !== this.player && !c.isFainted(),
      );
      if (aliveBackups) {
        this.pushLine(`${this.player.displayName()} blacked out!`);
        this.fsm.to("await_swap");
        return { frames: this.pendingFrames, phase: "await_swap" };
      }
      this.fsm.to("defeat");
      this.cleanup();
      return { frames: this.pendingFrames, phase: "defeat" };
    }
    this.fsm.to("await_player");
    return { frames: this.pendingFrames, phase: "await_player" };
  }

  private errStep(msg: string): BattleStep {
    this.pushLine(msg);
    return { frames: this.pendingFrames, phase: this.fsm.current() };
  }

  private cleanup(): void {
    for (const d of this.detachers) d();
    this.detachers = [];
    this.bus.clear();
  }
}
