// Renderers turning domain objects into chat elements.
// Pattern: Presentation layer — pure functions, no I/O.

import { Actions, Button, Card, CardChild, CardText } from "chat";
import { asMonospaceFrame } from "../../utils";
import { Chattermon } from "../domain/chattermon";
import { ItemRegistry } from "../domain/item";
import { MoveRegistry } from "../domain/move";
import { fromSnapshot } from "../persistence/serialize";
import { isBagUsable } from "../services/item.service";
import { allFainted, anyFainted } from "../services/explore.service";
import { RECOVER_COST } from "../services/recover.service";
import { PLAY_ENERGY_COST, playWaitMs } from "../services/mood.service";
import { ACTION_ICON, STATUS_ICON, TYPE_ICON } from "./icons";
import { ActionIds } from "./menus";
import { visualWidth } from "./layout";
import type { ItemId } from "../domain/types";
import type { PlayerSnapshot } from "../persistence/snapshots";

export function chattermonCardMarkdown(c: Chattermon, frameIndex = 0): string {
  const stats = c.stats();
  const hpBar = bar(c.hp, stats.hp, 10);
  let sprite = c.species.frames[frameIndex] ?? c.species.frames[0];
  if (c.isFainted()) {
    sprite = applyFaintedEyes(sprite);
  }
  const statRows = [
    `HP  ${hpBar}  ${c.hp}/${stats.hp}`,
    `ATK ${pad(stats.atk)}  DEF ${pad(stats.def)}  FOC ${pad(stats.foc)}  SPD ${pad(stats.spd)}`,
    `Nature: ${c.nature.name}    Trait: ${c.trait.name}`,
    `Mood: ${c.moodEmoji()} ${capitalize(c.moodId())}`,
    c.mutation ? `Mutation: ${c.mutation.name}` : null,
    `Moves: ${c.knownMoves.map((m) => MoveRegistry.get(m).name).join(" / ") || "—"}`,
  ].filter(Boolean) as string[];
  const statWidth = Math.max(...statRows.map((row) => visualWidth(row)));
  const lines = [
    asMonospaceFrame(sprite),
    "",
    `**${c.displayName()}**  Lv.${c.level}  *${c.species.type}*`,
    "```",
    ...statRows.map((row) => padVisible(row, statWidth)),
    "```",
  ].filter(Boolean) as string[];
  return lines.join("\n");
}

export function partyCardMarkdown(p: PlayerSnapshot): string {
  if (p.party.length === 0) return "_Your party is empty._";
  return p.party
    .map((s, i) => {
      const c = fromSnapshot(s);
      const stats = c.stats();
      const lead = i === 0 ? "★ " : "  ";
      return `${lead}**${c.displayName()}** Lv.${c.level} ${TYPE_ICON[c.species.type]} ${c.moodEmoji()} — HP ${c.hp}/${stats.hp}`;
    })
    .join("\n");
}

export function partyCard(p: PlayerSnapshot) {
  const rows = p.party.flatMap((s, i) => {
    const c = fromSnapshot(s);
    const stats = c.stats();
    const isLead = i === 0;
    const label = `${isLead ? "★ " : ""}${c.displayName()} Lv.${c.level} ${TYPE_ICON[c.species.type]} ${c.moodEmoji()} — HP ${c.hp}/${stats.hp}`;
    const children: CardChild[] = [CardText(label)];
    if (!isLead) {
      children.push(
        Actions([
          Button({
            id: ActionIds.SetLead,
            value: i.toString(),
            label: `★ Set as Lead`,
          }),
        ]),
      );
    }
    return children;
  });

  return Card({
    title: `${ACTION_ICON.team} Team`,
    subtitle:
      p.party.length === 0
        ? "Your party is empty."
        : "★ marks your lead chattermon.",
    children: [
      ...(p.party.length === 0 ? [CardText("_Your party is empty._")] : rows),
      Actions([
        Button({
          id: ActionIds.Return,
          value: "main",
          label: `${ACTION_ICON.back} Return`,
        }),
      ]),
    ],
  });
}

export function inventoryMarkdown(p: PlayerSnapshot): string {
  const entries = Object.entries(p.inventory).filter(([, n]) => n > 0);
  if (entries.length === 0) return "_Bag is empty._";
  return entries
    .map(([id, n]) => {
      const item = ItemRegistry.tryGet(id);
      return `- ${item?.name ?? id} ×${n}`;
    })
    .join("\n");
}

// Format bag items as a nicely padded ASCII table for display.
function bagItemsTable(entries: Array<[ItemId, number]>): string {
  const INNER_WIDTH = 34; // Matches hatchInfoTable for consistent terminal width

  if (entries.length === 0) return "_Bag is empty._";

  const rows = entries.map(([id, n]) => {
    const item = ItemRegistry.tryGet(id);
    const name = item?.name ?? id;
    const qty = `×${n}`;
    const desc = item?.description ?? "";
    return { name, qty, desc };
  });

  const lines: string[] = [];
  lines.push(boxTop(INNER_WIDTH));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    // Header line: "Item Name                 x3"
    const headerPad = Math.max(
      0,
      INNER_WIDTH - visualWidth(row.name) - visualWidth(row.qty),
    );
    const header = row.name + " ".repeat(headerPad) + row.qty;
    lines.push(boxRowLeft(header, INNER_WIDTH));

    // Wrapped description indented by 2
    const wrapWidth = INNER_WIDTH - 2;
    const words = row.desc.split(" ");
    let currentLine = "";

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (visualWidth(candidate) > wrapWidth) {
        if (currentLine) {
          lines.push(boxRowLeft("  " + currentLine, INNER_WIDTH));
        }
        currentLine = word;
      } else {
        currentLine = candidate;
      }
    }
    if (currentLine) {
      lines.push(boxRowLeft("  " + currentLine, INNER_WIDTH));
    }

    if (i < rows.length - 1) {
      lines.push(boxSep(INNER_WIDTH));
    }
  }

  lines.push(boxBottom(INNER_WIDTH));
  return lines.join("\n");
}

function padRight(str: string, width: number): string {
  const pad = Math.max(0, width - visualWidth(str));
  return str + " ".repeat(pad);
}

function boxRowLeft(content: string, innerWidth: number): string {
  let body = content;
  while (visualWidth(body) > innerWidth) body = body.slice(0, -1);
  return "│ " + padRight(body, innerWidth) + " │";
}

function boxTop(w: number): string {
  return "╭" + "─".repeat(w + 2) + "╮";
}

function boxSep(w: number): string {
  return "├" + "─".repeat(w + 2) + "┤";
}

function boxBottom(w: number): string {
  return "╰" + "─".repeat(w + 2) + "╯";
}

export function mainMenuCard(p: PlayerSnapshot, leadFrame: string | null) {
  const lead = p.party[0];
  const blackedOut = allFainted(p);
  const someFainted = anyFainted(p);

  let leadDisplay: string | null = null;
  if (lead) {
    const c = fromSnapshot(lead);
    const stats = c.stats();
    const hpBar = bar(c.hp, stats.hp, 10);
    let sprite = leadFrame ?? c.species.frames[0] ?? "";
    if (c.isFainted() || blackedOut) sprite = applyFaintedEyes(sprite);
    const spriteContent = sprite.replace(/^\n+|\n+$/g, "");
    const spriteLines = spriteContent.split("\n");
    const infoLines = [
      `${TYPE_ICON[c.species.type]} ${c.displayName()}  Lv.${c.level}`,
      `HP ${hpBar} ${c.hp}/${stats.hp}`,
      `Mood: ${c.moodEmoji()} ${capitalize(c.moodId())}`,
    ];
    const leftWidth = Math.max(...spriteLines.map((l) => visualWidth(l)), 0);
    const rows = Math.max(spriteLines.length, infoLines.length);
    const monoLines: string[] = [];
    for (let i = 0; i < rows; i++) {
      const left = spriteLines[i] ?? "";
      const right = infoLines[i] ?? "";
      const pad = Math.max(0, leftWidth - visualWidth(left));
      monoLines.push(left + " ".repeat(pad) + "  " + right);
    }
    leadDisplay = asMonospaceFrame(monoLines.join("\n"));
  }

  // Row 1: primary action + bag.
  // Blackout swaps Explore → Safe Explore (only way to progress when
  // every mon is down).
  const primary = blackedOut
    ? Button({
        id: ActionIds.SafeExplore,
        label: `${ACTION_ICON.safe} Safe Explore (1⚡)`,
        style: "primary",
      })
    : Button({
        id: ActionIds.Explore,
        label: `${ACTION_ICON.explore} Explore (1⚡)`,
        style: "primary",
      });
  const row1 = Actions([
    primary,
    Button({
      id: ActionIds.Inventory,
      label: `${ACTION_ICON.inventory} Bag`,
    }),
  ]);

  // Row 2: team & travel. Travel hidden on full blackout (no team to
  // travel with).
  const row2Buttons = [
    Button({ id: ActionIds.Party, label: `${ACTION_ICON.team} Team` }),
    Button({ id: ActionIds.Care, label: `${ACTION_ICON.care} Care` }),
  ];
  if (!blackedOut) {
    row2Buttons.push(
      Button({ id: ActionIds.Biome, label: `${ACTION_ICON.travel} Travel` }),
    );
  }
  const row2 = Actions(row2Buttons);

  // Row 3: conditional Recover button. Any fainted mon → show it. On
  // full blackout it's still not primary — the primary is Safe Explore
  // since Recover may fail if energy is insufficient.
  const rows = [row1, row2];
  if (someFainted) {
    rows.push(
      Actions([
        Button({
          id: ActionIds.Recover,
          label: `${ACTION_ICON.recover} Recover (${RECOVER_COST}⚡)`,
          disabled: p.energy < RECOVER_COST,
        }),
      ]),
    );
  }

  const subtitle = !lead
    ? `Energy ${p.energy}/20`
    : blackedOut
      ? `⚠️ Your team blacked out! • Energy ${p.energy}/20`
      : someFainted
        ? `${lead.nickname ?? capitalize(lead.speciesId)} • Energy ${p.energy}/20 • ⚠️ Some fainted`
        : `${lead.nickname ?? capitalize(lead.speciesId)} • Energy ${p.energy}/20 • Captures ${p.captures}`;

  return Card({
    title: "Chattermon",
    subtitle,
    children: [...(leadDisplay ? [CardText(leadDisplay)] : []), ...rows],
  });
}

// ── Bag (interactive) ─────────────────────────────────────────────────

// Items live in two visual buckets: "usable from bag" (get a Use
// button) and "battle/special" (shown as informational text only).
export function bagCard(p: PlayerSnapshot) {
  const entries = Object.entries(p.inventory).filter(([, n]) => n > 0);
  if (entries.length === 0) {
    return Card({
      title: `${ACTION_ICON.inventory} Bag`,
      children: [
        CardText("_Your bag is empty._"),
        Actions([
          Button({
            id: ActionIds.Return,
            value: "main",
            label: `${ACTION_ICON.back} Return`,
          }),
        ]),
      ],
    });
  }

  type Row = { id: ItemId; n: number; name: string; description: string };
  const usable: Row[] = [];
  const passive: Row[] = [];
  for (const [id, n] of entries) {
    const item = ItemRegistry.tryGet(id);
    if (!item) continue;
    const row: Row = { id, n, name: item.name, description: item.description };
    if (isBagUsable(item)) usable.push(row);
    else passive.push(row);
  }

  // Display formatted inventory table first
  const tableMarkdown = `\`\`\`\n${bagItemsTable(entries)}\n\`\`\``;

  // Then add Use buttons for usable items
  const usableChildren = usable.flatMap((row) => [
    Actions([
      Button({
        id: ActionIds.BagUse,
        value: row.id,
        label: `${ACTION_ICON.use} Use ${row.name}`,
      }),
    ]),
  ]);

  return Card({
    title: `${ACTION_ICON.inventory} Bag`,
    subtitle: "Tap Use to apply an item.",
    children: [
      CardText(tableMarkdown),
      ...usableChildren,
      Actions([
        Button({
          id: ActionIds.Return,
          value: "main",
          label: `${ACTION_ICON.back} Return`,
        }),
      ]),
    ],
  });
}

// Target picker shown after clicking Use on a party-targeted item.
// `filter` lets recover-style callers filter which party members are
// eligible (e.g. fainted-only).
export function bagTargetCard(p: PlayerSnapshot, itemId: ItemId) {
  const item = ItemRegistry.tryGet(itemId);
  const name = item?.name ?? itemId;
  const buttons = p.party.map((snap, i) => {
    const c = fromSnapshot(snap);
    const stats = c.stats();
    const label = c.isFainted()
      ? `💀 ${c.displayName()} Lv.${c.level}`
      : `${c.displayName()} Lv.${c.level} — ${c.hp}/${stats.hp} HP${c.status ? ` ${STATUS_ICON[c.status]}` : ""}`;
    return Button({
      id: ActionIds.BagUseTarget,
      value: `${itemId}:${i}`,
      label,
      disabled: !canApply(item, snap),
    });
  });

  return Card({
    title: `Use ${name} on…`,
    subtitle: item?.description,
    children: [
      Actions(buttons),
      Actions([
        Button({
          id: ActionIds.Return,
          value: "bag",
          label: `${ACTION_ICON.back} Return`,
        }),
      ]),
    ],
  });
}

// Per-target enabled check so the picker greys out invalid choices
// instead of silently erroring after a click.
function canApply(
  item: ReturnType<typeof ItemRegistry.tryGet>,
  snap: PlayerSnapshot["party"][number],
): boolean {
  if (!item) return false;
  const c = fromSnapshot(snap);
  if (item.kind === "potion" && typeof item.revivePct === "number") {
    return c.isFainted();
  }
  if (
    (item.kind === "potion" || item.kind === "berry") &&
    typeof item.healPct === "number" &&
    item.healPct > 0
  ) {
    return !c.isFainted() && c.hp < c.stats().hp;
  }
  if (item.kind === "berry" && item.curesStatus) {
    return !c.isFainted() && c.status !== null;
  }
  return false;
}

// Recover picker: only fainted party members are eligible targets.
export function recoverTargetCard(p: PlayerSnapshot) {
  const buttons = p.party.map((snap, i) => {
    const c = fromSnapshot(snap);
    const stats = c.stats();
    const label = c.isFainted()
      ? `💀 ${c.displayName()} Lv.${c.level} → ${Math.floor(stats.hp * 0.5)} HP`
      : `${c.displayName()} Lv.${c.level} (healthy)`;
    return Button({
      id: ActionIds.RecoverTarget,
      value: i.toString(),
      label,
      disabled: !c.isFainted(),
    });
  });
  return Card({
    title: `${ACTION_ICON.recover} Recover`,
    subtitle: `Spend ${RECOVER_COST}⚡ to revive one fainted chattermon to 50% HP.`,
    children: [
      Actions(buttons),
      Actions([
        Button({
          id: ActionIds.Return,
          value: "main",
          label: `${ACTION_ICON.back} Return`,
        }),
      ]),
    ],
  });
}

export function learnMoveCard(c: Chattermon, pending: string) {
  const move = MoveRegistry.get(pending);
  const known = c.knownMoves.map((mid) =>
    Button({
      id: ActionIds.Forget,
      value: mid,
      label: `Forget ${MoveRegistry.get(mid).name}`,
    }),
  );
  return Card({
    title: `${c.displayName()} wants to learn ${move.name}!`,
    subtitle: `${TYPE_ICON[move.type]} ${move.type} • ${move.category} • Pow ${move.power}`,
    children: [
      CardText(move.description),
      CardText("It already knows 4 moves. Pick one to forget, or skip."),
      Actions([
        ...known,
        Button({
          id: ActionIds.Forget,
          value: "__skip__",
          label: "Skip",
          style: "danger",
        }),
      ]),
    ],
  });
}

// ── helpers ────────────────────────────────────────────────────────────

function bar(cur: number, max: number, width: number): string {
  const filled = Math.max(
    0,
    Math.min(width, Math.round((cur / Math.max(1, max)) * width)),
  );
  return "█".repeat(filled) + "░".repeat(width - filled);
}

function pad(n: number): string {
  return n.toString().padStart(3, " ");
}

function padVisible(line: string, width: number): string {
  const diff = width - visualWidth(line);
  return diff <= 0 ? line : line + " ".repeat(diff);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Care card ──────────────────────────────────────────────────────────

export function careCard(p: PlayerSnapshot) {
  if (p.party.length === 0) {
    return Card({
      title: `${ACTION_ICON.care} Care`,
      children: [
        CardText("_No chattermon to care for._"),
        Actions([
          Button({
            id: ActionIds.Return,
            value: "main",
            label: `${ACTION_ICON.back} Return`,
          }),
        ]),
      ],
    });
  }

  const lead = fromSnapshot(p.party[0]);
  const stats = lead.stats();
  const hpBar = bar(lead.hp, stats.hp, 10);

  // Check if player has any berry to feed
  const hasBerry = Object.entries(p.inventory).some(([id, n]) => {
    if (n <= 0) return false;
    const item = ItemRegistry.tryGet(id);
    return (
      item?.kind === "berry" &&
      typeof item.healPct === "number" &&
      item.healPct > 0
    );
  });

  const cooldownMs = playWaitMs(p.party[0]);
  const canPlay = cooldownMs === 0 && p.energy >= PLAY_ENERGY_COST;
  const playLabel =
    cooldownMs > 0
      ? `${ACTION_ICON.play} Play (${Math.ceil(cooldownMs / 60000)}m cooldown)`
      : `${ACTION_ICON.play} Play (${PLAY_ENERGY_COST}⚡)`;

  const sprite = lead.species.frames[0] ?? "";

  return Card({
    title: `${ACTION_ICON.care} Care for ${lead.displayName()}`,
    subtitle: `Mood: ${lead.moodEmoji()} ${capitalize(lead.moodId())} — HP ${lead.hp}/${stats.hp}`,
    children: [
      CardText(asMonospaceFrame(sprite)),
      CardText(
        `\`\`\`\nHP  ${hpBar}  ${lead.hp}/${stats.hp}\nMood: ${lead.moodEmoji()} ${capitalize(lead.moodId())}\n\`\`\``,
      ),
      Actions([
        Button({
          id: ActionIds.Feed,
          value: "0",
          label: `${ACTION_ICON.feed} Feed`,
          disabled: !hasBerry || lead.isFainted(),
        }),
        Button({
          id: ActionIds.Play,
          label: playLabel,
          disabled: !canPlay || lead.isFainted(),
        }),
      ]),
      Actions([
        Button({
          id: ActionIds.Return,
          value: "main",
          label: `${ACTION_ICON.back} Return`,
        }),
      ]),
    ],
  });
}

function applyFaintedEyes(sprite: string): string {
  const lines = sprite.split("\n");
  // Replace common eye patterns with @ @ in the middle line
  if (lines.length >= 2) {
    const middleLine = lines[1];
    // Replace various eye characters/patterns with @ @
    let faintedLine = middleLine
      .replace(/[•ᴥ◡❍]/g, "@") // Common eye chars
      .replace(/@\s+@/, "@ @"); // Normalize spacing between eyes
    // If no eyes were found, try replacing other common patterns
    if (faintedLine === middleLine) {
      faintedLine = middleLine
        .replace(/[ovo\-^]/g, "@")
        .replace(/@\s+@/, "@ @");
    }
    lines[1] = faintedLine;
  }
  return lines.join("\n");
}
