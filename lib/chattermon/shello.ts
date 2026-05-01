// Shello: a laid-back aqua-type garden snail found near ponds and puddles.
// Four ASCII frames showing Shello peeking out, squirting water, and retreating.
// The spiral shell stays locked; only the body, eyestalks, and water jet change.

// Peek — eyestalks up, body extended.
const FRAME_1 = String.raw`
  o  o    
 (uu o)   
  \@@/    
`;

// Squint — eyestalks droop, gathering moisture.
const FRAME_2 = String.raw`
  .  .    
 (uu o)   
  \@@/    
`;

// Squirt — mouth opens, a jet of water shoots forward.
const FRAME_3 = String.raw`
  o  o    
(uu   O)~~ 
  \@@/ ~  
`;

// Retreat — body pulls into shell, only eyes visible.
const FRAME_4 = String.raw`
  ^  ^     
 (uu o)    
  \@@/    
`;

export const SHELLO_FRAMES: readonly string[] = [
  FRAME_1,
  FRAME_2,
  FRAME_3,
  FRAME_4,
  FRAME_1,
] as const;

export const SHELLO_NAME = "Shello" as const;
export const SHELLO_TYPE = "aqua" as const;
