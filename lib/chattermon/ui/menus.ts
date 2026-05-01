// Action-id constants. Keeping them in one place stops typos from leaking
// into the action handlers.

export const ActionIds = {
  Explore: "explore",
  Inventory: "inventory",
  Party: "party",
  Biome: "biome",
  Move: "move", // value = moveId
  Forget: "forget", // value = moveId | "__skip__"
  BattleLure: "battle_lure",
  BattleSwap: "battle_swap",
  BattleRun: "battle_run",
  BiomePick: "biome_pick", // value = biomeId
  BattleFaintSwap: "battle_faint_swap", // Fainted: switch to another chattermon
  BattleFaintRun: "battle_faint_run", // Fainted: run away
  BattleTeamSelect: "battle_team_select", // value = partyIndex
  // Bag / items
  BagUse: "bag_use", // value = itemId (self-use or opens target picker)
  BagUseTarget: "bag_use_target", // value = `${itemId}:${partyIndex}`
  Return: "return", // value = submenu target (bag | main | swap)
  // Recover flow
  Recover: "recover", // open fainted-member picker
  RecoverTarget: "recover_target", // value = partyIndex
  // Blackout explore
  SafeExplore: "safe_explore",
  // Team management
  SetLead: "set_lead", // value = partyIndex
  // Care / mood
  Care: "care",
  Feed: "feed",       // value = partyIndex (lead = 0)
  Play: "play",       // costs 1⚡, has cooldown
} as const;

export type ActionId = (typeof ActionIds)[keyof typeof ActionIds];
