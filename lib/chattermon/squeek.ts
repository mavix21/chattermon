// Squeek: a tiny normal-type field mouse found scurrying through tall grass.
// Four ASCII frames that animate Squeek sniffing the air, spotting something,
// and darting off with its little tail curled behind it.
// The body and ears stay anchored; only eyes, whiskers, and tail shift.

// Idle — sitting still, ears perked, whiskers twitching.
const FRAME_1 = String.raw`
   /\_/\  
  ( o.o ) 
  -=( )=- 
     u    
`;

// Sniff — nose dips down, eyes half-close.
const FRAME_2 = String.raw`
   /\_/\  
  ( -.- ) 
  -=( )=- 
     u    
`;

// Alert — eyes wide open, whiskers spread.
const FRAME_3 = String.raw`
   /\_/\  
  ( O.O ) 
  -=( )=- 
     u    
`;

// Dash — body leans forward, tail whips up.
const FRAME_4 = String.raw`
  ~~\ /\  
  ( >.>) ~ 
   =( )=  
    ~u    
`;

export const SQUEEK_FRAMES: readonly string[] = [
  FRAME_1,
  FRAME_2,
  FRAME_3,
  FRAME_4,
  FRAME_1,
] as const;

export const SQUEEK_NAME = "Squeek" as const;
export const SQUEEK_TYPE = "normal" as const;
