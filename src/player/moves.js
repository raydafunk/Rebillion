// Plain tunable data. Frames are 60 fps ticks.
// startup: frames before hitbox; active: hitbox frames; recovery: frames after.
// cancelFrom: first frame (0-based, counted from move start) at which a buffered
//   follow-up in `chain` may cancel into the next move.
// hitbox: relative to entity origin, facing right (flipped by facing).
const SWING = 'zed-swing-whoosh'; // swing whoosh key (see heavyHit.js)

// damage/knockback/hitstun are inputs for the hit-request (combat resolves them).
import { PLAYER_MOVE_COMBAT as C } from '../shared/combatData.js';
import { SPECIAL_MOVE } from './rageConfig.js';

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
  // Flying kick: airborne light press, once per jump. Active until landing ends the move (recovery is a safety cap).
  airkick: {
    startup: 4, active: 40, recovery: 6, cancelFrom: 999, airOnly: true, swingSound: SWING,
    ...C.airkick, hitbox: { ...C.airkick.hitbox },
    chain: {},
  },
  heavy1: {
    startup: 12, active: 4, recovery: 20, cancelFrom: 999, heavy: true, swingSound: SWING,
    ...C.heavy1, hitbox: { ...C.heavy1.hitbox },
    chain: {},
  },
  // Rage special: only reachable while Rage is ACTIVE (RAGE_OPENERS). Tuning in rageConfig.js.
  special: { ...SPECIAL_MOVE, swingSound: SWING, hitbox: { ...SPECIAL_MOVE.hitbox }, chain: {} },
};

// Which move each button starts from neutral.
export const OPENERS = { light: 'light1', heavy: 'heavy1' };

// During Rage every attack button (and L) starts the single Special instead of the normal set.
export const RAGE_OPENERS = { light: 'special', heavy: 'special' };

export const PLAYER_TIMING = {
  attackBufferFrames: 8,   // how long a pressed attack waits for a cancel window
  blockStartupFrames: 0,   // block is instant (responsiveness)
};

// Defence. Block: first parryFrames of a fresh block is a parry.
// Parry (T or M): dedicated reaction clip. First `window` frames negate hits (guardType 'parry'), rest is recovery.
// A hit landing inside `window` is negated, stuns the attacker for `stunMs` (no knockback) and opens a
// counter-attack cancel until `duration` ends.
export const PARRY = { duration: 27, window: 14, cooldown: 24, stunMs: 900 };
// Item pick-up (crouch and grab): movement/attacks locked for `duration` frames (60 fps steps), 5-frame clip at 12 fps ~ 25.
export const PICKUP_POSE = { duration: 25 };
export const GUARD = {
  parryFrames: 8,
  blockKnockbackFactor: 0.25, // knockback kept while blocking
  blockKeepsStance: true,     // block ignores hitstun
};
