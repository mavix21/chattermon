// ASCII layout primitives used by the battle scene + hatch table.
//
// All functions are pure and treat input as multi-line strings: the
// natural shape of our species ASCII frames.

// Strip leading/trailing blank lines and remove the common leading
// indentation. Required because the existing sprite frames are written
// with `String.raw` template literals and inherit their author's indent.
export function dedent(block: string): string {
  const lines = block.replace(/\r/g, "").split("\n");
  // Drop leading + trailing blank-only lines.
  while (lines.length && lines[0].trim() === "") lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
  if (lines.length === 0) return "";
  const indents = lines
    .filter((l) => l.trim() !== "")
    .map((l) => l.match(/^ */)?.[0].length ?? 0);
  const min = Math.min(...indents);
  return lines
    .map((l) => (l.length >= min ? l.slice(min) : l))
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n");
}

// Visible width of a string. Treats most emoji as 2 columns, combining
// marks and VS16 as 0, everything else as 1. Box-drawing characters
// (U+2500..U+257F) deliberately stay 1-wide so our borders line up.
//
// Approximate but covers everything our UI emits.
export function visualWidth(s: string): number {
  let w = 0;
  for (const ch of s) {
    const c = ch.codePointAt(0) ?? 0;
    if (c === 0xfe0f || (c >= 0x0300 && c <= 0x036f)) continue; // VS16 / combining marks
    const wide =
      (c >= 0x1100 && c <= 0x115f) || // Hangul Jamo
      (c >= 0x2600 && c <= 0x27bf) || // Misc symbols + Dingbats (⚡✨❄ etc.)
      (c >= 0x2e80 && c <= 0x9fff) || // CJK
      (c >= 0xa000 && c <= 0xa4cf) || // Yi
      (c >= 0xac00 && c <= 0xd7a3) || // Hangul syllables
      (c >= 0xf900 && c <= 0xfaff) || // CJK Compat
      (c >= 0xfe30 && c <= 0xfe4f) || // CJK Compat forms
      (c >= 0xff00 && c <= 0xff60) ||
      (c >= 0xffe0 && c <= 0xffe6) ||
      c >= 0x1f000; // Emoji + supplementary
    w += wide ? 2 : 1;
  }
  return w;
}

export function padRight(line: string, width: number, ch = " "): string {
  const diff = width - visualWidth(line);
  return diff <= 0 ? line : line + ch.repeat(diff);
}

export function padLeft(line: string, width: number, ch = " "): string {
  const diff = width - visualWidth(line);
  return diff <= 0 ? line : ch.repeat(diff) + line;
}

// Right-align every line within a fixed canvas width.
export function rightAlign(block: string, width: number): string {
  return block
    .split("\n")
    .map((l) => padLeft(l, width))
    .join("\n");
}

// Left-align (pad-right) every line within a fixed canvas width.
export function leftAlign(block: string, width: number): string {
  return block
    .split("\n")
    .map((l) => padRight(l, width))
    .join("\n");
}

// Wrap a single sentence to a given width, breaking on word boundaries.
export function wrap(text: string, width: number): string {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (!cur) {
      cur = w;
      continue;
    }
    if (visualWidth(cur) + 1 + visualWidth(w) <= width) cur += " " + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines.join("\n");
}
