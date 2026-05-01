// Generic egg-hatching animation, reusable across all chattermon.
// Plays before the chattermon's own sprite frames take over.

// Intact egg, sitting still.
const EGG_F1 = String.raw`
    ___     
   /   \    
  (     )   
   \___/    
`;

// Wiggle to the right — something's stirring inside.
const EGG_F2 = String.raw`
     ___    
    /   \   
   (     )  
    \___/   
`;

const EGG_F3 = String.raw`
    _·_     
   / \ \    
  (     )   
   \___/    
`;

const EGG_F4 = String.raw`
    _ _     
   / \ \ ·  
  (  /  )   
   \___/    
`;

// Cracks spread across the shell.
const EGG_F5 = String.raw`
    _ _     
   / \ \    
  (  /  )   
   \_\_/ ·   
`;

const EGG_F6 = String.raw`
            
   *   *    
 *       *  
   *   *    
`;

export const EGG_HATCH_FRAMES: readonly string[] = [
  EGG_F1,
  EGG_F2,
  EGG_F1,
  EGG_F3,
  EGG_F4,
  EGG_F5,
  EGG_F6,
] as const;
