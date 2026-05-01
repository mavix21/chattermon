import { Registry } from "../registry/registry";
import type { NatureId, StatKey } from "./types";

// Pattern: value-object + Registry. Natures are static, immutable, and
// looked up by id at hatch time and during stat resolution.
export interface Nature {
  id: NatureId;
  name: string;
  boost: StatKey | null;
  drop: StatKey | null;
}

export const NatureRegistry = new Registry<Nature>("Nature");

export function natureMultipliers(
  nature: Nature,
): Partial<Record<StatKey, number>> {
  if (!nature.boost && !nature.drop) return {};
  const m: Partial<Record<StatKey, number>> = {};
  if (nature.boost) m[nature.boost] = 1.1;
  if (nature.drop) m[nature.drop] = 0.9;
  return m;
}
