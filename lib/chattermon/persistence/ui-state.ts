// Transient UI state keyed alongside the persistent player snapshot.
//
// We keep "what is the player currently looking at" separate from the
// player save data so that accidentally shipping a corrupt UI step
// doesn't damage long-term progress.

import type { Thread } from "chat";
import type { ChattermonSnapshot } from "./snapshots";
import type { ItemId, MoveId } from "../domain/types";

export type UiState =
  | { kind: "idle" }
  | {
      kind: "battle";
      wild: ChattermonSnapshot;
      player: ChattermonSnapshot;
      turn: number;
    }
  | { kind: "learn-move"; chattermonId: string; pending: MoveId; level: number }
  | { kind: "lure"; lureId: ItemId };

const KEY = "ui" as const;

interface Shape {
  [KEY]?: UiState;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyThread = Thread<any, any>;

export class UiStateStore {
  private readonly thread: Thread<Shape>;
  constructor(thread: AnyThread) {
    this.thread = thread as unknown as Thread<Shape>;
  }
  async get(): Promise<UiState> {
    const s = await this.thread.state;
    return s?.[KEY] ?? { kind: "idle" };
  }
  async set(ui: UiState): Promise<void> {
    await this.thread.setState({ [KEY]: ui });
  }
  async clear(): Promise<void> {
    await this.thread.setState({ [KEY]: { kind: "idle" } });
  }
}
