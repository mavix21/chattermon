// Player turn input as a Command object. Pattern: Command.
//
// Storing the player's intent as a value-object makes it easy to:
//   - render the right UI affordances given current FSM state,
//   - log/replay battles,
//   - extend with new actions (Bag/Swap/Run) without changing the FSM.

import type { ItemId, MoveId } from "../types";

export type BattleCommand =
  | { kind: "attack"; moveId: MoveId }
  | { kind: "item"; itemId: ItemId; targetIndex?: number }
  | { kind: "lure"; itemId: ItemId }
  | { kind: "swap"; partyIndex: number }
  | { kind: "run" };

export type CommandKind = BattleCommand["kind"];
