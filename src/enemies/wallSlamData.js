// Dugan's Wall Slam impact (Zed slammed into the ground): look, timing and shake numbers from design/art/dugan-wall-slam.md
// (art-direction-agent, PROPOSED values for playtest). Pure data and maths, no Phaser. Feedback only: no gameplay numbers here.
const hex = (s) => parseInt(s.replace('#', ''), 16);
const w = (table) => table.map(([c, p]) => [hex(c), p]);

export const LANE_TOP = 445, LANE_BOTTOM = 695;          // impact centre is clamped inside the lane
export const WALL_SLAM = {
  floorDepth: 440, topDepth: 5800, particleCap: 100,
  dent: { fill: hex('#2E1F16'), alpha: 0.55, rx: [70, 110], growMs: 90, rim: { color: hex('#6B4423'), widthPx: 3, alpha: 0.6 }, holdMs: 350, fadeToMs: 900, heightRatio: 0.3 },
  core: { color: hex('#FFF6D6'), rx: [40, 120], alpha: [0.7, 0], lifeMs: 70, heightRatio: 0.3 },
  ring: { colors: [hex('#FFF6D6'), hex('#F58A2A')], switchAtLife: 0.35, rx: [20, 210], widthPx: [6, 2], lifeMs: 240, heightRatio: 0.3 },
  ripples: [{ startMs: 70, rx: [30, 300], lifeMs: 380 }, { startMs: 120, rx: [30, 380], lifeMs: 460 }],
  ripple: { color: hex('#C9B79A'), widthPx: 2, alpha: 0.35 },
  cracks: {
    core: { color: hex('#2E1F16'), widthPx: 3, alpha: 0.7 }, glow: { color: hex('#F58A2A'), widthPx: 1, alpha: 0.8, fadeMs: 250 },
    segmentPx: [40, 60], jitterPx: [5, 3], holdMs: 700, fadeMs: 500,
    short: { count: 4, lengthPx: [90, 140], angleJitterRad: 0.25 },
    long: { count: 2, anglesDeg: [0, 180], angleJitterRad: 0.2, lengthPx: [220, 300] },
    slide: { lengthPx: 360, jitterPx: [3, 8], growMs: 140, yOffsetPx: 2 },
    branches: { count: 3, atPercent: [40, 55], angleDeg: 35, lengthScale: 0.4 },
    startLengthScale: 0.15,
  },
  chunks: { count: 14, sizePx: [6, 12], triangleShare: 0.4, spawnSpreadPx: [24, 8], speed: [260, 620], coneDegUp: [60, 120], gravity: 1400, restitution: 0.3, lifeMs: [600, 900],
    slideBiasCount: 4, colors: w([['#6B4423', 0.4], ['#2E1F16', 0.25], ['#C9B79A', 0.2], ['#7C8A96', 0.15]]) },
  sparks: { count: 6, lengthPx: [14, 20], thicknessPx: 3, coneDeg: 30, speed: [420, 760], gravity: 900, lifeMs: [220, 320],
    ramp: [[0, hex('#FFFFFF')], [0.2, hex('#FFD24A')], [0.5, hex('#F58A2A')], [0.8, hex('#9C5A2E')]], scrape: { everyMs: 90, max: 3, minSlideSpeed: 200 } },
  ringDust: { count: 16, startRx: 40, endRx: 200, travelMs: 420, sizePx: [26, 44], grow: 1.3, heightRatio: 0.8, alpha: [0.5, 0], colors: w([['#C9B79A', 0.6], ['#E8C27A', 0.25], ['#6B4423', 0.15]]) },
  pebbles: { count: 14, sizePx: [3, 5], radiusPx: [30, 160], hopVz: [120, 260], driftSpeed: [60, 140], gravity: 1000, lifeMs: 400, colors: [hex('#6B4423'), hex('#C9B79A')] },
  burstDust: { count: 12, sizePx: [40, 72], spreadPx: 70, lifeMs: [650, 850], risePx: 24, alpha: [0.55, 0] },
  slide: {
    activeAboveSpeed: 120,
    groove: { color: hex('#2E1F16'), widthPx: 3, alpha: 0.35, yOffsetPx: 2, lingerMs: 400, fadeMs: 300 },
    dust: { everyMs: 45, max: 10, sizePx: [24, 40], heightRatio: 0.8, risePx: 14, alpha: [0.4, 0], lifeMs: [400, 550] },
  },
  vignette: { color: hex('#2E1F16'), frames: 6, frameWidthPx: 14, alphaOuterToInner: [0.30, 0.05], inMs: 30, outMs: 370 },
  // [atMs from the slam, durationMs, intensity]: one hard crack (peak 0.015, under the Mega Stomp's 0.018) that is over before he stops sliding
  shake: [[0, 50, 0.015], [50, 70, 0.011], [120, 80, 0.0075], [200, 90, 0.0045], [290, 90, 0.0022]],
  lightScale: 0.5,
  reduce: { particleScale: 0.5, vignetteScale: 0.6, glowScale: 0.5,
    flashLow: { core: { color: hex('#E8C27A'), alpha: 0.3, lifeMs: 160 }, ring: { colors: [hex('#FFF6D6'), hex('#E8C27A')], alpha: 0.6, widthPx: 3 } } },
};

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;
const quadOut = (t) => 1 - (1 - t) * (1 - t);

/** Keep the impact centre inside the lane band. */
export const clampImpactY = (y) => Math.max(LANE_TOP, Math.min(LANE_BOTTOM, y));

/** Shake keyframes for the user's settings: scale 1 = Full, 0.5 = Light, 0 = Off or Reduced Motion. */
export function shakeFrames(scale = 1, frames = WALL_SLAM.shake) {
  if (!(scale > 0)) return [];
  return frames.map(([at, ms, k]) => ({ at, ms, intensity: k * scale }));
}

/** The dark dent under him at `t` ms after the slam: { rx, ry, alpha } or null when it is gone. */
export function dentAt(t, d = WALL_SLAM.dent) {
  if (t < 0 || t >= d.fadeToMs) return null;
  const rx = lerp(d.rx[0], d.rx[1], quadOut(clamp01(t / d.growMs)));
  const hold = d.holdMs, fade = clamp01((t - hold) / (d.fadeToMs - hold));
  return { rx, ry: rx * d.heightRatio, alpha: d.alpha * (1 - fade * fade) };
}

/** Distance a ring-dust puff has travelled (rx from startRx to endRx). */
export function ringRadius(t, c = WALL_SLAM.ringDust) { return lerp(c.startRx, c.endRx, quadOut(clamp01(t / c.travelMs))); }

/** Screen-edge vignette alpha multiplier at `t` ms: quick in, slower out. */
export function vignetteK(t, v = WALL_SLAM.vignette) {
  if (t < 0 || t >= v.inMs + v.outMs) return 0;
  return t < v.inMs ? t / v.inMs : 1 - quadOut(clamp01((t - v.inMs) / v.outMs));
}

/** Spark colour along its life (0..1) from the ramp. */
export function sparkColor(k, ramp = WALL_SLAM.sparks.ramp) {
  let c = ramp[0][1];
  for (const [at, col] of ramp) if (k >= at) c = col;
  return c;
}
