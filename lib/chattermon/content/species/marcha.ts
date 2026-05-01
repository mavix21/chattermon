import { Species, SpeciesRegistry, type LearnsetEntry } from "../../domain/species";
import { MARCHA_FRAMES } from "../../../chattermon/marcha";
import { defaultLearnset } from "./learnset-template";

class Marcha extends Species {
  readonly id = "marcha";
  readonly name = "Marcha";
  readonly type = "plant" as const;
  readonly base = { hp: 52, atk: 62, def: 58, foc: 44, spd: 45 };
  readonly traitPool = ["sturdy", "forager", "brave"] as const;
  readonly learnset: readonly LearnsetEntry[] = defaultLearnset("vine_whip", "colony_call");
  readonly frames = MARCHA_FRAMES;
}

SpeciesRegistry.register(new Marcha());
