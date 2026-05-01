import { ItemRegistry, type Item } from "../domain/item";

const ITEMS: Item[] = [
  {
    id: "basic_lure",
    name: "Basic Lure",
    kind: "lure",
    description: "Catches weakened wild chattermon.",
    lureMod: 1.0,
  },
  {
    id: "greater_lure",
    name: "Greater Lure",
    kind: "lure",
    description: "60% better catch rate than Basic.",
    lureMod: 1.6,
  },
  {
    id: "master_lure",
    name: "Master Lure",
    kind: "lure",
    description: "Always catches a wild chattermon.",
    lureMod: Number.POSITIVE_INFINITY,
  },

  {
    id: "sweet_berry",
    name: "Sweet Berry",
    kind: "berry",
    description: "Heals 30% of max HP.",
    healPct: 0.3,
  },
  {
    id: "spicy_berry",
    name: "Spicy Berry",
    kind: "berry",
    description: "Cures status conditions.",
    curesStatus: true,
  },
  {
    id: "bitter_berry",
    name: "Bitter Berry",
    kind: "berry",
    description: "Raises a stat in battle.",
    healPct: 0,
  },

  {
    id: "potion",
    name: "Potion",
    kind: "potion",
    description: "Heals 50% of max HP.",
    healPct: 0.5,
  },
  {
    id: "revive",
    name: "Revive",
    kind: "potion",
    description: "Revives a fainted chattermon to 50% HP.",
    revivePct: 0.5,
  },
  {
    id: "max_revive",
    name: "Max Revive",
    kind: "potion",
    description: "Fully revives a fainted chattermon.",
    revivePct: 1.0,
  },

  {
    id: "snack_bar",
    name: "Snack Bar",
    kind: "snack",
    description: "Restores 5 energy.",
    energyRestore: 5,
  },

  {
    id: "egg",
    name: "Egg",
    kind: "egg",
    description: "Hatches after 5 explores.",
  },

  {
    id: "stat_tonic",
    name: "Stat Tonic",
    kind: "tonic",
    description: "Permanently boosts one stat by 1.",
  },

  {
    id: "fire_stone",
    name: "Fire Stone",
    kind: "stone",
    description: "Triggers some fire-type evolutions.",
    stoneId: "fire",
  },
  {
    id: "ice_stone",
    name: "Ice Stone",
    kind: "stone",
    description: "Triggers some ice-type evolutions.",
    stoneId: "ice",
  },
  {
    id: "leaf_stone",
    name: "Leaf Stone",
    kind: "stone",
    description: "Triggers some plant-type evolutions.",
    stoneId: "leaf",
  },
  {
    id: "thunder_stone",
    name: "Thunder Stone",
    kind: "stone",
    description: "Triggers some electric-type evolutions.",
    stoneId: "thunder",
  },
  {
    id: "moon_stone",
    name: "Moon Stone",
    kind: "stone",
    description: "Triggers some psychic-type evolutions.",
    stoneId: "moon",
  },
];

for (const i of ITEMS) ItemRegistry.register(i);
