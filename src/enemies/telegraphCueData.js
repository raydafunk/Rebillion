// Parry timing cue for the enemy wind-up. Pure data/maths, no Phaser (the scene just draws what this returns).
// Clock = ms since the wind-up began (RustGrunt.cueClockMs, it keeps running through the attack).
// Mark  = clock time at which the ring closes (RustGrunt.parryMarkMs): PARRY_CUE_LEAD_MS before the hit worth parrying.
// One ring only, and only for attacks whose hit to parry is NOT the first one (kind 'finisher'): the orange ring.
// Plain-jab attacks (string / hold) show nothing extra, so the first-hit parry has to be read from the wind-up itself.
// No icon and no body flash: the orange ring is the only parry cue.
// A parry press opens a PARRY.window (~333 ms) that starts at the press, so it also covers the hits that follow.
export const FINISHER_ORANGE = 0xffa41c;   // the only ring colour: the hit to parry is the heavy finisher
export const RING_CENTER_ABOVE_FEET = 150; // px: the ring sits above the enemy's head, clearing its health bar (bar top is ~100-120 px up)
export const TELEGRAPH_CUE = Object.freeze({
  nowAt: 0.12,                   // the ring opens this far into the base telegraph (was 0.35): it shows up almost at once
  ringFadeInMs: 70,              // quick fade-in so it appears instead of popping
  ringStrokePx: 4,               // thinner line (was 6)
  ringFrom: 50, ringTo: 14,      // ring radius (px): smaller than before (was 78 -> 18), closes at the mark
  ringLingerMs: 60,              // the closed ring stays this long after the mark, then disappears
  ringAlpha: 0.95, ringAlphaReduced: 0.6,
});

const clamp01 = (v) => Math.max(0, Math.min(1, v));

/**
 * @param {{clockMs:number, markMs:number, kind?:string, reduce?:boolean, telegraphMs?:number}} o
 *   reduce = Hit Flash Low / Reduced Motion: softer ring
 * @returns {{ring:null|{r:number, alpha:number, color:number}}}
 */
export function telegraphCue({ clockMs, markMs, kind = 'strike', reduce = false, telegraphMs = 360 }, cfg = TELEGRAPH_CUE) {
  const popAt = cfg.nowAt * telegraphMs;
  if (clockMs < popAt) return { ring: null };
  const since = clockMs - popAt;
  const t = clamp01(since / Math.max(1, markMs - popAt));            // 0 at the beat, 1 when the ring closes (press now)
  const ease = 1 - (1 - t) ** 3;                                       // snappier: most of the travel happens early, then it settles
  const visible = kind === 'finisher' && clockMs <= markMs + cfg.ringLingerMs;
  return {
    ring: visible ? {
      r: cfg.ringFrom + (cfg.ringTo - cfg.ringFrom) * ease,
      alpha: (reduce ? cfg.ringAlphaReduced : cfg.ringAlpha) * clamp01(since / cfg.ringFadeInMs),
      color: FINISHER_ORANGE,
    } : null,
  };
}
