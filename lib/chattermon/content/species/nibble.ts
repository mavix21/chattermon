import { Species, SpeciesRegistry, type LearnsetEntry } from "../../domain/species";
import { NIBBLE_FRAMES } from "../../../chattermon/nibble";
import { defaultLearnset } from "./learnset-template";

class Nibble extends Species {
  readonly id = "nibble";
  readonly name = "Nibble";
  readonly type = "plant" as const;
  readonly encounterable = false;
  readonly base = { hp: 65, atk: 60, def: 60, foc: 40, spd: 40 };
  readonly traitPool = ["glutton", "sturdy", "greedy"] as const;
  readonly learnset: readonly LearnsetEntry[] = defaultLearnset("vine_whip", "chomp");
  readonly frames = NIBBLE_FRAMES;
}

SpeciesRegistry.register(new Nibble());
