// Rage entry flash: pure timing/envelope maths and the freeze clock (spec: design/art/rage-entry-flash.md). No Phaser.
import { RAGE_ENTRY_FX } from '../player/rageConfig.js';

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const lerp = (a, b, k) => a + (b - a) * clamp01(k);
const quadOut = (k) => 1 - (1 - clamp01(k)) ** 2;
const quadIn = (k) => clamp01(k) ** 2;
const cubicOut = (k) => 1 - (1 - clamp01(k)) ** 3;

/** Freeze length in real ms (reduced-flash variant is shorter). */
export function freezeMs(reduced, cfg = RAGE_ENTRY_FX) { return reduced ? cfg.reduced.freezeMs : cfg.freezeMs; }

/**
 * Visual state at `tMs` into the freeze. The authored 450 ms timeline is scaled to the real freeze length.
 * Returns { flash, vignette, linesAlpha, linesScale, titleAlpha, titleScale } (alphas 0..1).
 */
export function entryVisual(tMs, reduced = false, cfg = RAGE_ENTRY_FX) {
  const total = freezeMs(reduced, cfg);
  const t = clamp01(tMs / total) * cfg.freezeMs; // authored time
  const max = reduced ? cfg.reduced.flashAlphaMax : cfg.flashAlphaMax;
  const fadeStart = cfg.freezeMs - cfg.fadeOutMs;
  let flash;
  if (t < cfg.flashInMs) flash = max * quadOut(t / cfg.flashInMs);
  else if (t < cfg.linesPopMs) flash = max;
  else if (t < fadeStart) flash = lerp(max, max * 0.3 / 0.55, (t - cfg.linesPopMs) / (fadeStart - cfg.linesPopMs));
  else flash = lerp(max * 0.3 / 0.55, 0, quadIn((t - fadeStart) / cfg.fadeOutMs));
  const fade = 1 - quadIn((t - cfg.holdEndMs) / (cfg.freezeMs - cfg.holdEndMs));
  const [s0, s1] = cfg.linesScale, sMid = lerp(s0, 1.15, 1);
  const linesScale = reduced && !cfg.reduced.pulse ? 1
    : t < cfg.linesPopMs ? lerp(s0, sMid, cubicOut(t / cfg.linesPopMs))
    : lerp(sMid, s1, (t - cfg.linesPopMs) / (cfg.holdEndMs - cfg.linesPopMs));
  const titleScale = reduced && !cfg.reduced.pulse ? 1 : lerp(cfg.titleScaleFrom, 1, cubicOut(t / cfg.titlePopMs));
  return {
    flash: clamp01(flash),
    vignette: reduced ? 0 : cfg.vignetteAlpha * clamp01(flash / cfg.flashAlphaMax),
    linesAlpha: (reduced ? cfg.reduced.linesAlpha : 1) * fade,
    linesScale,
    titleAlpha: 1 - quadIn((t - cfg.titleFadeFromMs) / (cfg.freezeMs - cfg.titleFadeFromMs)),
    titleScale,
  };
}

/** Small deterministic PRNG (mulberry32) so the burst is identical for a given seed. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Geometry of the radial line burst, in design px relative to Zed (the anchor). Each wedge is tapered: `halfWidth` wide at the
 * clear core (`r0` >= coreRadius) narrowing to a point at `r1`. Colours mix red and red-white, with a few pure white lines;
 * the reduced variant never uses pure white. Returns [{ angle, r0, r1, halfWidth, color }].
 */
export function lineBurst(reduced = false, cfg = RAGE_ENTRY_FX, seed = cfg.burst.seed) {
  const b = cfg.burst, rnd = seededRandom(seed), n = b.count, step = (Math.PI * 2) / n;
  const whites = new Set();
  if (!reduced) while (whites.size < b.whiteCount) whites.add(Math.floor(rnd() * n));
  const out = [];
  for (let i = 0; i < n; i++) {
    const angle = i * step + (rnd() * 2 - 1) * b.angleJitter * step;
    const len = b.lengthMin + rnd() * (b.lengthMax - b.lengthMin);
    const r0 = cfg.coreRadius + rnd() * 20;
    const halfWidth = (b.widthMinPx + rnd() * (b.widthMaxPx - b.widthMinPx)) / 2;
    const color = whites.has(i) ? cfg.colors.white : (i % 2 === 0 ? cfg.colors.red : cfg.colors.redWhite);
    out.push({ angle, r0, r1: Math.min(r0 + len, b.reach), halfWidth, color });
  }
  return out;
}

/** The three triangle corners [x0,y0,x1,y1,x2,y2] of a wedge from lineBurst(), relative to the anchor. */
export function wedgePoints(w) {
  const c = Math.cos(w.angle), s = Math.sin(w.angle);
  return [w.r0 * c - w.halfWidth * s, w.r0 * s + w.halfWidth * c, w.r0 * c + w.halfWidth * s, w.r0 * s - w.halfWidth * c, w.r1 * c, w.r1 * s];
}

/**
 * The freeze clock. Counts REAL ms (never the hit-stop-scaled clock). start() is ignored while a freeze is running,
 * so Rage activation cannot retrigger mid-freeze. tick() returns true on the frame the freeze ends.
 */
export function createRageFreeze(cfg = RAGE_ENTRY_FX) {
  return {
    left: 0, total: 0, reduced: false,
    get active() { return this.left > 0; },
    get elapsed() { return this.total - this.left; },
    start(reduced = false) {
      if (this.left > 0) return false;
      this.reduced = !!reduced; this.total = this.left = freezeMs(this.reduced, cfg);
      return true;
    },
    tick(dtMs) {
      if (this.left <= 0) return false;
      this.left = Math.max(0, this.left - Math.max(0, dtMs));
      return this.left === 0;
    },
    cancel() { const was = this.left > 0; this.left = 0; return was; },
  };
}
