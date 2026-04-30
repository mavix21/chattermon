import { setTimeout } from "timers/promises";
import type { Thread } from "chat";
import { asMonospaceFrame } from "../utils";

// Posts the first frame, then edits the same message through the remaining
// frames at a fixed interval to create an ASCII animation.
export async function playAsciiAnimation(
  thread: Thread,
  frames: readonly string[],
  intervalMs = 600,
): Promise<void> {
  if (frames.length === 0) return;

  const sent = await thread.post({ markdown: asMonospaceFrame(frames[0]) });

  for (let i = 1; i < frames.length; i++) {
    await setTimeout(intervalMs);
    await sent.edit({ markdown: asMonospaceFrame(frames[i]) });
  }
}
