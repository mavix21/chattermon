import { Species, SpeciesRegistry, type LearnsetEntry } from "../../domain/species";
import { EMBERLEA_FRAMES } from "../../../chattermon/emberlea";
import { defaultLearnset } from "./learnset-template";

class Emberlea extends Species {
  readonly id = "emberlea";
  readonly name = "Emberlea";
  readonly type = "fire" as const;
  readonly base = { hp: 55, atk: 70, def: 45, foc: 55, spd: 45 };
  readonly traitPool = ["brave", "keen", "sturdy"] as const;
  readonly learnset: readonly LearnsetEntry[] = defaultLearnset("ember", "lions_roar");
  readonly frames = EMBERLEA_FRAMES;
}

SpeciesRegistry.register(new Emberlea());
