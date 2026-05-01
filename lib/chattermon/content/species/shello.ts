import { Species, SpeciesRegistry, type LearnsetEntry } from "../../domain/species";
import { SHELLO_FRAMES } from "../../../chattermon/shello";
import { defaultLearnset } from "./learnset-template";

class Shello extends Species {
  readonly id = "shello";
  readonly name = "Shello";
  readonly type = "aqua" as const;
  readonly base = { hp: 60, atk: 40, def: 72, foc: 50, spd: 28 };
  readonly traitPool = ["sturdy", "stoic", "cozy"] as const;
  readonly learnset: readonly LearnsetEntry[] = defaultLearnset("bubble", "shell_slam");
  readonly frames = SHELLO_FRAMES;
}

SpeciesRegistry.register(new Shello());
