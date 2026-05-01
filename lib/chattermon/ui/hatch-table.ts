// Renders a Chattermon's full data sheet as a bordered ASCII table.
// Used after a fresh hatch to introduce the creature in style.

import { Chattermon } from "../domain/chattermon";
import { MoveRegistry } from "../domain/move";
import { padRight, visualWidth } from "./layout";

const INNER_WIDTH = 34; // characters between the left and right borders

export function hatchInfoTable(c: Chattermon): string {
  const stats = c.stats();
  const headerName = `${c.mutation ? "* " : ""}${c.species.name}${c.nickname ? ` "${c.nickname}"` : ""}`;
  const headerMeta = `Lv. ${c.level}    Type: ${c.species.type}`;

  const statRows = [
    `HP   ${pad3(stats.hp)}     ATK  ${pad3(stats.atk)}`,
    `DEF  ${pad3(stats.def)}     FOC  ${pad3(stats.foc)}`,
    `SPD  ${pad3(stats.spd)}`,
  ];

  const traitRows = [
    `Nature   ${c.nature.name}`,
    `Trait    ${c.trait.name}`,
    ...(c.mutation ? [`Mutation * ${c.mutation.name}`] : []),
  ];

  const moveNames =
    c.knownMoves.map((m) => MoveRegistry.get(m).name).join(", ") || "—";
  const movesRow = `Moves    ${moveNames}`;

  const lines: string[] = [];
  lines.push(top(INNER_WIDTH));
  lines.push(row(headerName));
  lines.push(row(headerMeta));
  lines.push(sep(INNER_WIDTH));
  for (const r of statRows) lines.push(row(r));
  lines.push(sep(INNER_WIDTH));
  for (const r of traitRows) lines.push(row(r));
  lines.push(sep(INNER_WIDTH));
  lines.push(row(movesRow));
  lines.push(bottom(INNER_WIDTH));
  return lines.join("\n");
}

function pad3(n: number): string {
  return n.toString().padStart(3, " ");
}

function row(content: string): string {
  // Truncate gracefully if a value is too wide for the box.
  let body = content;
  while (visualWidth(body) > INNER_WIDTH - 2) body = body.slice(0, -1);
  return "│ " + padRight(body, INNER_WIDTH - 2) + " │";
}

function top(w: number): string {
  return "╭" + "─".repeat(w) + "╮";
}

function sep(w: number): string {
  return "├" + "─".repeat(w) + "┤";
}

function bottom(w: number): string {
  return "╰" + "─".repeat(w) + "╯";
}
