// Tunable hit feedback values. Starting values from design/art/hit-feedback-spec.md (needs playtest).
export const HIT_STOP_MS = Object.freeze({
  light: 50, heavy: 100, finisher: 120, playerHurt: 80, ko: 150,
  max: 150, // total cap; hit-stops never stack
});
