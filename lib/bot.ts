// Composition root. Wires Telegram adapter, state, and event handlers
// onto the domain services. All gameplay logic lives in `lib/chattermon`;
// this file only does request → service → response plumbing.

import { Chat } from "chat";
import { createTelegramAdapter } from "@chat-adapter/telegram";
import { createMemoryState } from "@chat-adapter/state-memory";
import { createRedisState } from "@chat-adapter/state-redis";
import { setTimeout as wait } from "timers/promises";

import {
  ActionIds,
  BattleService,
  Cards,
  ExploreService,
  HatchService,
  ItemService,
  PlayerRepository,
  RECOVER_COST,
  UiStateStore,
  createRng,
  emptyPlayer,
  fromSnapshot,
  recover,
  refillEnergy,
  requiresTarget,
  toSnapshot,
} from "./chattermon";
import { ItemRegistry } from "./chattermon/domain/item";
import { playAsciiAnimation } from "./chattermon/animate";
import { EGG_HATCH_FRAMES } from "./chattermon/egg";
import { BattleArena } from "./chattermon/domain/battle/arena";
import type { BattleStep, BattleFrame } from "./chattermon/domain/battle/arena";
import { BiomeRegistry } from "./chattermon/content/biomes";
import { Actions, Button, Card, CardText } from "chat";
import type { SentMessage, Thread } from "chat";
import type {
  ChattermonSnapshot,
  PlayerSnapshot,
} from "./chattermon/persistence/snapshots";
import {
  battleSceneCard,
  teamSelectCard,
  teamSwapPrompt,
} from "./chattermon/ui/battle-scene";
import { hatchInfoTable } from "./chattermon/ui/hatch-table";
import { ACTION_ICON } from "./chattermon/ui/icons";

// Threads we receive from event handlers are unparameterized; using
// `Thread<any, any>` here lets us pass them directly to helpers without
// forcing every helper to thread a TState generic through the call site.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyThread = Thread<any, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySent = SentMessage<any>;

// ── State adapter selection ───────────────────────────────────────────
const state = process.env.REDIS_URL
  ? createRedisState({ url: process.env.REDIS_URL })
  : createMemoryState();

// ── Bot ───────────────────────────────────────────────────────────────
const bot = new Chat({
  userName: "hello_bot",
  adapters: { telegram: createTelegramAdapter({ mode: "auto" }) },
  state,
});

// ── Service singletons ────────────────────────────────────────────────
const rng = createRng();
const hatchService = new HatchService(rng);
const exploreService = new ExploreService(hatchService, rng);
const battleService = new BattleService(rng);
const itemService = new ItemService();

// Animation pacing — tuned for "readable, not sluggish".
const FRAME_MS = 1100; // narration line duration
const INTRO_MS = 1500; // wild-appears intro

// In-memory active battle arenas, keyed by thread id. The Arena is the
// game state; the SentMessage is the single chat message we keep editing
// to animate everything in-place.
//
// `busy` is the orchestration-layer lock that complements the Arena's
// internal FSM. The FSM transitions through `resolve_turn → check_end →
// await_player` synchronously inside `submit()`, so by the time we start
// playing the narration animation the FSM is already back to
// `await_player` and would happily accept another command. `busy` covers
// that gap: while frames are being painted, all battle action handlers
// no-op early. Buttons still render (disabled) so the layout stays put.
interface ActiveBattle {
  arena: BattleArena;
  sent: AnySent;
  busy: boolean;
}
const arenas = new Map<string, ActiveBattle>();

// ──────────────────────────────────────────────────────────────────────
// Mention → first-time hatch or main menu
// ──────────────────────────────────────────────────────────────────────
bot.onNewMention(async (thread) => {
  await thread.subscribe();
  const repo = new PlayerRepository(thread);
  const existing = await repo.load();
  if (existing && existing.party.length > 0) {
    await sendMainMenu(thread, existing);
    return;
  }
  await firstTimeHatch(thread, repo);
});

// Free-text after the initial mention is intentionally a no-op — players
// drive the game via buttons. Re-mentioning the bot brings the main menu
// back up.

// ──────────────────────────────────────────────────────────────────────
// Action handlers — one per button id
// ──────────────────────────────────────────────────────────────────────
bot.onAction(ActionIds.Explore, async (event) => {
  if (!event.thread) return;
  await handleExplore(event.thread, { safe: false });
});

bot.onAction(ActionIds.SafeExplore, async (event) => {
  if (!event.thread) return;
  await handleExplore(event.thread, { safe: true });
});

bot.onAction(ActionIds.Inventory, async (event) => {
  if (!event.thread) return;
  const player = await new PlayerRepository(event.thread).load();
  if (!player) return;
  await event.thread.post(Cards.bagCard(player));
});

// Step 1 of bag flow: user tapped Use on an item. Branch on whether
// the item needs a target (berry/potion) or is self-applied (snack).
bot.onAction(ActionIds.BagUse, async (event) => {
  if (!event.thread || !event.value) return;
  const repo = new PlayerRepository(event.thread);
  const player = await repo.load();
  if (!player) return;
  if ((player.inventory[event.value] ?? 0) <= 0) {
    await event.thread.post("You don't have that item anymore.");
    return;
  }
  const item = ItemRegistry.tryGet(event.value);
  if (!item) return;

  if (requiresTarget(item)) {
    await event.thread.post(Cards.bagTargetCard(player, event.value));
    return;
  }

  // Self-apply path.
  const r = itemService.useSelf(player, event.value);
  if (!r.ok) {
    await event.thread.post(r.reason);
    return;
  }
  await repo.save(r.player);
  await event.thread.post(r.message);
  await sendMainMenu(event.thread, r.player);
});

// Step 2 of bag flow: target picked. Value is `${itemId}:${partyIndex}`.
bot.onAction(ActionIds.BagUseTarget, async (event) => {
  if (!event.thread || !event.value) return;
  const [itemId, idxStr] = event.value.split(":");
  const partyIndex = parseInt(idxStr, 10);
  if (!itemId || Number.isNaN(partyIndex)) return;

  const repo = new PlayerRepository(event.thread);
  const player = await repo.load();
  if (!player) return;

  const r = itemService.useOnMember(player, itemId, partyIndex);
  if (!r.ok) {
    await event.thread.post(r.reason);
    return;
  }
  await repo.save(r.player);
  await event.thread.post(r.message);
  await sendMainMenu(event.thread, r.player);
});

bot.onAction(ActionIds.Return, async (event) => {
  if (!event.thread) return;
  const player = await new PlayerRepository(event.thread).load();
  if (!player) return;

  if (event.value === "bag") {
    await event.thread.post(Cards.bagCard(player));
    return;
  }

  if (event.value === "swap") {
    const active = arenas.get(event.thread.id);
    if (active && active.arena.fsm.current() === "await_swap") {
      const party = active.arena.playerParty.map((c) => toSnapshot(c));
      await event.thread.post(teamSwapPrompt(party));
      return;
    }
  }

  await sendMainMenu(event.thread, player);
});

bot.onAction(ActionIds.Recover, async (event) => {
  if (!event.thread) return;
  const player = await new PlayerRepository(event.thread).load();
  if (!player) return;
  if (player.energy < RECOVER_COST) {
    await event.thread.post(`You need ${RECOVER_COST}⚡ to Recover.`);
    return;
  }
  const hasFainted = player.party.some((s) => fromSnapshot(s).isFainted());
  if (!hasFainted) {
    await event.thread.post("No fainted chattermon to revive.");
    return;
  }
  await new UiStateStore(event.thread).set({ kind: "idle" });
  await event.thread.post(Cards.recoverTargetCard(player));
});

bot.onAction(ActionIds.RecoverTarget, async (event) => {
  if (!event.thread || !event.value) return;
  const partyIndex = parseInt(event.value, 10);
  if (Number.isNaN(partyIndex)) return;
  const repo = new PlayerRepository(event.thread);
  const player = await repo.load();
  if (!player) return;

  const r = recover(player, partyIndex);
  if (!r.ok) {
    await event.thread.post(r.reason);
    return;
  }
  await repo.save(r.player);
  await event.thread.post(`${ACTION_ICON.recover} ${r.message}`);
  await sendMainMenu(event.thread, r.player);
});

bot.onAction(ActionIds.Party, async (event) => {
  if (!event.thread) return;
  const player = await new PlayerRepository(event.thread).load();
  if (!player) return;
  await event.thread.post(
    Card({
      title: `${ACTION_ICON.team} Team`,
      children: [CardText(Cards.partyCardMarkdown(player))],
    }),
  );
});

bot.onAction(ActionIds.Biome, async (event) => {
  if (!event.thread) return;
  const player = await new PlayerRepository(event.thread).load();
  if (!player) return;
  const choices = BiomeRegistry.all().map((b) =>
    Button({
      id: ActionIds.BiomePick,
      value: b.id,
      label: `${b.name}${player.captures < b.unlockCaptures ? ` 🔒 ${b.unlockCaptures}` : ""}`,
      disabled: player.captures < b.unlockCaptures,
    }),
  );
  await event.thread.post(
    Card({
      title: `${ACTION_ICON.travel} Travel`,
      subtitle: `Currently in ${BiomeRegistry.get(player.biome).name}`,
      children: [Actions(choices)],
    }),
  );
});

bot.onAction(ActionIds.BiomePick, async (event) => {
  if (!event.thread) return;
  const repo = new PlayerRepository(event.thread);
  const player = await repo.load();
  if (!player) return;
  const biome = BiomeRegistry.tryGet(event.value ?? "");
  if (!biome || player.captures < biome.unlockCaptures) return;
  const next = { ...player, biome: biome.id };
  await repo.save(next);
  await event.thread.post(`You travel to **${biome.name}**.`);
  await sendMainMenu(event.thread, next);
});

bot.onAction(ActionIds.Move, async (event) => {
  if (!event.thread || !event.value) return;
  const active = arenas.get(event.thread.id);
  if (!active) {
    await event.thread.post("No active battle.");
    return;
  }
  if (!claimTurn(active)) return; // animation in progress — silently drop
  const step = active.arena.submit({ kind: "attack", moveId: event.value });
  await runBattleAnimation(event.thread, active, step);
});

bot.onAction(ActionIds.BattleLure, async (event) => {
  if (!event.thread) return;
  const active = arenas.get(event.thread.id);
  if (!active) return;
  if (!claimTurn(active)) return;
  const repo = new PlayerRepository(event.thread);
  const player = await repo.load();
  if (!player) {
    active.busy = false;
    return;
  }
  const lureId = pickBestLure(player);
  if (!lureId) {
    active.busy = false;
    await event.thread.post("No lures left.");
    return;
  }
  const step = active.arena.submit({ kind: "lure", itemId: lureId });
  await runBattleAnimation(event.thread, active, step);
});

bot.onAction(ActionIds.BattleRun, async (event) => {
  if (!event.thread) return;
  const active = arenas.get(event.thread.id);
  if (!active) return;
  if (!claimTurn(active)) return;
  const step = active.arena.submit({ kind: "run" });
  await runBattleAnimation(event.thread, active, step);
});

bot.onAction(ActionIds.BattleFaintSwap, async (event) => {
  if (!event.thread) return;
  const active = arenas.get(event.thread.id);
  if (!active) return;
  if (active.arena.fsm.current() !== "await_swap") {
    await event.thread.post("Not waiting for a team switch.");
    return;
  }
  const party = active.arena.playerParty.map((c) => toSnapshot(c));
  const currentIndex = party.findIndex((s) => s.id === active.arena.player.id);
  await event.thread.post(teamSelectCard(party, currentIndex));
});

bot.onAction(ActionIds.BattleFaintRun, async (event) => {
  if (!event.thread) return;
  const active = arenas.get(event.thread.id);
  if (!active) return;
  if (active.arena.fsm.current() !== "await_swap") {
    await event.thread.post("Not waiting for a team switch.");
    return;
  }
  arenas.delete(event.thread.id);
  await event.thread.post("You fled from the battle!");
  const repo = new PlayerRepository(event.thread);
  const player = await repo.load();
  if (player) {
    await repo.save(player);
    await sendMainMenu(event.thread, player);
  }
});

bot.onAction(ActionIds.BattleTeamSelect, async (event) => {
  if (!event.thread || !event.value) return;
  const active = arenas.get(event.thread.id);
  if (!active) return;
  if (active.arena.fsm.current() !== "await_swap") {
    await event.thread.post("Not waiting for a team switch.");
    return;
  }
  const partyIndex = parseInt(event.value, 10);
  if (!claimTurn(active)) return;
  const step = active.arena.submit({ kind: "swap", partyIndex });
  await runBattleAnimation(event.thread, active, step);
});

// Try to acquire the per-battle turn lock. Returns false if a turn is
// already animating; in that case the click is silently ignored.
function claimTurn(active: ActiveBattle): boolean {
  if (active.busy) return false;
  active.busy = true;
  return true;
}

bot.onAction(ActionIds.Forget, async (event) => {
  if (!event.thread || !event.value) return;
  const repo = new PlayerRepository(event.thread);
  const player = await repo.load();
  if (!player) return;
  const ui = await new UiStateStore(event.thread).get();
  if (ui.kind !== "learn-move") return;

  const lead = fromSnapshot(player.party[0]);
  if (event.value === "__skip__") {
    await event.thread.post(
      `${lead.displayName()} skipped learning ${ui.pending}.`,
    );
  } else {
    lead.forget(event.value);
    lead.learn(ui.pending);
    await event.thread.post(`${lead.displayName()} learned **${ui.pending}**!`);
  }
  await repo.save({
    ...player,
    party: [toSnapshot(lead), ...player.party.slice(1)],
  });
  await new UiStateStore(event.thread).clear();
  await sendMainMenu(event.thread, (await repo.load()) as PlayerSnapshot);
});

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

async function firstTimeHatch(
  thread: AnyThread,
  repo: PlayerRepository,
): Promise<void> {
  await thread.post({ markdown: "Welcome to **Chattermon**! 👾" });
  await wait(800);
  await thread.post("A creature is trying to hatch from your thread…");
  const baby = hatchService.hatch({ biome: "meadow", level: 5 });
  await playAsciiAnimation(
    thread,
    [...EGG_HATCH_FRAMES, ...baby.species.frames],
    500,
  );
  await wait(400);
  // Big reveal: the data sheet inside a fenced code block so it renders
  // monospaced in Telegram, Slack, Discord alike.
  await thread.post({
    markdown: `It's **${baby.species.name}**! 🎉\n\`\`\`\n${hatchInfoTable(baby)}\n\`\`\``,
  });

  const player: PlayerSnapshot = {
    ...emptyPlayer(),
    party: [toSnapshot(baby)],
  };
  await repo.save(player);
  await sendMainMenu(thread, player);
}

// Shared Explore / Safe Explore flow. Same energy cost, same tick-eggs
// behavior, same outcome branching — only the `safe` flag changes how
// the encounter roll is resolved (see ExploreService).
async function handleExplore(
  thread: AnyThread,
  { safe }: { safe: boolean },
): Promise<void> {
  const repo = new PlayerRepository(thread);
  let player = await repo.load();
  if (!player) return;
  player = refillEnergy(player);

  const r = exploreService.step(player, { safe });
  player = r.player;

  if (r.outcome.kind === "no_energy") {
    await thread.post("You're out of energy. Come back in a few minutes!");
    await repo.save(player);
    return;
  }

  if (r.outcome.kind === "no_party") {
    await thread.post(
      "Your whole team is blacked out! Revive someone first — try Recover, a Revive item, or Safe Explore to look for supplies.",
    );
    await repo.save(player);
    await sendMainMenu(thread, player);
    return;
  }

  if (r.outcome.kind === "encounter") {
    const wildSnap = toSnapshot(r.outcome.wild);
    const playerSnap = player.party[0];
    await repo.save(player);
    await startBattle(thread, player, wildSnap, playerSnap);
    return;
  }

  // Eggs tick on every successful explore (safe or normal).
  const egg = exploreService.tickEggs(player);
  player = egg.player;

  if (egg.hatched > 0) {
    for (let i = 0; i < egg.hatched; i++) {
      const baby = hatchService.hatch({ biome: player.biome });
      const snap = toSnapshot(baby);
      if (player.party.length < 3)
        player = { ...player, party: [...player.party, snap] };
      else player = { ...player, box: [...player.box, snap] };
      await thread.post(
        `🥚 An egg hatched into a wild **${baby.species.name}**!`,
      );
    }
  }

  await repo.save(player);

  if (r.outcome.kind === "item") {
    const item = ItemRegistry.tryGet(r.outcome.itemId);
    await thread.post({
      markdown: `Found a **${item?.name ?? r.outcome.itemId}**!`,
    });
  }
  if (r.outcome.kind === "egg")
    await thread.post(`🥚 You found a chattermon egg!`);
  if (r.outcome.kind === "flavor") await thread.post(r.outcome.text);

  await sendMainMenu(thread, player);
}

async function sendMainMenu(
  thread: AnyThread,
  player: PlayerSnapshot,
): Promise<void> {
  const refilled = refillEnergy(player);
  if (refilled !== player) await new PlayerRepository(thread).save(refilled);
  const lead = refilled.party[0];
  const frame = lead ? fromSnapshot(lead).species.frames[0] : null;
  await thread.post(Cards.mainMenuCard(refilled, frame));
}

// ──────────────────────────────────────────────────────────────────────
// Battle: a single message that gets edited frame-by-frame
// ──────────────────────────────────────────────────────────────────────

async function startBattle(
  thread: AnyThread,
  player: PlayerSnapshot,
  wild: ChattermonSnapshot,
  playerSnap: ChattermonSnapshot,
): Promise<void> {
  const wildC = fromSnapshot(wild);
  const built = battleService.newArena(player, wildC);
  const start = built.arena.start();
  // Post the initial scene with buttons rendered but disabled. This sets
  // the final layout from frame one so the next edit (enabling the
  // buttons) doesn't shift anything around.
  const introFrame = start.frames[start.frames.length - 1];
  const sent = await thread.post(
    battleSceneCard({
      player: playerSnap,
      wild,
      narration: introFrame?.text ?? "",
      showButtons: true,
      buttonsDisabled: true,
      playerHp: introFrame?.playerHp,
      wildHp: introFrame?.wildHp,
      playerStatus: introFrame?.playerStatus,
      wildStatus: introFrame?.wildStatus,
    }),
  );
  arenas.set(thread.id, { arena: built.arena, sent, busy: false });
  await wait(INTRO_MS);
  // Hand control to the player. We swap the narration to the prompt
  // (rather than keeping "A wild X appeared!") so the new copy doubles
  // as a state cue *and* guarantees the edit's content actually differs
  // from the previous render — Telegram rejects "message is not modified"
  // edits when both content and reply markup hash to the previous state.
  await sent.edit(
    battleSceneCard({
      player: playerSnap,
      wild,
      narration: promptText(playerSnap),
      showButtons: true,
      buttonsDisabled: false,
      playerHp: introFrame?.playerHp,
      wildHp: introFrame?.wildHp,
    }),
  );
}

// Walks BattleStep frames, editing the same SentMessage between each so
// the player sees text + HP bars update in lockstep. After the last
// frame, decides whether to re-arm buttons or finalize the encounter.
async function runBattleAnimation(
  thread: AnyThread,
  active: ActiveBattle,
  step: BattleStep,
): Promise<void> {
  // Caller is expected to have already set `active.busy = true`. We
  // guarantee `busy` is cleared in every exit path via try/finally so a
  // mid-animation crash never wedges the battle.
  const playerSnap = toSnapshot(active.arena.player);
  const wildSnap = toSnapshot(active.arena.wild);

  try {
    for (let i = 0; i < step.frames.length; i++) {
      const f: BattleFrame = step.frames[i];
      await active.sent.edit(
        battleSceneCard({
          player: playerSnap,
          wild: wildSnap,
          narration: f.text,
          showButtons: true,
          buttonsDisabled: true,
          playerHp: f.playerHp,
          wildHp: f.wildHp,
          playerStatus: f.playerStatus,
          wildStatus: f.wildStatus,
        }),
      );
      // Skip the trailing pause for the very last frame — the next render
      // (buttons re-armed or terminal banner) will replace it shortly.
      if (i < step.frames.length - 1) await wait(FRAME_MS);
    }

    // Handle team swap prompt when chattermon faints
    if (step.phase === "await_swap") {
      await wait(FRAME_MS);
      const party = active.arena.playerParty.map((c) => toSnapshot(c));
      await thread.post(teamSwapPrompt(party));
      active.busy = false;
      return;
    }

    // Terminal phase: paint final banner with buttons gone (battle is
    // over so layout is allowed to change), then run post-battle hooks.
    if (
      step.phase === "victory" ||
      step.phase === "captured" ||
      step.phase === "defeat" ||
      step.phase === "fled"
    ) {
      await wait(FRAME_MS);
      arenas.delete(thread.id);

      const finalText = terminalBanner(step.phase);
      await active.sent.edit(
        battleSceneCard({
          player: playerSnap,
          wild: wildSnap,
          narration: finalText,
          showButtons: false,
          playerHp: active.arena.player.hp,
          wildHp: active.arena.wild.hp,
        }),
      );

      const repo = new PlayerRepository(thread);
      const player = await repo.load();
      if (!player) return;

      const result = battleService.finalize(
        player,
        active.arena.player,
        active.arena.wild,
        step,
      );
      await repo.save(result.player);

      await wait(700);
      if (result.captured)
        await thread.post(
          `${ACTION_ICON.captured} You added **${result.captured.speciesId}** to your team!`,
        );
      if (step.xpAwarded) await thread.post(`✨ Gained ${step.xpAwarded} XP.`);

      for (const lvl of result.levelUps) {
        const learnedTxt = lvl.learned.length
          ? `Learned ${lvl.learned.join(", ")}.`
          : "";
        await thread.post(
          `🎚️ Lv.${lvl.fromLevel} → Lv.${lvl.toLevel}. ${learnedTxt}`.trim(),
        );
        if (lvl.pendingLearn) {
          const lead = fromSnapshot(result.player.party[0]);
          await new UiStateStore(thread).set({
            kind: "learn-move",
            chattermonId: lead.id,
            pending: lvl.pendingLearn,
            level: lvl.toLevel,
          });
          await thread.post(Cards.learnMoveCard(lead, lvl.pendingLearn));
          return;
        }
      }
      await sendMainMenu(thread, result.player);
      return;
    }

    // Mid-battle: hand control back to the player. Replace the last
    // narration line with the prompt — both for clearer UX (Pokémon-style
    // "What will X do?" instead of a stale "Dealt 5 damage.") and to
    // guarantee this edit differs from the previous frame so Telegram
    // doesn't bounce it as "message is not modified".
    const last = step.frames[step.frames.length - 1];
    await active.sent.edit(
      battleSceneCard({
        player: playerSnap,
        wild: wildSnap,
        narration: promptText(playerSnap),
        showButtons: true,
        buttonsDisabled: false,
        playerHp: last?.playerHp ?? active.arena.player.hp,
        wildHp: last?.wildHp ?? active.arena.wild.hp,
        playerStatus: last?.playerStatus,
        wildStatus: last?.wildStatus,
      }),
    );
  } finally {
    active.busy = false;
  }
}

// Pokémon-style prompt shown while the battle is awaiting input.
function promptText(snap: ChattermonSnapshot): string {
  return `What will ${fromSnapshot(snap).displayName()} do?`;
}

function terminalBanner(phase: BattleStep["phase"]): string {
  switch (phase) {
    case "victory":
      return `${ACTION_ICON.victory} Victory!`;
    case "captured":
      return `${ACTION_ICON.captured} Captured!`;
    case "defeat":
      return `${ACTION_ICON.defeat} You blacked out…`;
    case "fled":
      return `${ACTION_ICON.fled} Got away safely.`;
    default:
      return "";
  }
}

function pickBestLure(player: PlayerSnapshot): string | null {
  for (const id of ["master_lure", "greater_lure", "basic_lure"] as const) {
    if ((player.inventory[id] ?? 0) > 0) return id;
  }
  return null;
}

void bot.initialize();

export { bot };
