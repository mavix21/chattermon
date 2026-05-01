// Battle event bus. Pattern: Observer / publish-subscribe.
//
// Traits, mutations, and status effects subscribe to typed events and can
// mutate the in-flight payload (e.g., damage). Keeping all hooks in one
// place avoids `if`-chain spaghetti inside the damage function.

import type { Chattermon } from "../chattermon";

export type BattleSide = "player" | "wild";

export interface DamageEventPayload {
  attacker: Chattermon;
  defender: Chattermon;
  attackerSide: BattleSide;
  defenderSide: BattleSide;
  base: number; // damage as computed pre-hooks
  amount: number; // mutable: hooks may modify this
  type: string; // attack type (ChatterType)
  isCrit: boolean;
  isPhysical: boolean;
}

export interface TurnEventPayload {
  turn: number;
  active: BattleSide;
}

export interface KoEventPayload {
  side: BattleSide;
  victim: Chattermon;
}

export type BattleEvents = {
  "turn:start": TurnEventPayload;
  "turn:end": TurnEventPayload;
  "damage:incoming": DamageEventPayload; // before damage applied
  "damage:dealt": DamageEventPayload; // after damage applied
  ko: KoEventPayload;
};

export type BattleEventName = keyof BattleEvents;

type Listener<E extends BattleEventName> = (payload: BattleEvents[E]) => void;

export class BattleEventBus {
  private readonly listeners = new Map<
    BattleEventName,
    Set<Listener<BattleEventName>>
  >();

  on<E extends BattleEventName>(event: E, fn: Listener<E>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(fn as Listener<BattleEventName>);
    return () => set!.delete(fn as Listener<BattleEventName>);
  }

  emit<E extends BattleEventName>(event: E, payload: BattleEvents[E]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const fn of set) (fn as Listener<E>)(payload);
  }

  clear(): void {
    this.listeners.clear();
  }
}
