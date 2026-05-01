// Second Chattermon: a cute fire-type lion cub.
// Four ASCII frames that, when posted in sequence via SentMessage.edit(),
// give the impression of a small lion breathing and flaring up its fiery mane.

// Idle — mane curls relaxed, flame-tufted tail flicks.
const FRAME_1 = String.raw`
   ,~"~"~,    
   {(•ᴥ•)}    
  🔥‿( )    
`;

// Inhale — eyes squint shut, mane puffs as the cub draws breath.
const FRAME_2 = String.raw`
  ,~"~"~"~,   
  {{(-o-)}}   
  🔥‿( )  
`;

// Roar — mane ignites, fireball bursts from the muzzle.
const FRAME_3 = String.raw`
   ,~"~"~,  
  {{(◉Д◉)}} ༄༄
  🔥‿( )  
`;

// Afterglow — proud grin, sparks lingering in the mane.
const FRAME_4 = String.raw`
   ,~"~"~,    
   {(^ᴥ^)}    
  🔥‿( )  
`;

export const EMBERLEA_FRAMES: readonly string[] = [
  FRAME_1,
  FRAME_2,
  FRAME_3,
  FRAME_4,
  FRAME_1,
] as const;

export const EMBERLEA_NAME = "Emberlea" as const;
export const EMBERLEA_TYPE = "fire" as const;
