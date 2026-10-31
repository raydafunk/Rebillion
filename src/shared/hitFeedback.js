// Tunable hit feedback values. Starting values from design/art/hit-feedback-spec.md (needs playtest).
export const HIT_STOP_MS = Object.freeze({
  light: 50, heavy: 100, finisher: 120, airkick: 140, playerHurt: 80, ko: 150,
  max: 150, // total cap; hit-stops never stack
});

// Per-move feedback overrides, keyed by player move id. hitStop is a HIT_STOP_MS key; shake is camera.shake(ms, intensity).
// Moves not listed use the damage-based light/heavy defaults in ArenaScene.
export const MOVE_FEEDBACK = Object.freeze({
  airkick: Object.freeze({ hitStop: 'airkick', shake: Object.freeze({ ms: 220, intensity: 0.008 }) }),
});

// Options "Screen Shake" setting (Off/Light/Full) -> intensity multiplier. Unknown values act as Full.
export const SHAKE_SCALE = Object.freeze({ Off: 0, Light: 0.5, Full: 1 });
export const shakeScale = (setting) => SHAKE_SCALE[setting] ?? 1;
