// Eighth Chattermon: a chubby plant-type caterpillar.
// Five ASCII frames that, when posted in sequence via SentMessage.edit(),
// show Nibble spotting a leaf, chomping it, and beaming with satisfaction.
// The body segments, antennae, and feet are anchored in identical columns
// across every frame — only the eyes, mouth, and the floating leaf change,
// so the bite reads as a single fluid action instead of a jittery redraw.

// Idle — antennae perked, a tasty leaf drifts into view.
const FRAME_1 = String.raw`
           .    .        
            )  (         
  {{ { { { ( '_')      ❀ 
  >>>>>>>>>>'--'>        
`;

// Lock-on — eyes widen, leaf floats closer to the mouth.
const FRAME_2 = String.raw`
           .    .       
            )  (        
  {{ { { { ( ◉_◉)   ❀   
  >>>>>>>>>>'--'>       
`;

// Chomp — mouth opens wide, leaf vanishes mid-bite.
const FRAME_3 = String.raw`
           .    .       
            )  (        
  {{ { { { (  o<O❀      
  >>>>>>>>>>'--'>       
`;

// Chew — eyes squeeze shut, cheeks puff with happy munching.
const FRAME_4 = String.raw`
           .    .        
            )  (         
  {{ { { { ( -ᴥ-)        
  >>>>>>>>>>'--'>        
`;

// Settle — content grin, ready for the next leaf to wander by.
const FRAME_5 = String.raw`
           .    .        
            )  (         
  {{ { { { ( ^_^)        
  >>>>>>>>>>'--'>        
`;

export const NIBBLE_FRAMES: readonly string[] = [
  FRAME_1,
  FRAME_2,
  FRAME_3,
  FRAME_4,
  FRAME_5,
] as const;

export const NIBBLE_NAME = "Nibble" as const;
export const NIBBLE_TYPE = "plant" as const;
