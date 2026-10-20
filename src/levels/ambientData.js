// Ambient background animation: pure layout helpers, no Phaser, so they are unit-testable.
// A level style may carry an `ambient` block (see content/levels/styles/level-01-brick-red-alley.json).
// Its x positions are measured inside one background image of `period` px; the image repeats along the level.

/** Every copy of the x positions that starts inside [0, worldW). */
export function tiledXs(xs, period, worldW) {
  if (!Array.isArray(xs) || !(period > 0) || !(worldW > 0)) return [];
  const out = [];
  for (let offset = 0; offset < worldW; offset += period) {
    for (const x of xs) if (offset + x < worldW) out.push(offset + x);
  }
  return out;
}

/** Cleaned ambient config, or null when there is nothing to animate. */
export function readAmbient(style) {
  const a = style && style.ambient;
  if (!a || !(a.period > 0)) return null;
  const num = (v, d) => (Number.isFinite(v) ? v : d);
  return {
    period: a.period,
    windowY: num(a.windowY, 110), windowW: num(a.windowW, 140), windowH: num(a.windowH, 170),
    color: typeof a.color === 'string' ? a.color : '#E3A92B',
    lit: Array.isArray(a.lit) ? a.lit : [],
    dark: Array.isArray(a.dark) ? a.dark : [],
    dustPerBeam: Math.max(0, Math.min(12, Math.round(num(a.dustPerBeam, 6)))),
    beamBottom: num(a.beamBottom, 430),
  };
}
