// Third Chattermon: a cute ice-type polar bear cub.
// Four ASCII frames that, when posted in sequence via SentMessage.edit(),
// give the impression of a snowy bear inhaling and breathing out a blizzard.

// Idle — round little ears, chunky body, paw on the snow.
const FRAME_1 = String.raw`
   ⌒ ⌒    
  ʕ•ᴥ•ʔ    
  ⊂___⊃ ❄️ 
`;

// Inhale — eyes close, frosty air gathers in the chest.
const FRAME_2 = String.raw`
   ⌒ ⌒    
  ʕ-ᴥ-ʔ    
  ⊂___⊃ 🧊 
`;

// Blizzard — wide-eyed roar, icy gust streams to the side.
const FRAME_3 = String.raw`
   ⌒ ⌒        
  ʕ◉ᴥ◉ʔ ≋≋≋  
  ⊂___⊃ ❄️   
`;

// Afterglow — happy grin, snowflakes settling on the fur.
const FRAME_4 = String.raw`
   ⌒ ⌒    
  ʕ^ᴥ^ʔ    
  ⊂___⊃ ✨ 
`;

export const POLARBEAR_FRAMES: readonly string[] = [
  FRAME_1,
  FRAME_2,
  FRAME_3,
  FRAME_4,
  FRAME_1,
] as const;

export const POLARBEAR_NAME = "Frostpaw" as const;
export const POLARBEAR_TYPE = "ice" as const;
