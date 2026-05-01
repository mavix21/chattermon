import { Species, SpeciesRegistry, type LearnsetEntry } from "../../domain/species";
import { SPOOK_FRAMES } from "../../../chattermon/spook";
import { defaultLearnset } from "./learnset-template";

class Spook extends Species {
  readonly id = "spook";
  readonly name = "Spook";
  readonly type = "psychic" as const;
  readonly base = { hp: 40, atk: 38, def: 30, foc: 75, spd: 58 };
  readonly traitPool = ["keen", "cozy", "stoic"] as const;
  readonly learnset: readonly LearnsetEntry[] = defaultLearnset("confusion", "haunting_wail");
  readonly frames = SPOOK_FRAMES;
}

SpeciesRegistry.register(new Spook());
