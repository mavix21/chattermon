// Seventh Chattermon: a wise psychic-type owl.
// Seven ASCII frames that, when posted in sequence via SentMessage.edit(),
// show the owl swiveling its head a full 360° while its body stays put.

// Idle — facing forward, both eyes locked on you.
const FRAME_1 = String.raw`
   /\ /\   
  ((ovo))  
  ():::()  
    VVV    
`;

// Glance right — eyes drift to the side, ears begin to tilt.
const FRAME_2 = String.raw`
    /\/\   
  (( ovo) 
  ():::() 
    VVV    
`;

// Profile right — head a quarter turn, only one eye visible.
const FRAME_3 = String.raw`
     //\   
  ((   o>  
  ():::() 
    VVV    
`;

// Back of head — head fully reversed, just feathered nape showing.
const FRAME_4 = String.raw`
   /\ /\   
  ((   ))  
  ():::() 
    VVV    
`;

// Profile left — three-quarters around, eye peers from the other side.
const FRAME_5 = String.raw`
   /\\     
  <o   ))  
  ():::()  
    VVV    
`;

// Glance back — eyes sliding home, ears nearly squared again.
const FRAME_6 = String.raw`
   /\/\    
  (ovo ))  
  ():::()  
    VVV    
`;

// Settled — head returns to center, unimpressed by the trick.
const FRAME_7 = String.raw`
   /\ /\   
  ((-v-))  
  ():::()  
    VVV    
`;

export const HOOTS_FRAMES: readonly string[] = [
  FRAME_1,
  FRAME_2,
  FRAME_3,
  FRAME_4,
  FRAME_5,
  FRAME_6,
  FRAME_7,
  FRAME_1,
] as const;

export const HOOTS_NAME = "Hoots" as const;
export const HOOTS_TYPE = "psychic" as const;
