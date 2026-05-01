// Player repository. Pattern: Repository.
//
// Wraps the chat-sdk Thread state adapter so the rest of the system never
// talks to the state store directly. Today we use thread-scoped state
// (one DM per user); switching to a per-user/global Redis key would mean
// editing only this file.

import type { Thread } from "chat";
import { PLAYER_SNAPSHOT_VERSION, type PlayerSnapshot } from "./snapshots";

const STATE_KEY = "chattermon" as const;

interface ThreadStateShape {
  [STATE_KEY]?: PlayerSnapshot;
  ui?: unknown; // see ui-state.ts
}

// We accept any Thread shape and assert internally — this lets callers pass
// the unparameterized `Thread` they receive from event handlers without
// having to fan generics through the entire codebase.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyThread = Thread<any, any>;

export class PlayerRepository {
  private readonly thread: Thread<ThreadStateShape>;

  constructor(thread: AnyThread) {
    this.thread = thread as unknown as Thread<ThreadStateShape>;
  }

  async load(): Promise<PlayerSnapshot | null> {
    const state = await this.thread.state;
    const snap = state?.[STATE_KEY];
    if (!snap) return null;
    if (snap.v !== PLAYER_SNAPSHOT_VERSION) {
      // Future migrations live here. For now any older shape is dropped.
      return null;
    }
    return snap;
  }

  async save(snap: PlayerSnapshot): Promise<void> {
    await this.thread.setState({ [STATE_KEY]: snap });
  }

  async exists(): Promise<boolean> {
    return (await this.load()) !== null;
  }
}

export function emptyPlayer(): PlayerSnapshot {
  return {
    v: PLAYER_SNAPSHOT_VERSION,
    party: [],
    box: [],
    energy: 20,
    energyUpdatedAt: Date.now(),
    inventory: { basic_lure: 3, sweet_berry: 2 },
    captures: 0,
    biome: "meadow",
    eggs: [],
  };
}
