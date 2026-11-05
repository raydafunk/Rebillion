import { RAGE_IMPACT_FX as RIF } from './rageImpactFxData.js';

// Tunable hit feedback values. Starting values from design/art/hit-feedback-spec.md (needs playtest).
export const HIT_STOP_MS = Object.freeze({
  light: 50, heavy: 100, finisher: 120, airkick: 140, playerHurt: 80, ko: 150,
  gripSlam: 110, // Dugan's Wall Slam on Zed: only he freezes, so Zed's knockdown and the screen shake play straight away
  megaStomp: 90, // Dugan's slam: only he freezes (the target gets none)
  heavyFinisher: 180, // heavy3, the 3-hit heavy combo finisher: longest freeze in the game
  rageKick: RIF.shake.rageKick.hitStopMs, rageUppercut: RIF.shake.rageUppercut.hitStopMs, rageAirKick: RIF.shake.rageAirKick.hitStopMs, // Rage mega hits
  max: 180, // total cap; hit-stops never stack (raised from 150 for heavyFinisher)
});

// Per-move feedback overrides, keyed by player move id. hitStop is a HIT_STOP_MS key; shake is camera.shake(ms, intensity).
// Moves not listed use the damage-based light/heavy defaults in ArenaScene.
export const MOVE_FEEDBACK = Object.freeze({
  airkick: Object.freeze({ hitStop: 'airkick', shake: Object.freeze({ ms: 220, intensity: 0.008 }) }),
  // 3-hit heavy combo: every hit is a mega shake, ramping up to the finisher.
  heavy1: Object.freeze({ hitStop: 'heavy', shake: Object.freeze({ ms: 260, intensity: 0.012 }) }),
  heavy2: Object.freeze({ hitStop: 'heavy', shake: Object.freeze({ ms: 300, intensity: 0.015 }) }),
  heavy3: Object.freeze({ hitStop: 'heavy', shake: Object.freeze({ ms: 360, intensity: 0.019 }) }),
  heavy4: Object.freeze({ hitStop: 'heavyFinisher', shake: Object.freeze({ ms: 450, intensity: 0.024 }) }), // uppercut finisher: biggest of all
  // Rage set: mega shake per move (numbers live in rageImpactFxData.js)
  rageKick: Object.freeze({ hitStop: 'rageKick', shake: Object.freeze({ ms: RIF.shake.rageKick.durationMs, intensity: RIF.shake.rageKick.intensity }) }),
  rageUppercut: Object.freeze({ hitStop: 'rageUppercut', shake: Object.freeze({ ms: RIF.shake.rageUppercut.durationMs, intensity: RIF.shake.rageUppercut.intensity }) }),
  special: Object.freeze({ hitStop: 'rageUppercut', shake: Object.freeze({ ms: RIF.shake.rageUppercut.durationMs, intensity: RIF.shake.rageUppercut.intensity }) }), // Rage activation strike
  rageAirKick: Object.freeze({ hitStop: 'rageAirKick', shake: Object.freeze({ ms: RIF.shake.rageAirKick.durationMs, intensity: RIF.shake.rageAirKick.intensity }) }),
});

// Options "Screen Shake" setting (Off/Light/Full) -> intensity multiplier. Unknown values act as Full.
export const SHAKE_SCALE = Object.freeze({ Off: 0, Light: 0.5, Full: 1 });
export const shakeScale = (setting) => SHAKE_SCALE[setting] ?? 1;
