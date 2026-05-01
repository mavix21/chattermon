// Top-level barrel. Importing this once boots all registries and exposes
// the key services for the bot composition root.
import "./content";

export { Chattermon } from "./domain/chattermon";
export { SpeciesRegistry } from "./domain/species";
export { MoveRegistry } from "./domain/move";
export { TraitRegistry } from "./domain/trait";
export { NatureRegistry } from "./domain/nature";
export { MutationRegistry } from "./domain/mutation";
export { ItemRegistry } from "./domain/item";
export { BiomeRegistry } from "./content/biomes";

export { HatchService } from "./services/hatch.service";
export {
  ExploreService,
  allFainted,
  anyFainted,
} from "./services/explore.service";
export { BattleService } from "./services/battle.service";
export { LevelUpService } from "./services/level-up.service";
export {
  refillEnergy,
  ENERGY_MAX,
  msUntilNextEnergy,
} from "./services/energy.service";
export {
  ItemService,
  isBagUsable,
  requiresTarget,
} from "./services/item.service";
export { recover, RECOVER_COST } from "./services/recover.service";

export { PlayerRepository, emptyPlayer } from "./persistence/player.repository";
export { UiStateStore } from "./persistence/ui-state";
export { fromSnapshot, toSnapshot } from "./persistence/serialize";

export { createRng } from "./domain/rng";
export type { Rng } from "./domain/rng";

export { ActionIds } from "./ui/menus";
export * as Cards from "./ui/cards";
