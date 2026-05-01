import { TraitRegistry, type Trait } from "../domain/trait";

// Traits are listed strongest-effect-first within their semantic group so the
// reader can skim the file like a balance sheet.

const TRAITS: Trait[] = [
  {
    id: "brave",
    name: "Brave",
    description: "+20% damage when HP is below 33%.",
    attach: ({ bus, self, selfSide }) =>
      bus.on("damage:incoming", (p) => {
        if (p.attackerSide !== selfSide || p.attacker !== self) return;
        if (self.hp / self.stats().hp < 0.33)
          p.amount = Math.round(p.amount * 1.2);
      }),
  },
  {
    id: "sturdy",
    name: "Sturdy",
    description: "Survives a one-shot with 1 HP if at full HP.",
    attach: ({ bus, self, selfSide }) =>
      bus.on("damage:incoming", (p) => {
        if (p.defenderSide !== selfSide || p.defender !== self) return;
        if (self.hp >= self.stats().hp && p.amount >= self.hp)
          p.amount = self.hp - 1;
      }),
  },
  {
    id: "swift",
    name: "Swift",
    description: "+10% Speed.",
    multipliers: { spd: 1.1 },
  },
  {
    id: "keen",
    name: "Keen",
    description: "+10% critical-hit chance.",
    // Read by damage service via Chattermon.critBonus().
  },
  {
    id: "stoic",
    name: "Stoic",
    description: "Takes 10% less damage when below 50% HP.",
    attach: ({ bus, self, selfSide }) =>
      bus.on("damage:incoming", (p) => {
        if (p.defenderSide !== selfSide || p.defender !== self) return;
        if (self.hp / self.stats().hp < 0.5)
          p.amount = Math.round(p.amount * 0.9);
      }),
  },
  {
    id: "lucky",
    name: "Lucky",
    description: "+25% item drop rate from Explore.",
    exploreItemBonus: 0.25,
  },
  {
    id: "greedy",
    name: "Greedy",
    description: "+25% XP gain.",
    xpBonus: 0.25,
  },
  {
    id: "forager",
    name: "Forager",
    description: "+10% encounter rate while leading the party.",
    encounterRateBonus: 0.1,
  },
  {
    id: "cozy",
    name: "Cozy",
    description: "Regenerates 1/16 of max HP each turn.",
    attach: ({ bus, self, selfSide }) =>
      bus.on("turn:end", (p) => {
        if (p.active !== selfSide) return;
        const max = self.stats().hp;
        self.hp = Math.min(max, self.hp + Math.max(1, Math.floor(max / 16)));
      }),
  },
  {
    id: "glutton",
    name: "Glutton",
    description: "Auto-eats a berry from the bag at <33% HP, once per battle.",
    // Wired by battle service when berries are present.
  },
  {
    id: "sparky",
    name: "Sparky",
    description: "10% chance to paralyze on contact.",
    // Status hook applied in damage pipeline (see damage.ts).
  },
  {
    id: "echo",
    name: "Echo",
    description: "10% chance moves strike twice (second hit −50%).",
    // Read by damage pipeline.
  },
];

for (const t of TRAITS) TraitRegistry.register(t);
