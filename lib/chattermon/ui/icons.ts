// Centralized emoji set so the UI feels coherent and we never have a
// rogue emoji hiding in some other file.

import type { ChatterType, StatusId } from "../domain/types";

export const TYPE_ICON: Record<ChatterType, string> = {
  normal: "▫️",
  electric: "⚡",
  fire: "🔥",
  ice: "❄️",
  aqua: "💧",
  plant: "🌿",
  flying: "💨",
  psychic: "🔮",
};

export const STATUS_ICON: Record<StatusId, string> = {
  paralyzed: "⚡",
  burn: "🔥",
  freeze: "❄️",
  confused: "💫",
  asleep: "💤",
};

export const ACTION_ICON = {
  explore: "🌲",
  inventory: "🎒",
  team: "👥",
  travel: "🗺️",
  back: "↩️",
  lure: "🎣",
  swap: "🔄",
  run: "🏃",
  attack: "⚔️",
  victory: "🏆",
  defeat: "💀",
  captured: "🎉",
  fled: "💨",
  recover: "❤️‍🩹",
  safe: "🧭",
  use: "✨",
  care: "🎀",
  feed: "🍎",
  play: "🎮",
} as const;
