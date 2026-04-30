// First Chattermon: a cute electric-type rabbit.
// Three ASCII frames that, when posted in sequence via SentMessage.edit(),
// give the impression of a hopping rabbit with Pikachu-style sparking cheeks.

const FRAME_1 = String.raw`
   (\_/)   
   (•ᴥ•)
   />🥕>  
`;

// Charging — tiny static on the cheeks.
const FRAME_2 = String.raw`
   (\_/)   
  ·(•ᴥ•)·  
   />🥕>   
`;

// Discharge — full zap, ears flatten from the jolt.
const FRAME_3 = String.raw`
   (\_/)   
  ⚡(-ᴥ-)⚡  
   />🥕>   
`;

// Afterglow — sparkles linger, ears perk back up.
const FRAME_4 = String.raw`
   (\_/)   
 ⚡ (^ᴥ^) ⚡ 
   />🥕>    
`;

export const HOPPY_FRAMES: readonly string[] = [
  FRAME_1,
  FRAME_2,
  FRAME_3,
  FRAME_4,
  FRAME_1,
] as const;

export const HOPPY_NAME = "Hoppy" as const;
export const HOPPY_TYPE = "electric" as const;
