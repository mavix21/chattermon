import { NatureRegistry, type Nature } from "../domain/nature";
import type { StatKey } from "../domain/types";

// 5 stats x 4 = 20 natures. HP excluded (kept readable in chat).
const NATURE_GRID: Record<StatKey, Record<StatKey, string | null>> = {
  hp: { hp: null, atk: null, def: null, foc: null, spd: null },
  atk: { hp: null, atk: "Plain", def: "Bold", foc: "Modest", spd: "Eager" },
  def: { hp: null, atk: "Brash", def: "Steady", foc: "Mild", spd: "Sneaky" },
  foc: { hp: null, atk: "Hasty", def: "Stoic", foc: "Calm", spd: "Cheeky" },
  spd: { hp: null, atk: "Heavy", def: "Stiff", foc: "Quiet", spd: "Idle" },
};

const NEUTRALS = new Set(["Plain", "Steady", "Calm", "Idle"]);
// "Patient" replaces a duplicate slot to give us 5 distinct neutrals.
function natureFor(boost: StatKey, drop: StatKey, name: string): Nature {
  const isNeutral = boost === drop || NEUTRALS.has(name);
  return {
    id: name.toLowerCase(),
    name,
    boost: isNeutral ? null : boost,
    drop: isNeutral ? null : drop,
  };
}

const STATS: StatKey[] = ["atk", "def", "foc", "spd"];
for (const b of STATS) {
  for (const d of STATS) {
    const name = NATURE_GRID[b][d];
    if (name) NatureRegistry.register(natureFor(b, d, name));
  }
}

// Add a fifth neutral so randomization stays uniform across the 5 stat axes.
NatureRegistry.register({
  id: "patient",
  name: "Patient",
  boost: null,
  drop: null,
});
