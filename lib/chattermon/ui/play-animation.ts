// ASCII play animation — a generic ball-toss sequence.
// Species-agnostic so it works for every chattermon.

export const PLAY_FRAMES: readonly string[] = [
  String.raw`
    o
   /|\ 
   / \ 
  `,
  String.raw`
        O
   \o/ 
    |  
   / \ 
  `,
  String.raw`
   \o    O
    |\ 
   / \ 
  `,
  String.raw`
       O
   \o/ 
    |  catch!
   / \ 
  `,
  String.raw`
   \o/
    |  *
   / \ yay!
  `,
] as const;
