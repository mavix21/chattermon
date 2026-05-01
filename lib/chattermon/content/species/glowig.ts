import {
  Species,
  SpeciesRegistry,
  type LearnsetEntry,
} from "../../domain/species";
import { GLOWIG_FRAMES } from "../../../chattermon/glowig";
import { defaultLearnset } from "./learnset-template";

class Glowig extends Species {
  readonly id = "glowig";
  readonly name = "Glowig";
  readonly type = "electric" as const;
  readonly base = { hp: 42, atk: 45, def: 38, foc: 60, spd: 64 };
  readonly traitPool = ["sparky", "lucky", "swift"] as const;
  readonly learnset: readonly LearnsetEntry[] = defaultLearnset(
    "spark",
    "lantern_pulse",
  );
  readonly frames = GLOWIG_FRAMES;
}

SpeciesRegistry.register(new Glowig());
