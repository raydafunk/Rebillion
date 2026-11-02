// Dugan's Mega Stomp: look, timing and shake numbers from design/art/dugan-mega-stomp.md (art-direction-agent, PROPOSED values for playtest).
// Pure data and maths, no Phaser. The gameplay numbers (slam time, wave speed and reach) come from duganData.js so the picture cannot drift from the hit-test.
import { DUGAN_MOVES } from './duganData.js';

const stomp = DUGAN_MOVES.stomp;
export const SLAM_AT_MS = stomp.telegraphMs + stomp.wave.startAt;   // 850: clock time of the slam, from the start of the wind-up
export const WAVE_SPEED = stomp.wave.speed;                         // px/s
export const WAVE_REACH = stomp.wave.reachPx;                       // px each side
export const LANE_TOP = 440, LANE_BOTTOM = 700;                      // the fronts are lane tall (the 460..680 lane plus a 20 px margin)

export const MEGA_STOMP = {
  telegraph: {
    durationMs: stomp.telegraphMs, slamAtMs: SLAM_AT_MS,
    disc: { heightRatio: 0.3, rx: [70, 230], fill: 0x14181c, alpha: [0, 0.45], rim: { colors: [0x7c8a96, 0x4fb3d9], switchFromMs: 550, switchToMs: 700, widthPx: [3, 5], alpha: 0.8 },
      afterSlam: { fill: 0x2e1f16, alpha: [0.5, 0], fadeMs: [850, 1350] } },
    ghostPulses: { startsMs: [150, 500], speedPxPerSec: 850, reachPx: 250, color: 0x7c8a96, widthPx: 4, alpha: 0.5 },
    reachGates: { xOffsetPx: 760, dash: [18, 14], widthPx: 3, color: 0xff3b30, alpha: [0, 0.4], fadeInMs: 300, fadeOutMs: [1544, 1744] },
    leapShadowScale: 0.5,
  },
  wave: {
    front: { color: 0xfff6d6, widthPx: 6, alpha: 1 },
    teeth: { count: 12, spacingPx: 22, basePx: 14, heightPx: 34, leanPx: 8, fill: 0xe8c27a, outline: 0x2e1f16, outlinePx: 2 },
    band: { color: 0xf58a2a, widthPx: 26, alpha: [0.8, 0.3] },
    trail: {
      dust: { color: 0xc9b79a, widthPx: 80, alpha: [0.35, 0] },
      cracks: { everyPx: 40, lengthPx: [30, 60], segments: 3, core: { color: 0x2e1f16, widthPx: 3, alpha: 0.6, holdMs: 300, fadeMs: 400 }, glow: { color: 0xf58a2a, widthPx: 1, alpha: 0.9, fadeMs: 400 }, radial: { count: 6, lengthPx: [120, 200], lifeMs: 900 } },
      warningPops: { everyPx: 30, aheadPx: [30, 120], sizePx: [2, 18], color: 0x6b4423, alpha: 0.5 },
    },
    fade: { fromPx: 560, toPx: 760 },
    slamCore: { color: 0xfff6d6, rx: [80, 200], heightRatio: 0.3, alpha: 0.8, lifeMs: 90 },
    slamRing: { colors: [0xfff6d6, 0xf58a2a], rx: [30, 260], heightRatio: 0.3, widthPx: 8, lifeMs: 260 },
  },
  debris: {
    slam: { count: 18, sizePx: [6, 14], triangleShare: 0.4, speed: [300, 700], coneDegUp: [55, 125], gravity: 1400, restitution: 0.35, lifeMs: [700, 1000],
      colors: [[0x6b4423, 0.4], [0x2e1f16, 0.25], [0xc9b79a, 0.2], [0x7c8a96, 0.15]] },
    front: { everyPx: 60, vy: [-380, -520], sizePx: [6, 10], gravity: 1400, lifeMs: 450 },
    layerDepth: 5800,
  },
  dust: {
    slamBurst: { count: 14, sizePx: [40, 80], lifeMs: [700, 900] },
    trail: { everyPx: 38, sizePx: [24, 48], heightRatio: 0.8, riseYPx: 30, alpha: [0.5, 0], lifeMs: [500, 700] },
    colors: [[0xc9b79a, 0.6], [0xe8c27a, 0.25], [0x6b4423, 0.15]],
  },
  // [atMs from the start of the wind-up, durationMs, intensity] (Phaser camera.shake units, ~px/1280). Peak 0.018 is about 23 px.
  shake: [[0, 350, 0.0006], [350, 350, 0.0012], [700, 150, 0.0020], [850, 90, 0.018], [940, 110, 0.013], [1050, 140, 0.009], [1190, 170, 0.005], [1360, 200, 0.0025], [1560, 180, 0.0012]],
  lightScale: 0.5,
  reduce: {
    hitFlashLow: { slamCore: { color: 0xe8c27a, alpha: 0.35, lifeMs: 200 }, frontColor: 0xe8c27a, slamRing: { alpha: 0.5, widthPx: 4 }, glowAlphaScale: 0.5, ghostPulseAlpha: 0.35 },
    particleScaleWithoutShake: 0.5,
  },
  hitStopMs: { attacker: 90, target: 0 },
};

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;
const quadOut = (t) => 1 - (1 - t) * (1 - t);

/** Distance the wave front has travelled at `clockMs` (since the wind-up began); -1 before the slam. */
export function waveRadius(clockMs) {
  if (clockMs < SLAM_AT_MS) return -1;
  return Math.min(WAVE_REACH, (WAVE_SPEED * (clockMs - SLAM_AT_MS)) / 1000);
}

/** Alpha multiplier of a front at distance r: 1 until fade.fromPx, 0 at fade.toPx. */
export function frontAlpha(r, f = MEGA_STOMP.wave.fade) { return 1 - clamp01((r - f.fromPx) / (f.toPx - f.fromPx)); }

/** The floor disc under Dugan at `clockMs`: { rx, ry, fill, alpha, rimColor, rimWidth, rimAlpha } or null once it is gone. */
export function discAt(clockMs, c = MEGA_STOMP.telegraph) {
  const d = c.disc;
  if (clockMs >= SLAM_AT_MS) {
    const [a, b] = d.afterSlam.fadeMs;
    if (clockMs >= b) return null;
    return { rx: d.rx[1], ry: d.rx[1] * d.heightRatio, fill: d.afterSlam.fill, alpha: lerp(d.afterSlam.alpha[0], d.afterSlam.alpha[1], clamp01((clockMs - a) / (b - a))), rimColor: d.rim.colors[1], rimWidth: 0, rimAlpha: 0 };
  }
  const t = clamp01(clockMs / c.durationMs);
  const rx = lerp(d.rx[0], d.rx[1], quadOut(t));
  const sw = clamp01((clockMs - d.rim.switchFromMs) / (d.rim.switchToMs - d.rim.switchFromMs));
  return { rx, ry: rx * d.heightRatio, fill: d.fill, alpha: lerp(d.alpha[0], d.alpha[1], 1 - Math.cos((t * Math.PI) / 2)),   // Sine.easeIn
    rimColor: sw > 0 ? d.rim.colors[1] : d.rim.colors[0], rimWidth: lerp(d.rim.widthPx[0], d.rim.widthPx[1], sw), rimAlpha: d.rim.alpha };
}

/** Distances of the harmless ghost pulses at `clockMs` (they travel out at the real wave speed): [] or [px, ...]. */
export function ghostPulseDistances(clockMs, g = MEGA_STOMP.telegraph.ghostPulses) {
  const out = [];
  for (const s of g.startsMs) {
    const d = (g.speedPxPerSec * (clockMs - s)) / 1000;
    if (d >= 0 && d <= g.reachPx) out.push(d);
  }
  return out;
}

/** Reach-gate alpha at `clockMs`: fades in over fadeInMs, holds, fades out over fadeOutMs. */
export function gateAlpha(clockMs, g = MEGA_STOMP.telegraph.reachGates) {
  const inn = clamp01(clockMs / g.fadeInMs);
  const out = 1 - clamp01((clockMs - g.fadeOutMs[0]) / (g.fadeOutMs[1] - g.fadeOutMs[0]));
  return lerp(g.alpha[0], g.alpha[1], inn) * out;
}

/** Shake keyframes for the user's settings: scale 1 = Full, 0.5 = Light, 0 = Off or Reduced Motion (no camera shake). */
export function shakeFrames(scale = 1, frames = MEGA_STOMP.shake) {
  if (!(scale > 0)) return [];
  return frames.map(([at, ms, k]) => ({ at, ms, intensity: k * scale }));
}
