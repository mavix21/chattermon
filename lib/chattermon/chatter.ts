// Fifth Chattermon: a cute sound-type singer bird.
// Four ASCII frames that, when posted in sequence via SentMessage.edit(),
// show the little bird taking a breath and whistling a tune.

// Idle — perched in profile: tuft, head with beak, folded wing, feet.
const FRAME_1 = String.raw`
   ღ    
  ( o>   
  ///\   
  \V_/_  
`;

// Inhale — eye squeezes shut as the bird draws a deep breath.
const FRAME_2 = String.raw`
   ღ    
  ( -<   
  ///\   
  \V_/_  
`;

// Whistle — beak opens wide, notes stream out into the air.
const FRAME_3 = String.raw`
   ღ    
  ( ㆆ<♪ ♬   
  ///\      
  \V_/_      
`;

// Afterglow — proud chirp, last note still hanging in the air.
const FRAME_4 = String.raw`
   ღ    
  ( ^>   
  ///\   
  \V_/_  
`;

export const CHATTER_FRAMES: readonly string[] = [
  FRAME_1,
  FRAME_2,
  FRAME_3,
  FRAME_4,
  FRAME_1,
] as const;

export const CHATTER_NAME = "Chatter" as const;
export const CHATTER_TYPE = "flying" as const;
