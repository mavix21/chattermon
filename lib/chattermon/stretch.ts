// Fourth Chattermon: a stretchy normal-type dog, inspired by Jake.
// Four ASCII frames that, when posted in sequence via SentMessage.edit(),
// show the dog winding up and unleashing his signature stretch-punch.

// Idle — floppy ears hanging, tongue lolling out, just chilling.
const FRAME_1 = String.raw`
   ⌐  ⌐     
  (ʋ❍ᴥ❍)    
  ‿(っ)っ   
`;

// Wind-up — arm coils backwards, ready to spring forward.
const FRAME_2 = String.raw`
  ⌐  ⌐      
 (ʋ◡ᴥ◡)   
 ‿(っ)っ    
`;

// Stretch punch — arm shoots across the line and lands a fist.
const FRAME_3 = String.raw`
   ⌐  ⌐            
  (ʋ❍皿❍)           
  ‿(っ)======つ💥
`;

// Afterglow — proud grin, dust settling after the hit.
const FRAME_4 = String.raw`
   ⌐  ⌐     
  (ʋ^ᴥ^)    
  ‿(っ)っ    
`;

export const DOG_FRAMES: readonly string[] = [
  FRAME_1,
  FRAME_2,
  FRAME_3,
  FRAME_4,
  FRAME_1,
] as const;

export const DOG_NAME = "Stretch" as const;
export const DOG_TYPE = "normal" as const;
