// Sixth Chattermon: a fierce flying-type raptor.
// Four ASCII frames that, when posted in sequence via SentMessage.edit(),
// show the bird narrowing its eye, flaring its wings, and letting out a screech.

// Idle — perched with a sleek tuft, single eye scanning the horizon.
const FRAME_1 = String.raw`
    \\      
    (o>     
 \\_//)     
  \_/_)     
   _|_      
`;

// Lock-on — eye narrows, beak points sharp at unseen prey.
const FRAME_2 = String.raw`
    \\      
    (-<     
 \\_//)     
  \_/_)     
   _|_      
`;

// Screech — wings flare wide, a sharp cry tears through the air.
const FRAME_3 = String.raw`
    \\         
    (◉< ༄༄   
 \\\//)///    
   \_/_)       
    _|_        
`;

// Afterglow — feathers settle, satisfied glint in the eye.
const FRAME_4 = String.raw`
    \\      
    (^>     
 \\_//)     
  \_/_)     
   _|_      
`;

export const TALON_FRAMES: readonly string[] = [
  FRAME_1,
  FRAME_2,
  FRAME_3,
  FRAME_4,
  FRAME_1,
] as const;

export const TALON_NAME = "Talon" as const;
export const TALON_TYPE = "flying" as const;
