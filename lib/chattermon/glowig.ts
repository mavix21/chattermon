// Glowig: a tiny electric-type firefly that lights up meadows at dusk.
// Four ASCII frames showing Glowig hovering, charging its lantern, and flashing.
// Wings and body stay anchored; only the lantern glow and eye expression shift.

// Idle — wings mid-beat, lantern dim.
const FRAME_1 = String.raw`
   ^ ^     
 (o v o)  
  \. ./   
   [o]    
`;

// Charge — eyes scrunch as abdomen brightens.
const FRAME_2 = String.raw`
   ^ ^     
 (- v -)  
  \. ./   
   [*]    
`;

// Flash — eyes pop open, lantern blazes.
const FRAME_3 = String.raw`
  *^ ^*    
 (O v O)  
  \. ./   
  *[#]*   
`;

// Dim — wings fold down, content after the display.
const FRAME_4 = String.raw`
   v v     
 (^ v ^)  
  \. ./   
   [.]    
`;

export const GLOWIG_FRAMES: readonly string[] = [
  FRAME_1,
  FRAME_2,
  FRAME_3,
  FRAME_4,
  FRAME_1,
] as const;

export const GLOWIG_NAME = "Glowig" as const;
export const GLOWIG_TYPE = "electric" as const;
