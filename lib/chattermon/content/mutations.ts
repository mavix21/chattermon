import { MutationRegistry, type Mutation } from "../domain/mutation";

const MUTATIONS: Mutation[] = [
  {
    id: "shiny",
    name: "Shiny",
    weight: 35,
    multipliers: { hp: 1.05, atk: 1.05, def: 1.05, foc: 1.05, spd: 1.05 },
    flags: { altPalette: "shiny" },
  },
  {
    id: "tiny",
    name: "Tiny",
    weight: 12,
    multipliers: { atk: 0.9, spd: 1.2 },
    flags: { evadeBonus: 0.1 },
  },
  {
    id: "giant",
    name: "Giant",
    weight: 12,
    multipliers: { hp: 1.2, spd: 0.9 },
  },
  {
    id: "crystal",
    name: "Crystal",
    weight: 10,
    multipliers: { def: 1.2, spd: 0.9 },
  },
  {
    id: "twin_tailed",
    name: "Twin-tailed",
    weight: 10,
    multipliers: { foc: 1.15 },
  },
  {
    id: "albino",
    name: "Albino",
    weight: 8,
    multipliers: {},
    flags: { critBonus: 0.1, altPalette: "albino" },
  },
  {
    id: "echo",
    name: "Echo",
    weight: 7,
    multipliers: {},
    flags: { extraStrikeChance: 0.1 },
  },
  {
    id: "old_soul",
    name: "Old Soul",
    weight: 4,
    multipliers: {},
    flags: { startLevel: 5 },
  },
  {
    id: "glitched",
    name: "Glitched",
    weight: 2,
    multipliers: {},
    flags: { glitched: true },
  },
];

for (const m of MUTATIONS) MutationRegistry.register(m);
