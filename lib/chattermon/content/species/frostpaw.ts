import { Species, SpeciesRegistry, type LearnsetEntry } from "../../domain/species";
import { POLARBEAR_FRAMES } from "../../../chattermon/frostpaw";
import { defaultLearnset } from "./learnset-template";

class Frostpaw extends Species {
  readonly id = "frostpaw";
  readonly name = "Frostpaw";
  readonly type = "ice" as const;
  readonly base = { hp: 70, atk: 50, def: 65, foc: 55, spd: 30 };
  readonly traitPool = ["sturdy", "stoic", "cozy"] as const;
  readonly learnset: readonly LearnsetEntry[] = defaultLearnset("powder_snow", "blizzard_breath");
  readonly frames = POLARBEAR_FRAMES;
}

SpeciesRegistry.register(new Frostpaw());
