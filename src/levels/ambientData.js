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

/** Shopfront slots for a row-style background: x of each shop, and whether its shutter is still chained. */
export function rowShops(row, worldW) {
  if (!row || !(row.period > 0) || !(row.shopPitch > 0) || !(row.shopCount > 0) || !(worldW > 0)) return [];
  const out = [];
  for (let offset = 0; offset < worldW; offset += row.period) {
    for (let i = 0; i < row.shopCount; i++) {
      const x = offset + row.shopX0 + i * row.shopPitch;
      if (x < worldW) out.push({ x, chained: i < row.chainedCount });
    }
  }
  return out;
}

/** Bulb positions along the string-light wire; y follows the wire's sag per span. */
export function rowBulbs(row, worldW) {
  if (!row || !(row.period > 0) || !(row.bulbStep > 0) || !(row.bulbCount > 0) || !(row.bulbSpan > 0)) return [];
  const out = [];
  for (let offset = 0; offset < worldW; offset += row.period) {
    for (let i = 0; i < row.bulbCount; i++) {
      const x = offset + row.bulbX0 + i * row.bulbStep;
      if (x >= worldW) continue;
      const t = ((row.bulbX0 + i * row.bulbStep) % row.bulbSpan) / row.bulbSpan;
      out.push({ x, y: row.bulbY + 4 * t * (1 - t) * row.bulbSag, i });
    }
  }
  return out;
}

function readRow(period, r) {
  if (!r || !(r.shopPitch > 0)) return null;
  const num = (v, d) => (Number.isFinite(v) && v >= 0 ? v : d);
  return {
    period,
    shopX0: num(r.shopX0, 8), shopPitch: r.shopPitch, shopCount: Math.round(num(r.shopCount, 8)), chainedCount: Math.round(num(r.chainedCount, 0)),
    bulbX0: num(r.bulbX0, 34), bulbStep: num(r.bulbStep, 68), bulbCount: Math.round(num(r.bulbCount, 0)),
    bulbY: num(r.bulbY, 14), bulbSag: num(r.bulbSag, 22), bulbSpan: num(r.bulbSpan, 960),
    crazy: Math.max(0, Math.min(3, num(r.crazy, 1))),
  };
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
    row: readRow(a.period, a.row),
  };
}
