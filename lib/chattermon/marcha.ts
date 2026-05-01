// Marcha: a plant-type carpenter ant that carries leaf bits back to the colony.
// Four ASCII frames showing Marcha hoisting a leaf, marching, and planting it.
// The six legs and antennae are the anchor; the carried leaf and expression change.

// Idle — mandibles open, antennae straight, no cargo yet.
const FRAME_1 = String.raw`
  | |      
 (o_o)     
 /|||\ ~~  
`;

// Pick-up — mandibles clamp onto a leaf scrap.
const FRAME_2 = String.raw`
  | |  ~~  
 (o_o)~~   
 /|||\ ~~  
`;

// March — carrying the leaf overhead, eyes determined.
const FRAME_3 = String.raw`
  | | ~~~  
 (-_-)~~~  
 /||\|/   
`;

// Plant — leaf pressed into ground, satisfied smile.
const FRAME_4 = String.raw`
  | |  v   
 (^_^) v   
 /|||\ v   
`;

export const MARCHA_FRAMES: readonly string[] = [
  FRAME_1,
  FRAME_2,
  FRAME_3,
  FRAME_4,
  FRAME_1,
] as const;

export const MARCHA_NAME = "Marcha" as const;
export const MARCHA_TYPE = "plant" as const;
