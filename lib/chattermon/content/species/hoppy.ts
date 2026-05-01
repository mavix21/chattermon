import {
  Species,
  SpeciesRegistry,
  type LearnsetEntry,
} from "../../domain/species";
import { HOPPY_FRAMES } from "../../../chattermon/rabbit";
import { defaultLearnset } from "./learnset-template";

class Hoppy extends Species {
  readonly id = "hoppy";
  readonly name = "Hoppy";
  readonly type = "electric" as const;
  readonly base = { hp: 50, atk: 55, def: 40, foc: 50, spd: 65 };
  readonly traitPool = ["swift", "sparky", "keen"] as const;
  readonly learnset: readonly LearnsetEntry[] = defaultLearnset(
    "spark",
    "volt_tackle",
  );
  readonly starterEligible = true;
  readonly encounterable = false;
  readonly frames = HOPPY_FRAMES;
}

SpeciesRegistry.register(new Hoppy());
