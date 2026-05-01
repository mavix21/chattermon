import { Species, SpeciesRegistry, type LearnsetEntry } from "../../domain/species";
import { CHATTER_FRAMES } from "../../../chattermon/chatter";
import { defaultLearnset } from "./learnset-template";

class Chatter extends Species {
  readonly id = "chatter";
  readonly name = "Chatter";
  readonly type = "flying" as const;
  readonly encounterable = false;
  readonly base = { hp: 45, atk: 40, def: 45, foc: 70, spd: 60 };
  readonly traitPool = ["cozy", "swift", "glutton"] as const;
  readonly learnset: readonly LearnsetEntry[] = defaultLearnset("gust", "lullaby");
  readonly frames = CHATTER_FRAMES;
}

SpeciesRegistry.register(new Chatter());
