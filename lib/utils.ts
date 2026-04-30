// Wrap a frame in a fenced code block so the platform renders it monospaced.
export function asMonospaceFrame(frame: string): string {
  return "```\n" + frame.replace(/^\n+|\n+$/g, "") + "\n```";
}
