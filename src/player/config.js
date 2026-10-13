// Tunable movement constants (px, px/s, ms).
export const ZED_CONFIG = {
  spriteKey: 'player.zed.placeholder', // not in src/config/assetKeys.js yet; Zed generates a rectangle if missing
  bodySize: { w: 32, h: 72 },
  runSpeed: 220,
  jumpVelocity: -520,
  gravity: 1400,
  jumpCutMultiplier: 0.5,   // release jump early -> shorter hop
  coyoteMs: 90,
  jumpBufferMs: 110,
  attackMoveFactor: 0.0,    // horizontal speed multiplier while attacking
  blockMoveFactor: 0.0,
  fixedStepMs: 1000 / 60,
};
