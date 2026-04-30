// Eighth Chattermon: a cute plant-type sprout in a tiny pot.
// Five ASCII frames that, when posted in sequence via SentMessage.edit(),
// show Sprig soaking up sunlight and bursting into a happy little bloom.
// The pot and leafy arms stay locked in place — only the bud and eyes shift,
// so the animation reads as a single fluid bloom instead of a jittery redraw.

// Idle — a closed bud peeks out, sleepy eyes half open.
const FRAME_1 = String.raw`
    ,|.    
   (•ᴥ•)   
   \/ \/   
   \___/   
`;

// Sunbathe — leaves stretch up, eyes close to soak in the rays.
const FRAME_2 = String.raw`
    \|/    
   (-ᴥ-)   
   \_|_/   
   \___/   
`;

// Sparkle — bud cracks open, eyes go wide with anticipation.
const FRAME_3 = String.raw`
    *|*    
   (◉ᴥ◉)   
   \_|_/   
   \___/   
`;

// Bloom — flower bursts open, proud little grin underneath.
const FRAME_4 = String.raw`
    ❀ ❀    
   (^ᴥ^)   
   \_|_/   
   \___/   
`;

// Settle — petals relax, content with the show.
const FRAME_5 = String.raw`
    ✿ ✿    
   (•ᴥ•)   
   \_|_/   
   \___/   
`;

export const SPRIG_FRAMES: readonly string[] = [
  FRAME_1,
  FRAME_2,
  FRAME_3,
  FRAME_4,
  FRAME_5,
] as const;

export const SPRIG_NAME = "Sprig" as const;
export const SPRIG_TYPE = "plant" as const;
