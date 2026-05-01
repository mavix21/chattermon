import { Species, SpeciesRegistry, type LearnsetEntry } from "../../domain/species";
import { HOOTS_FRAMES } from "../../../chattermon/hoots";
import { defaultLearnset } from "./learnset-template";

class Hoots extends Species {
  readonly id = "hoots";
  readonly name = "Hoots";
  readonly type = "psychic" as const;
  readonly base = { hp: 50, atk: 40, def: 50, foc: 75, spd: 55 };
  readonly traitPool = ["keen", "stoic", "glutton"] as const;
  readonly learnset: readonly LearnsetEntry[] = defaultLearnset("confusion", "mind_break");
  readonly frames = HOOTS_FRAMES;
}

SpeciesRegistry.register(new Hoots());
