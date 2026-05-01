import { Registry } from "../registry/registry";
import type {
  ChatterType,
  MoveCategory,
  MoveId,
  StageKey,
  StatusId,
} from "./types";

// MoveEffect: Strategy + Visitor-light. Each effect is a small object
// describing a side-effect declaratively; the battle pipeline interprets
// them when a move resolves.
//
// Adding new effects = adding a new union variant + handling it in
// `MoveEffectRunner`. We deliberately avoid a closure-style API here so
// moves remain pure data and survive serialization.

export type StageTarget = "self" | "foe";

export type MoveEffect =
  | {
      kind: "stage";
      target: StageTarget;
      stat: StageKey;
      delta: number;
      chance?: number;
    }
  | { kind: "status"; target: StageTarget; status: StatusId; chance: number }
  | { kind: "heal"; target: "self"; pct: number } // 0..1
  | { kind: "rest" } // sleep + full heal
  | { kind: "priority"; bonus: number }; // turn-order priority

export interface Move {
  id: MoveId;
  name: string;
  type: ChatterType;
  category: MoveCategory;
  power: number; // 0 for status moves
  accuracy: number; // 100 = always hits
  effects: MoveEffect[];
  description: string;
  // Restriction tag for learnsets — see learnsets.ts.
  // "universal": any species can learn.
  // "typed":     only species whose primary type matches this move's type.
  // "signature": single species declared in `signatureFor`.
  scope: "universal" | "typed" | "signature";
  signatureFor?: string; // species id
}

export const MoveRegistry = new Registry<Move>("Move");
