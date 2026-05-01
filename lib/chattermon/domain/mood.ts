// Mood system utilities. Pure functions — no I/O.
// Maps a numeric mood value (0–100) to named moods with battle modifiers.

import type { MoodId } from "./types";

// ── Mood resolution ───────────────────────────────────────────────────

export function moodFromValue(value: number): MoodId {
  if (value >= 90) return "ecstatic";
  if (value >= 70) return "happy";
  if (value >= 50) return "content";
  if (value >= 30) return "bored";
  if (value >= 15) return "tired";
  if (value >= 5) return "sad";
  return "angry";
}

export const MOOD_EMOJI: Record<MoodId, string> = {
  ecstatic: "🤩",
  happy: "😊",
  content: "😌",
  bored: "😐",
  tired: "😴",
  sad: "😢",
  angry: "😡",
};

export function clampMood(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

// ── Battle modifiers ──────────────────────────────────────────────────

export interface MoodBattleModifiers {
  accuracyMod: number;  // multiplier on move accuracy
  critBonus: number;    // added to crit chance
  damageMod: number;    // multiplier on outgoing damage
  evasionBonus: number; // added to evasion
}

const MODIFIERS: Record<MoodId, MoodBattleModifiers> = {
  ecstatic: { accuracyMod: 1.0, critBonus: 0.08, damageMod: 1.05, evasionBonus: 0.03 },
  happy:    { accuracyMod: 1.0, critBonus: 0.04, damageMod: 1.0,  evasionBonus: 0.01 },
  content:  { accuracyMod: 1.0, critBonus: 0,    damageMod: 1.0,  evasionBonus: 0 },
  bored:    { accuracyMod: 0.95, critBonus: 0,   damageMod: 0.95, evasionBonus: 0 },
  tired:    { accuracyMod: 0.88, critBonus: 0,    damageMod: 0.90, evasionBonus: -0.02 },
  sad:      { accuracyMod: 0.92, critBonus: 0,    damageMod: 0.90, evasionBonus: 0 },
  angry:    { accuracyMod: 0.85, critBonus: 0.06, damageMod: 1.10, evasionBonus: -0.05 },
};

export function moodBattleModifiers(mood: MoodId): MoodBattleModifiers {
  return MODIFIERS[mood];
}
