// Pure tuning data for Rage impact FX (no Phaser, no side effects). Spec: design/art/rage-impact-fx.md
// Fires only when the hit request carries rage:true. Times in real (unscaled) ms, colours as 0xRRGGBB.
// Colours reuse RAGE_ENTRY_FX.colors (src/player/rageConfig.js); duplicated here so this file stays dependency free.
const C = { red: 0xd62a1e, redWhite: 0xffe3d6, white: 0xffffff, ember: 0x7a2e1a, brown: 0x2e1f16, gold: 0xffd24a, brick: 0xa8402e };

export const RAGE_IMPACT_FX = {
  // MEGA SHAKE: every impact Zed lands while Rage is ACTIVE. intensity is Phaser camera shake (fraction of view; 0.005 ~ 6 px at 1280).
  shake: {
    rageKick: {
      durationMs: 150, intensity: 0.009, hitStopMs: 70,
      flash: { alpha: 0.35, inMs: 20, outMs: 110, color: C.redWhite, tint: C.red }, // white-red full-screen punch
      impactBurst: { radius: 70, durationMs: 110, color: C.white, edge: C.red },     // spark flash at contact point
    },
    rageUppercut: {
      durationMs: 240, intensity: 0.016, hitStopMs: 120,
      flash: { alpha: 0.5, inMs: 25, outMs: 170, color: C.white, tint: C.red },
      impactBurst: { radius: 110, durationMs: 160, color: C.white, edge: C.red },
    },
    rageAirKick: {
      durationMs: 170, intensity: 0.011, hitStopMs: 80,
      flash: { alpha: 0.4, inMs: 20, outMs: 120, color: C.redWhite, tint: C.red },
      impactBurst: { radius: 80, durationMs: 120, color: C.white, edge: C.red },
    },
  },

  // LOADS OF DUST: when a Rage hit KILLS the enemy. Drawn in code at the enemy's feet (world px).
  killDust: {
    count: 40,                         // puff circles
    radiusMin: 8, radiusMax: 26,       // px, start radius
    growTo: 1.8,                       // end scale multiplier
    speedMin: 110, speedMax: 360,      // px/s, outward horizontal burst
    spreadDeg: 160,                    // fan centred on the ground plane (flat, slightly upward)
    riseSpeedMin: 30, riseSpeedMax: 140, // px/s upward drift
    gravity: -60,                      // px/s^2 (negative = keeps rising slowly, air drag feel)
    drag: 0.9,                         // horizontal velocity multiplier per second kept
    lifetimeMinMs: 450, lifetimeMaxMs: 900,
    alphaStart: 0.85, alphaEnd: 0, fade: 'quadOut',
    spawnYJitter: 6, spawnXJitter: 24,
    colors: [C.brown, C.ember, C.brick, 0xb08a5a, 0xd9b27a, C.redWhite], // warm browns, ember, a few pale dust tones
    colorWeights: [3, 3, 1, 3, 3, 1],
    ring: { radiusFrom: 12, radiusTo: 150, durationMs: 380, lineWidth: 10, alphaStart: 0.8, color: C.redWhite, fillColor: C.ember, fillAlpha: 0.25, squashY: 0.35 }, // flat ground ellipse puff
    secondaryRing: { delayMs: 70, radiusTo: 105, durationMs: 320, lineWidth: 6, alphaStart: 0.55, color: C.red },
    maxActiveParticles: 120,           // pool cap so several kills in a row stay cheap
  },

  // Reduced motion / hitFlash 'Low' (same test as ArenaScene._reduceFlash()).
  reduced: {
    shake: false, shakeScale: 0,       // no camera shake
    hitStopScale: 0.5,                 // halve hit-stop
    flashAlphaMax: 0.2, flashColor: C.red, noPureWhite: true, impactBurst: false,
    killDustCountScale: 0.5, killDustSpeedScale: 0.6, killDustRing: true, killDustSecondaryRing: false,
  },
};
