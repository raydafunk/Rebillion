// Plain tunable data. Frames are 60 fps ticks.
// startup: frames before hitbox; active: hitbox frames; recovery: frames after.
// cancelFrom: first frame (0-based, counted from move start) at which a buffered
//   follow-up in `chain` may cancel into the next move.
// hitbox: relative to entity origin, facing right (flipped by facing).
const SWING = 'zed-swing-whoosh'; // swing whoosh key (see heavyHit.js)

// damage/knockback/hitstun are inputs for the hit-request (combat resolves them).
import { PLAYER_MOVE_COMBAT as C } from '../shared/combatData.js';
import { SPECIAL_MOVE, RAGE_MOVES } from './rageConfig.js';

// damage/knockback/hitstun/hitbox come from combatData.js (single source).
// Heavy-chain numbers kept here (src/shared/combatData.js is owned by combat-agent and pins its key list).
const HEAVY_EXTRA = {
  heavy2:   { damage: 22, knockback: 460, hitstun: 30, hitbox: { x: 20, y: -30, w: 62, h: 36 } }, // hard kick, heavy1 -> heavy
  airheavy: { damage: 14, knockback: 560, hitstun: 22, hitbox: { x: 14, y: -26, w: 56, h: 40 } }, // airborne heavy: double flying kick
  heavy3:   { damage: 24, knockback: 520, hitstun: 32, hitbox: { x: 20, y: -30, w: 66, h: 38 } }, // third hit: kick, sets up the uppercut
  heavy4:   { damage: 30, knockback: 900, hitstun: 44, hitbox: { x: 18, y: -44, w: 62, h: 58 } }, // combo finisher: heavy uppercut, BIG knockback
};

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
    startup: 12, active: 4, recovery: 20, cancelFrom: 14, heavy: true, swingSound: SWING,
    ...C.heavy1, hitbox: { ...C.heavy1.hitbox },
    chain: { heavy: 'heavy2' },
    autoChain: 'heavy2', // when this hit LANDS, flow into the next hit without another press
  },
  // Heavy chain step 2: hard high kick. Auto-continues into heavy3 when it lands.
  heavy2: {
    startup: 8, active: 4, recovery: 22, cancelFrom: 12, heavy: true, swingSound: SWING,
    ...HEAVY_EXTRA.heavy2, hitbox: { ...HEAVY_EXTRA.heavy2.hitbox },
    chain: { heavy: 'heavy3' },
    autoChain: 'heavy3',
  },
  // Heavy chain step 3: kick. Auto-continues into the uppercut when it lands.
  heavy3: {
    startup: 8, active: 4, recovery: 22, cancelFrom: 12, heavy: true, swingSound: SWING,
    ...HEAVY_EXTRA.heavy3, hitbox: { ...HEAVY_EXTRA.heavy3.hitbox },
    chain: { heavy: 'heavy4' },
    autoChain: 'heavy4',
  },
  // Heavy chain step 4: heavy uppercut finisher, big knockback. Final hit, cannot chain.
  heavy4: {
    startup: 9, active: 4, recovery: 28, cancelFrom: 999, heavy: true, swingSound: SWING,
    ...HEAVY_EXTRA.heavy4, hitbox: { ...HEAVY_EXTRA.heavy4.hitbox },
    chain: {},
  },
  // Airborne heavy press, once per jump (shared with airkick). Active until landing.
  airheavy: {
    startup: 5, active: 40, recovery: 6, cancelFrom: 999, airOnly: true, heavy: true, swingSound: SWING,
    ...HEAVY_EXTRA.airheavy, hitbox: { ...HEAVY_EXTRA.airheavy.hitbox },
    chain: {},
  },
  // Rage special: only reachable while Rage is ACTIVE (RAGE_OPENERS). Tuning in rageConfig.js.
  special: { ...SPECIAL_MOVE, rage: true, swingSound: SWING, hitbox: { ...SPECIAL_MOVE.hitbox }, chain: {} },
  // Rage attack set: light -> kick, heavy -> uppercut, airborne press -> air kick.
  rageKick: { ...RAGE_MOVES.rageKick, hitSound: 'zed-kick-hit', swingSound: SWING, hitbox: { ...RAGE_MOVES.rageKick.hitbox } },
  rageUppercut: { ...RAGE_MOVES.rageUppercut, swingSound: SWING, hitbox: { ...RAGE_MOVES.rageUppercut.hitbox } },
  rageAirKick: { ...RAGE_MOVES.rageAirKick, hitSound: 'zed-kick-hit', swingSound: SWING, hitbox: { ...RAGE_MOVES.rageAirKick.hitbox } },
};

// Which move each button starts from neutral.
export const OPENERS = { light: 'light1', heavy: 'heavy1' };

// During Rage the light button (and L) throws the Special Kick, heavy throws the Special Uppercut. The 'special' move
// itself is only the Rage activation strike (beginRage).
export const RAGE_OPENERS = { light: 'rageKick', heavy: 'rageUppercut' };
export const RAGE_AIR_MOVES = { light: 'rageAirKick', heavy: 'rageAirKick' };

export const PLAYER_TIMING = {
  attackBufferFrames: 8,   // how long a pressed attack waits for a cancel window
  blockStartupFrames: 0,   // block is instant (responsiveness)
};

// Defence. Block: first parryFrames of a fresh block is a parry.
// Parry (T or M): dedicated reaction clip. First `window` frames negate hits (guardType 'parry'), rest is recovery.
// A hit landing inside `window` is negated, stuns the attacker for `stunMs` (no knockback) and opens a
// counter-attack cancel until `duration` ends.
// Tuned for forgiveness (60 fps frames): window 14 -> 20 (~333 ms, covers the 360 ms grunt telegraph's last stretch),
// cooldown 24 -> 14 (a mistimed press is no longer a 400 ms death sentence), recovery kept short (14 frames after the window),
// stun 900 -> 1200 ms so the counter-attack has time to land a full string.
export const PARRY = { duration: 34, window: 20, cooldown: 14, stunMs: 1200, riposteDamage: 22 };   // a parry is also a weapon: the attacker takes riposteDamage (no knockback, it is already stunned)
// Item pick-up (crouch and grab): movement/attacks locked for `duration` frames (60 fps steps), 5-frame clip at 12 fps ~ 25.
export const PICKUP_POSE = { duration: 25 };
export const GUARD = {
  parryFrames: 12,            // fresh block doubles as a parry for 12 frames (was 8, ~200 ms): holding block early is a safe way to parry
  blockKnockbackFactor: 0.25, // knockback kept while blocking
  blockKeepsStance: true,     // block ignores hitstun
};
