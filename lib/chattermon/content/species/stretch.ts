import {
  Species,
  SpeciesRegistry,
  type LearnsetEntry,
} from "../../domain/species";
import { DOG_FRAMES } from "../../../chattermon/stretch";
import { defaultLearnset } from "./learnset-template";

// Normal-type — its "STAB" is just another universal physical move.
class Stretch extends Species {
  readonly id = "stretch";
  readonly name = "Stretch";
  readonly type = "normal" as const;
  readonly base = { hp: 60, atk: 60, def: 60, foc: 40, spd: 55 };
  readonly traitPool = ["brave", "swift", "lucky"] as const;
  readonly learnset: readonly LearnsetEntry[] = defaultLearnset(
    "headbutt",
    "stretch_punch",
  );
  readonly starterEligible = true;
  readonly frames = DOG_FRAMES;
}

SpeciesRegistry.register(new Stretch());
