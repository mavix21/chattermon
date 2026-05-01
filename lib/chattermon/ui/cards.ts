// Renderers turning domain objects into chat elements.
// Pattern: Presentation layer — pure functions, no I/O.

import { Actions, Button, Card, CardText } from "chat";
import { asMonospaceFrame } from "../../utils";
import { Chattermon } from "../domain/chattermon";
import { ItemRegistry } from "../domain/item";
import { MoveRegistry } from "../domain/move";
import { fromSnapshot } from "../persistence/serialize";
import { isBagUsable } from "../services/item.service";
import { allFainted, anyFainted } from "../services/explore.service";
import { RECOVER_COST } from "../services/recover.service";
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
      return `${lead}**${c.displayName()}** Lv.${c.level} ${TYPE_ICON[c.species.type]} ${c.species.type} — HP ${c.hp}/${stats.hp}`;
    })
    .join("\n");
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

  const usableChildren = usable.flatMap((row) => [
    CardText(`**${row.name}** ×${row.n} — ${row.description}`),
    Actions([
      Button({
        id: ActionIds.BagUse,
        value: row.id,
        label: `${ACTION_ICON.use} Use ${row.name}`,
      }),
    ]),
  ]);

  const passiveChildren = passive.length
    ? [
        CardText("— Battle / Special —"),
        ...passive.map((row) =>
          CardText(`**${row.name}** ×${row.n} — ${row.description}`),
        ),
      ]
    : [];

  return Card({
    title: `${ACTION_ICON.inventory} Bag`,
    subtitle: "Tap Use to apply an item.",
    children: [
      ...usableChildren,
      ...passiveChildren,
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
