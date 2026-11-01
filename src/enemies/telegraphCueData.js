// Parry timing cue for the enemy wind-up. Pure data/maths, no Phaser (the scene just draws what this returns).
// Telegraph progress p runs 0..1 over GRUNT.telegraphMs; the first jab lands ~70 ms after p = 1.
// A parry press opens a PARRY.window (~333 ms) that starts at the press, so pressing as the ring closes lands the whole 1-2-3 string.
export const TELEGRAPH_RED = 0xff3b30;   // Telegraph Red (hit-feedback spec); never used for damage feedback
export const TELEGRAPH_CUE = Object.freeze({
  nowAt: 0.35,                   // the "NOW" beat: pop + ring start (leaves ~230 ms before the first hit for human reaction)
  popMs: 80,                     // length of the bright pop at nowAt
  ringFrom: 78, ringTo: 18,      // ring radius (px): starts wide at nowAt, closes onto the enemy at p = 1
  ringAlpha: 0.95, ringAlphaReduced: 0.6,
  iconPop: 1.35,                 // icon scale at the pop, easing back to 1
});

const clamp01 = (v) => Math.max(0, Math.min(1, v));
/**
 * @param {number} progress telegraph progress 0..1 (grunt.telegraphProgress)
 * @param {{reduce?: boolean, telegraphMs?: number}} o reduce = Hit Flash Low / Reduced Motion: no white pop, softer ring
 * @returns {{fill:boolean, ring:null|{r:number, alpha:number}, iconScale:number}} fill = flash the body white (the pop only)
 */
export function telegraphCue(progress, { reduce = false, telegraphMs = 360, cfg = TELEGRAPH_CUE } = {}) {
  const p = clamp01(progress);
  if (p < cfg.nowAt) return { fill: false, ring: null, iconScale: 1 };
  const sinceNowMs = (p - cfg.nowAt) * telegraphMs;
  const popping = sinceNowMs < cfg.popMs;
  const t = clamp01((p - cfg.nowAt) / (1 - cfg.nowAt));            // 0 at the beat, 1 when the attack starts
  const ease = 1 - (1 - t) * (1 - t);                                // fast at first, settles onto the enemy
  return {
    fill: popping && !reduce,                                        // white body flash for the pop only
    ring: { r: cfg.ringFrom + (cfg.ringTo - cfg.ringFrom) * ease, alpha: reduce ? cfg.ringAlphaReduced : cfg.ringAlpha },
    iconScale: popping ? cfg.iconPop : 1 + (cfg.iconPop - 1) * Math.max(0, 1 - sinceNowMs / (cfg.popMs * 3)),
  };
}
