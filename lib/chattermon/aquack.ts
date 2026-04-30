// Sixth Chattermon: a cute aqua-type duckling.
// Four ASCII frames that, when posted in sequence via SentMessage.edit(),
// show the little duck puffing up and launching bubbles to the right.

// Idle — facing right, beak closed, tail tucked in.
const FRAME_1 = String.raw`
   ,      
  (o>     
  <_)     
`;

// Inhale — eye squints shut as the duck gulps a lungful of air.
const FRAME_2 = String.raw`
   ,      
  (->     
  <_)     
`;

// Bubble attack — beak opens, a stream of bubbles shoots forward.
const FRAME_3 = String.raw`
   ,       
  (O< °ﾟ🫧  
  <_)      
`;

// Afterglow — proud quack, a last bubble drifts away.
const FRAME_4 = String.raw`
   ,      
  (^>   ° 
  <_)     
`;

export const AQUACK_FRAMES: readonly string[] = [
  FRAME_1,
  FRAME_2,
  FRAME_3,
  FRAME_4,
  FRAME_1,
] as const;

export const AQUACK_NAME = "Aquack" as const;
export const AQUACK_TYPE = "aqua" as const;
