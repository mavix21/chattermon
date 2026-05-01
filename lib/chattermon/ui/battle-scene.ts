// Pokémon-style battle "stage": a single ASCII canvas showing the wild
// chattermon top-right and the player chattermon bottom-left, each with
// an HP bar, a divider, and a single line of narration at the bottom.
//
// The bot edits one SentMessage by calling `battleSceneCard()` repeatedly
// with the next BattleFrame in the sequence — the canvas stays put, only
// HP bars and narration text change.

import { Actions, Button, Card, CardText } from "chat";
import { ActionIds } from "./menus";
import { TYPE_ICON, STATUS_ICON, ACTION_ICON } from "./icons";
import {
  dedent,
  leftAlign,
  padRight,
  rightAlign,
  visualWidth,
  wrap,
} from "./layout";
import { fromSnapshot } from "../persistence/serialize";
import { MoveRegistry } from "../domain/move";
import type { ChattermonSnapshot } from "../persistence/snapshots";
import type { StatusId } from "../domain/types";

const CANVAS_WIDTH = 40;

export interface BattleSceneInput {
  player: ChattermonSnapshot;
  wild: ChattermonSnapshot;
  /** Current narration line. Empty string renders a blank band. */
  narration: string;
  /** When true, render move + lure/swap/run buttons. */
  showButtons: boolean;
  /**
   * Render the buttons greyed-out and unclickable. Use this during
   * animation playback so the layout never collapses (preventing the
   * "buttons disappear" jitter), while still telling the player the
   * controls aren't currently accepting input.
   */
  buttonsDisabled?: boolean;
  /** Override displayed HP/status (so animation can lag the snapshot). */
  playerHp?: number;
  wildHp?: number;
  playerStatus?: StatusId | null;
  wildStatus?: StatusId | null;
}

export function battleSceneCard(input: BattleSceneInput) {
  const canvas = composeBattleCanvas(input);
  const children: ReturnType<typeof CardText>[] = [
    CardText("```\n" + canvas + "\n```"),
  ];

  if (!input.showButtons) {
    return Card({ children });
  }

  const p = fromSnapshot(input.player);
  const lock = !!input.buttonsDisabled;
  const moveButtons = p.knownMoves.slice(0, 4).map((mid) => {
    const m = MoveRegistry.get(mid);
    return Button({
      id: ActionIds.Move,
      value: mid,
      label: `${TYPE_ICON[m.type]} ${m.name}`,
      disabled: lock,
    });
  });

  return Card({
    children: [
      ...children,
      Actions(moveButtons),
      Actions([
        Button({
          id: ActionIds.BattleLure,
          label: `${ACTION_ICON.lure} Lure`,
          disabled: lock,
        }),
        Button({
          id: ActionIds.BattleSwap,
          label: `${ACTION_ICON.swap} Swap`,
          // Swap is permanently disabled in v1; the lock can only
          // tighten that.
          disabled: true,
        }),
        Button({
          id: ActionIds.BattleRun,
          label: `${ACTION_ICON.run} Run`,
          style: "danger",
          disabled: lock,
        }),
      ]),
    ],
  });
}

// ────────────────────────────────────────────────────────────────────
// Canvas composition
// ────────────────────────────────────────────────────────────────────

export function composeBattleCanvas(input: BattleSceneInput): string {
  const p = fromSnapshot(input.player);
  const w = fromSnapshot(input.wild);
  const pHp = input.playerHp ?? p.hp;
  const wHp = input.wildHp ?? w.hp;
  const pStatus = input.playerStatus ?? p.status;
  const wStatus = input.wildStatus ?? w.status;

  const W = CANVAS_WIDTH;

  // Wild block: sprite stacked above an info line, right-aligned.
  const wildSprite = dedent(w.species.frames[0]);
  const wildSpriteBlock = shiftBlockRight(wildSprite, W);
  const wildInfo = infoLine(
    `Wild ${w.displayName()}`,
    w.level,
    wHp,
    w.stats().hp,
    wStatus,
    w.species.type,
  );
  const wildBlock = [wildSpriteBlock, rightAlign(wildInfo, W)].join("\n");

  // Player block: sprite above info line, left-aligned.
  const playerSprite = dedent(p.species.frames[0]);
  const playerInfo = infoLine(
    p.displayName(),
    p.level,
    pHp,
    p.stats().hp,
    pStatus,
    p.species.type,
  );
  const playerBlock = leftAlign(`${playerSprite}\n${playerInfo}`, W);

  // Narration band: a divider plus the current line, wrapped.
  const divider = "─".repeat(W);
  const narrationLines = (
    input.narration ? wrap(`▸ ${input.narration}`, W - 1) : ""
  ).split("\n");
  // Pad to 2 lines so the box height never jitters between edits.
  while (narrationLines.length < 2) narrationLines.push("");
  const narration = narrationLines
    .map((l) => padRight(l, W))
    .slice(0, 2)
    .join("\n");

  return [wildBlock, "", playerBlock, divider, narration].join("\n");
}

function infoLine(
  name: string,
  lvl: number,
  hp: number,
  max: number,
  status: StatusId | null,
  type: keyof typeof TYPE_ICON,
): string {
  const head = `${TYPE_ICON[type]} ${name}  Lv.${lvl}${status ? "  " + STATUS_ICON[status] : ""}`;
  const hpLine = `HP ${hpBar(hp, max, 12)} ${hp}/${max}`;
  return [head, hpLine].join("\n");
}

function hpBar(cur: number, max: number, width: number): string {
  const ratio = cur / Math.max(1, max);
  const filled = Math.max(0, Math.min(width, Math.round(ratio * width)));
  // Color hint via the heart bullet — Telegram won't actually colorize but
  // it gives the player a quick visual at-a-glance read.
  const heart = ratio > 0.5 ? "💚" : ratio > 0.2 ? "💛" : "❤️";
  void visualWidth;
  return `${heart} ${"█".repeat(filled)}${"░".repeat(width - filled)}`;
}

function shiftBlockRight(block: string, width: number): string {
  const lines = block.split("\n");
  const blockWidth = Math.max(...lines.map((line) => visualWidth(line)), 0);
  const padding = Math.max(0, width - blockWidth);
  const prefix = " ".repeat(padding);
  return lines.map((line) => prefix + line).join("\n");
}

export function teamSwapPrompt(party: ChattermonSnapshot[]) {
  const canSwap = party.some((c) => (!c.hp || c.hp <= 0 ? false : true));
  return Card({
    title: "Your chattermon blacked out!",
    subtitle: canSwap
      ? "Choose another chattermon or run away."
      : "No other chattermon available.",
    children: [
      Actions([
        Button({
          id: ActionIds.BattleFaintSwap,
          label: "Switch Chattermon",
          disabled: !canSwap,
        }),
        Button({
          id: ActionIds.BattleFaintRun,
          label: `${ACTION_ICON.run} Run Away`,
          style: "danger",
        }),
      ]),
    ],
  });
}

export function teamSelectCard(
  party: ChattermonSnapshot[],
  currentIndex: number,
) {
  const buttons = party.map((c, i) => {
    const chattermon = fromSnapshot(c);
    const isFainted = chattermon.isFainted();
    const label = isFainted
      ? `💀 ${chattermon.displayName()} Lv.${chattermon.level}`
      : `${chattermon.displayName()} Lv.${chattermon.level} (${chattermon.hp}/${chattermon.stats().hp} HP)`;
    return Button({
      id: ActionIds.BattleTeamSelect,
      value: i.toString(),
      label,
      disabled: isFainted || i === currentIndex,
    });
  });

  return Card({
    title: "Choose a Chattermon",
    children: [
      Actions(buttons),
      Actions([
        Button({
          id: ActionIds.Return,
          value: "swap",
          label: `${ACTION_ICON.back} Return`,
        }),
      ]),
    ],
  });
}
