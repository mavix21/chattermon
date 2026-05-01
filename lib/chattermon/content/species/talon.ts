import { Species, SpeciesRegistry, type LearnsetEntry } from "../../domain/species";
import { TALON_FRAMES } from "../../../chattermon/talon";
import { defaultLearnset } from "./learnset-template";

class Talon extends Species {
  readonly id = "talon";
  readonly name = "Talon";
  readonly type = "flying" as const;
  readonly encounterable = false;
  readonly base = { hp: 45, atk: 70, def: 35, foc: 45, spd: 70 };
  readonly traitPool = ["keen", "brave", "swift"] as const;
  readonly learnset: readonly LearnsetEntry[] = defaultLearnset("gust", "sky_dive");
  readonly frames = TALON_FRAMES;
}

SpeciesRegistry.register(new Talon());
