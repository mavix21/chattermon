// Spook: a psychic-type little ghost that drifts through shadowy corners.
// Four ASCII frames showing Spook phasing in, rattling chains, and vanishing.
// The wispy hem and arms are anchored; only eyes, mouth, and chains shift.

// Float — calm, drifting silently.
const FRAME_1 = String.raw`
  .~~~.   
 ( o o )  
  > ^ <   
 '~~'~~'  
`;

// Haunt — eyes glow wide, arms raise with rattling chains.
const FRAME_2 = String.raw`
  .~~~.   
 ( O O )  
  > w <   
 '~~'~~'  
`;

// Shriek — mouth opens, tiny shock waves radiate.
const FRAME_3 = String.raw`
  .~~~.   
 ( @ @ )  
  > D <   
 *~~'~~*  
`;

// Fade — half-transparent, features dissolve into dots.
const FRAME_4 = String.raw`
  ·~~~·   
 ( . . )  
  > - <   
 ·~~'~~·  
`;

export const SPOOK_FRAMES: readonly string[] = [
  FRAME_1,
  FRAME_2,
  FRAME_3,
  FRAME_4,
  FRAME_1,
] as const;

export const SPOOK_NAME = "Spook" as const;
export const SPOOK_TYPE = "psychic" as const;
