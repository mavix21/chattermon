import { MoveRegistry, type Move } from "../../domain/move";

// One STAB-flavored move per type. Any species of that type can learn it
// at L5 via the shared learnset shape.
const MOVES: Move[] = [
  {
    id: "spark",
    name: "Spark",
    type: "electric",
    category: "physical",
    power: 45,
    accuracy: 100,
    effects: [
      { kind: "status", target: "foe", status: "paralyzed", chance: 0.1 },
    ],
    description: "Crackles with static; may paralyze.",
    scope: "typed",
  },
  {
    id: "ember",
    name: "Ember",
    type: "fire",
    category: "focus",
    power: 40,
    accuracy: 100,
    effects: [{ kind: "status", target: "foe", status: "burn", chance: 0.1 }],
    description: "A small flame; may burn.",
    scope: "typed",
  },
  {
    id: "powder_snow",
    name: "Powder Snow",
    type: "ice",
    category: "focus",
    power: 40,
    accuracy: 100,
    effects: [{ kind: "status", target: "foe", status: "freeze", chance: 0.1 }],
    description: "Frosty powder; may freeze.",
    scope: "typed",
  },
  {
    id: "bubble",
    name: "Bubble",
    type: "aqua",
    category: "focus",
    power: 40,
    accuracy: 100,
    effects: [
      { kind: "stage", target: "foe", stat: "spd", delta: -1, chance: 0.2 },
    ],
    description: "Sticky bubbles; may slow the foe.",
    scope: "typed",
  },
  {
    id: "vine_whip",
    name: "Vine Whip",
    type: "plant",
    category: "physical",
    power: 45,
    accuracy: 100,
    effects: [],
    description: "Lashes with whippy vines.",
    scope: "typed",
  },
  {
    id: "gust",
    name: "Gust",
    type: "flying",
    category: "focus",
    power: 40,
    accuracy: 100,
    effects: [],
    description: "A buffeting wind.",
    scope: "typed",
  },
  {
    id: "confusion",
    name: "Confusion",
    type: "psychic",
    category: "focus",
    power: 50,
    accuracy: 100,
    effects: [
      { kind: "status", target: "foe", status: "confused", chance: 0.1 },
    ],
    description: "A telepathic jolt; may confuse.",
    scope: "typed",
  },
];

for (const m of MOVES) MoveRegistry.register(m);
