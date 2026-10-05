// Plain tunable data. Frames are 60 fps ticks.
// startup: frames before hitbox; active: hitbox frames; recovery: frames after.
// cancelFrom: first frame (0-based, counted from move start) at which a buffered
//   follow-up in `chain` may cancel into the next move.
// hitbox: relative to entity origin, facing right (flipped by facing).
// damage/knockback/hitstun are inputs for the hit-request (combat resolves them).
export const MOVES = {
  light1: {
    startup: 4, active: 3, recovery: 8, cancelFrom: 7,
    damage: 6, knockback: 120, hitstun: 14, hitbox: { x: 20, y: -24, w: 40, h: 24 },
    chain: { light: 'light2', heavy: 'heavy1' },
  },
  light2: {
    startup: 4, active: 3, recovery: 8, cancelFrom: 7,
    damage: 7, knockback: 140, hitstun: 14, hitbox: { x: 20, y: -24, w: 44, h: 24 },
    chain: { light: 'light3', heavy: 'heavy1' },
  },
  // Third hit of the 3-hit combo: finisher with bigger knockback.
  light3: {
    startup: 6, active: 4, recovery: 16, cancelFrom: 999,
    damage: 12, knockback: 320, hitstun: 24, hitbox: { x: 20, y: -28, w: 52, h: 32 },
    chain: {},
  },
  heavy1: {
    startup: 12, active: 4, recovery: 20, cancelFrom: 999,
    damage: 18, knockback: 380, hitstun: 28, hitbox: { x: 24, y: -30, w: 56, h: 36 },
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
export const DODGE = { duration: 24, iframes: 14, cooldown: 30, speed: 380 };
export const GUARD = {
  parryFrames: 8,
  blockKnockbackFactor: 0.25, // knockback kept while blocking
  blockKeepsStance: true,     // block ignores hitstun
};
