import {
  Species,
  SpeciesRegistry,
  type LearnsetEntry,
} from "../../domain/species";
import { AQUACK_FRAMES } from "../../../chattermon/aquack";
import { defaultLearnset } from "./learnset-template";

class Aquack extends Species {
  readonly id = "aquack";
  readonly name = "Aquack";
  readonly type = "aqua" as const;
  readonly base = { hp: 55, atk: 45, def: 55, foc: 65, spd: 50 };
  readonly traitPool = ["swift", "lucky", "glutton"] as const;
  readonly learnset: readonly LearnsetEntry[] = defaultLearnset(
    "bubble",
    "bubble_barrage",
  );
  readonly starterEligible = true;
  readonly encounterable = false;
  readonly frames = AQUACK_FRAMES;
}

SpeciesRegistry.register(new Aquack());
