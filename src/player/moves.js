// Plain tunable data. Frames are 60 fps ticks.
// startup: frames before hitbox; active: hitbox frames; recovery: frames after.
// cancelFrom: first frame (0-based, counted from move start) at which a buffered
//   follow-up in `chain` may cancel into the next move.
// hitbox: relative to entity origin, facing right (flipped by facing).
const SWING = 'zed-swing-whoosh'; // swing whoosh key (see heavyHit.js)

// damage/knockback/hitstun are inputs for the hit-request (combat resolves them).
import { PLAYER_MOVE_COMBAT as C } from '../shared/combatData.js';

// damage/knockback/hitstun/hitbox come from combatData.js (single source).
export const MOVES = {
  light1: {
    startup: 4, active: 3, recovery: 14, cancelFrom: 7, swingSound: SWING,
    ...C.light1, hitbox: { ...C.light1.hitbox },
    chain: { light: 'light2', heavy: 'heavy1' },
  },
  light2: {
    startup: 4, active: 3, recovery: 14, cancelFrom: 7, swingSound: SWING,
    ...C.light2, hitbox: { ...C.light2.hitbox },
    chain: { light: 'light3', heavy: 'heavy1' },
  },
  // Third hit of the 3-hit combo: finisher with bigger knockback.
  light3: {
    startup: 6, active: 4, recovery: 16, cancelFrom: 999, hitSound: 'zed-kick-hit', swingSound: SWING,
    ...C.light3, hitbox: { ...C.light3.hitbox },
    chain: {},
  },
  heavy1: {
    startup: 12, active: 4, recovery: 20, cancelFrom: 999, heavy: true, swingSound: SWING,
    ...C.heavy1, hitbox: { ...C.heavy1.hitbox },
    chain: {},
  },
};

// Which move each button starts from neutral.
export const OPENERS = { light: 'light1', heavy: 'heavy1' };

export const PLAYER_TIMING = {
  attackBufferFrames: 8,   // how long a pressed attack waits for a cancel window
  blockStartupFrames: 0,   // block is instant (responsiveness)
};

// Defence. Dodge: i-frames then recovery. Block: first parryFrames of a fresh block is a parry.
export const DODGE = { duration: 36, iframes: 20, cooldown: 30, speed: 0 }; // sway dodge: in place, slower
// Parry (T or M): dedicated reaction clip. First `window` frames negate hits (guardType 'parry'), rest is recovery.
export const PARRY = { duration: 27, window: 14, cooldown: 24 };
export const GUARD = {
  parryFrames: 8,
  blockKnockbackFactor: 0.25, // knockback kept while blocking
  blockKeepsStance: true,     // block ignores hitstun
};
