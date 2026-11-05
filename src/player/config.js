// Tunable movement constants (px, px/s, ms).
export const ZED_CONFIG = {
  spriteKey: 'player.zed.placeholder', // not in src/config/assetKeys.js yet; Zed generates a rectangle if missing
  bodySize: { w: 32, h: 72 },
  runSpeed: 220,
  depthSpeed: 150,          // px/s up/down the floor band (beat-'em-up depth movement)
  jumpVelocity: -640,       // apex = v^2 / 2g ~ 136px: clears a grunt's hurtbox (80px) and attack box (feet-65 to feet-25)
  gravity: 1500,            // ~0.85s of air time, ~0.6s of it above the grunt's strike zone, ~185px of reach at runSpeed
  jumpCutMultiplier: 0.5,   // release jump early -> shorter hop
  coyoteMs: 90,
  jumpBufferMs: 110,
  attackMoveFactor: 0.0,    // horizontal speed multiplier while attacking
  blockMoveFactor: 0.0,
  fixedStepMs: 1000 / 60,
};

// A "launch" hit (Kane's Crushing Uppercut) shows the lunge-in-the-air clip instead of Taking_Punch. damage-applied carries no move id
// (attackId is `<id>:<counter>:<ms>`), so it is recognised by its numbers: long hitstun AND real knockback. Kane's uppercut is 450 ms / 300;
// every other enemy hit is <= 420 ms (Kane's hook pull is 420 ms / -560, so the cut is 440), or long-stun-but-weak (Royce stun 600 ms / 180, trap tick 450 ms / 120).
export const LAUNCH_HIT = { minHitstunMs: 440, minKnockback: 250 };
/** True when a damage-applied payload is a launch hit (the uppercut). Pure. */
export function isLaunchHit(d, t = LAUNCH_HIT) {
  return !!d && (d.hitstun ?? 0) >= t.minHitstunMs && Math.abs(d.knockback ?? 0) >= t.minKnockback;
}
