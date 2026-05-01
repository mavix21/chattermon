// Mood service: time-based decay + event-based mood changes.
// Pure functions operating on snapshots — no I/O.

import { clampMood } from "../domain/mood";
import type {
  ChattermonSnapshot,
  PlayerSnapshot,
} from "../persistence/snapshots";

// ── Time decay ────────────────────────────────────────────────────────

const LEAD_DECAY_MS = 30 * 60 * 1000;    // -1 per 30 min
const BENCH_DECAY_MS = 20 * 60 * 1000;   // -1 per 20 min
const LEAD_FLOOR = 15;   // lead can't drop below "tired" from time alone
const BENCH_FLOOR = 5;   // benched can't drop below "sad" from time alone
// Extreme neglect: after this threshold, benched mons can decay to 0 (angry)
const EXTREME_NEGLECT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Play cooldown: max 3 plays per hour
export const PLAY_COOLDOWN_MS = 20 * 60 * 1000; // 20 min between plays
export const PLAY_ENERGY_COST = 1;

/**
 * Tick mood for all party members based on elapsed time.
 * Call alongside refillEnergy at every main-menu render.
 */
export function tickMood(
  player: PlayerSnapshot,
  now = Date.now(),
): PlayerSnapshot {
  const party = player.party.map((snap, i) => {
    const isLead = i === 0;
    const elapsed = Math.max(0, now - (snap.lastInteractedAt ?? now));
    const interval = isLead ? LEAD_DECAY_MS : BENCH_DECAY_MS;
    const ticks = Math.floor(elapsed / interval);
    if (ticks <= 0) return snap;

    const currentMood = snap.mood ?? 50;
    // Determine floor: extreme neglect (>7d) removes the floor entirely
    let floor: number;
    if (elapsed >= EXTREME_NEGLECT_MS) {
      floor = 0; // can reach angry
    } else {
      floor = isLead ? LEAD_FLOOR : BENCH_FLOOR;
    }
    const newMood = clampMood(Math.max(floor, currentMood - ticks));
    if (newMood === currentMood) return snap;
    return {
      ...snap,
      mood: newMood,
      // Advance timestamp by consumed ticks so we don't re-decay
      lastInteractedAt: (snap.lastInteractedAt ?? now) + ticks * interval,
    };
  });
  return { ...player, party };
}

// ── Event-based mood changes ──────────────────────────────────────────

export type MoodEvent =
  | { kind: "battle_win" }
  | { kind: "battle_loss" }
  | { kind: "battle_fled" }
  | { kind: "captured" }
  | { kind: "found_item" }
  | { kind: "fed" }
  | { kind: "played" }
  | { kind: "level_up" }
  | { kind: "fainted" }
  | { kind: "noticed" };  // swapped to lead when bored/angry

const MOOD_DELTAS: Record<MoodEvent["kind"], number> = {
  battle_win: 8,
  battle_loss: -12,
  battle_fled: -3,
  captured: 10,
  found_item: 3,
  fed: 10,
  played: 20,
  level_up: 5,
  fainted: -8,
  noticed: 5,
};

/**
 * Apply a mood event to a single chattermon snapshot.
 * Also resets lastInteractedAt.
 */
export function applyMoodEvent(
  snap: ChattermonSnapshot,
  event: MoodEvent,
  now = Date.now(),
): ChattermonSnapshot {
  const delta = MOOD_DELTAS[event.kind];
  const currentMood = snap.mood ?? 50;
  return {
    ...snap,
    mood: clampMood(currentMood + delta),
    lastInteractedAt: now,
  };
}

/**
 * Apply mood event to the lead (party[0]) and return updated player.
 */
export function applyLeadMoodEvent(
  player: PlayerSnapshot,
  event: MoodEvent,
  now = Date.now(),
): PlayerSnapshot {
  if (player.party.length === 0) return player;
  const lead = applyMoodEvent(player.party[0], event, now);
  return { ...player, party: [lead, ...player.party.slice(1)] };
}

/**
 * Check if a play action is allowed (cooldown-based).
 * Returns ms until next allowed play, or 0 if allowed now.
 */
export function playWaitMs(snap: ChattermonSnapshot, now = Date.now()): number {
  const lastPlayed = snap.lastInteractedAt ?? 0;
  const elapsed = now - lastPlayed;
  return Math.max(0, PLAY_COOLDOWN_MS - elapsed);
}
