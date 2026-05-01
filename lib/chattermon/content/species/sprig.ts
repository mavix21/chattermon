import { Species, SpeciesRegistry, type LearnsetEntry } from "../../domain/species";
import { SPRIG_FRAMES } from "../../../chattermon/sprig";
import { defaultLearnset } from "./learnset-template";

class Sprig extends Species {
  readonly id = "sprig";
  readonly name = "Sprig";
  readonly type = "plant" as const;
  readonly encounterable = false;
  readonly base = { hp: 60, atk: 35, def: 65, foc: 65, spd: 40 };
  readonly traitPool = ["cozy", "stoic", "greedy"] as const;
  readonly learnset: readonly LearnsetEntry[] = defaultLearnset("vine_whip", "bloom_burst");
  readonly frames = SPRIG_FRAMES;
}

SpeciesRegistry.register(new Sprig());
