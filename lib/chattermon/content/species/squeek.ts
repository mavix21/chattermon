import { Species, SpeciesRegistry, type LearnsetEntry } from "../../domain/species";
import { SQUEEK_FRAMES } from "../../../chattermon/squeek";
import { defaultLearnset } from "./learnset-template";

class Squeek extends Species {
  readonly id = "squeek";
  readonly name = "Squeek";
  readonly type = "normal" as const;
  readonly base = { hp: 44, atk: 48, def: 35, foc: 40, spd: 72 };
  readonly traitPool = ["swift", "keen", "lucky"] as const;
  readonly learnset: readonly LearnsetEntry[] = defaultLearnset("tackle", "scurry_blitz");
  readonly frames = SQUEEK_FRAMES;
}

SpeciesRegistry.register(new Squeek());
