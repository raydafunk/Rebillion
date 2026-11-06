// Boss health bar (Dugan and future bosses): layout, colours, timings and pure maths from design/art/boss-health-bar.md
// (art-direction-agent, PROPOSED values for playtest). No Phaser here so it can be unit tested.
const hex = (s) => parseInt(s.replace('#', ''), 16);
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;
const quadOut = (t) => 1 - (1 - t) * (1 - t);
const cubicOut = (t) => 1 - (1 - t) ** 3;
const cubicIn = (t) => t * t * t;
const backOut = (t, s = 1.7) => { const u = t - 1; return 1 + (s + 1) * u * u * u + s * u * u; };

/** One entry per boss, keyed by the profile id sent in entity-registered. Add a boss by adding a profile. */
export const BOSS_PROFILES = {
  'rust-brick-dugan': { name: 'BRICK DUGAN', epithet: 'THE HUMAN BATTERING RAM', maxHpFallback: 300, rageThreshold: 0.30, readout: 'hp' },
  // Level 2 mini-boss. No enrage phase yet (his moves are stand-ins), so the threshold is 0.
  'rust-railgun-royce': { name: '"RAILGUN" ROYCE', epithet: 'THE TRANSIT ENFORCER', maxHpFallback: 160, rageThreshold: 0, readout: 'hp' },
  // Level 3 mini-boss (stand-in body for now, no enrage phase).
  'rust-crusher-kane': { name: '"CRUSHER" KANE', epithet: 'THE HAMMER OF THE FACTORY', maxHpFallback: 400, rageThreshold: 0, readout: 'hp' },
  // Level 4 mini-boss: overclocks (enrages) at half health.
  // Level 8 final boss. Two phases: HP is restored when Rust Protocol opens (BossBarHud.onRestore), so no enrage band.
  'rust-halden-varr': { name: 'HALDEN VARR', epithet: 'THE ARCHITECT OF RUST', maxHpFallback: 2560, rageThreshold: 0, readout: 'hp' },
  'rust-glitch': { name: '"GLITCH"', epithet: 'THE HOLLOW-MASK HACKER', maxHpFallback: 340, rageThreshold: 0.50, readout: 'hp' },
};

export const BAR = {
  block: { x: 320, y: 138, w: 640 },
  plate: { y: 138, h: 30, minW: 230, textPadX: 44, lean: 12, border: 3, textX: 22, rivetR: 2.5, rivets: [9, -18] },
  frame: { x: 320, y: 168, w: 640, h: 40, outline: 3, band: 4, innerLine: 3, capW: 24 },
  fill: { x: 348, y: 178, w: 584, h: 20, topPx: 6, bottomPx: 4 },
  ticks: { every: 0.25, width: 2, len: 6, alpha: 0.55 },
  notch: { width: 3, y0: 170, y1: 206 },
  skullTab: { w: 24, h: 18, y: 208 },
  readout: { x: 960, y: 211, fontSize: 16 }, epithet: { x: 960, y: 153, fontSize: 14 }, name: { fontSize: 30 },
  tag: { gap: 14, y: 142, h: 22, padX: 10, fontSize: 18, text: 'ENRAGED' },
  bannerYWhileShown: 276, bannerYDefault: 240,
  shadow: { dx: 4, dy: 4, color: hex('#14181C'), alpha: 0.45 },
  depths: { edgePulse: 20, back: 21, fill: 22, front: 23, plate: 24, text: 25, particles: 26 },
};
export const COL = {
  ink: hex('#14181C'), steel: hex('#7C8A96'), steelLight: hex('#A9B6C1'), slate: hex('#3C4650'), gunmetal: hex('#2A3138'),
  hazard: hex('#F58A2A'), hazardLight: hex('#FFB36B'), hazardDark: hex('#B85F14'), gold: hex('#FFD24A'), rustBrown: hex('#9C5A2E'), brickDark: hex('#5A1F18'),
  cream: hex('#F4E6C8'), sparkCream: hex('#FFF6D6'), sand: hex('#E8C27A'), reduceTint: hex('#BFC8CF'),
};
export const FILL = {
  high: { body: hex('#4FB3D9'), top: hex('#A9DDF0'), bottom: hex('#2F7FA3'), hatch: false },
  rage: { body: hex('#F58A2A'), top: hex('#FFB36B'), bottom: hex('#B85F14'), hatch: true },
  critical: { body: hex('#C9452F'), top: hex('#E9715C'), bottom: hex('#8E2F20'), hatch: true },
  criticalAt: 0.10, crossfadeMs: 200,
};
export const DRAIN = { color: COL.cream, holdMs: 350, shrinkMs: 300, lethalShrinkMs: 250 };
export const HIT = { heavyAt: 12, joltPx: { light: 3, heavy: 5 }, joltMs: 110, joltMinGapMs: 60, flashMs: { light: 66, heavy: 83 }, flashRateLimitMs: 120 };
export const INTRO = {
  delayMs: 400, wipeMs: 260, wipeHalfW: 320, epithet: { atMs: 500, ms: 200, slidePx: 16 }, name: { atMs: 200, ms: 140, scaleFrom: 2.4, fadeMs: 60, plateFadeMs: 120 },
  slam: { atMs: 340, joltPx: 4, joltMs: 100 }, fill: { atMs: 300, ms: 900 }, tab: { atMs: 700, ms: 200 }, readout: { atMs: 1000, ms: 150 }, totalMs: 1200,
  cameraShake: { ms: 160, intensity: 0.004 }, edgePulse: { color: COL.hazard, peakAlpha: 0.18, inMs: 60, outMs: 300 },
};
export const EDGE = { widthPx: 28, strips: 4, alphas: [0.45, 0.30, 0.18, 0.08] };
export const RAGE = {
  joltPx: 5, frameFlash: { alpha: 0.85, holdMs: 80, decayMs: 160 }, tabPop: { scale: 1.6, ms: 240 }, cameraShake: { ms: 200, intensity: 0.004 },
  edgePulse: { color: COL.hazard, peakAlpha: 0.30, inMs: 60, outMs: 400 }, plateShake: { amplitudePx: 3, stepMs: 40, ms: 400 }, plateFill: COL.brickDark, plateBorder: COL.hazard,
  tag: { atMs: 100, ms: 120, scaleFrom: 1.8 }, pulseHz: 1.6, criticalPulseHz: 2.5, halo: { offsets: [4, 8, 12], alphas: [0.50, 0.30, 0.15], min: 0.30, max: 1.0 },
};
export const DEATH = { drainMs: 250, shatterAtMs: 250, totalMs: 700, cameraShake: { ms: 150, intensity: 0.004 }, goldPulse: { peakAlpha: 0.15, ms: 250 }, pieces: 12, slices: 10, textFade: { fromMs: 300, ms: 300, sinkPx: 10 } };
export const REDUCED = { staticHalo: [0.15, 0.09, 0.045], introFadeMs: 200, edgePeak: 0.10, edgeMs: 150, deathHoldMs: 100, deathFadeFromMs: 350, deathFadeMs: 350 };

/** Fraction of the bar currently below the rage threshold. Rage is strictly below it (matches Dugan's own check). */
export const inRage = (frac, threshold) => frac < threshold;

/** Which fill palette a health fraction uses: 'high' | 'rage' | 'critical'. */
export function fillBand(frac, threshold) {
  if (frac <= FILL.criticalAt) return 'critical';
  return inRage(frac, threshold) ? 'rage' : 'high';
}

const mix = (a, b, t) => {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255, br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (Math.round(lerp(ar, br, t)) << 16) | (Math.round(lerp(ag, bg, t)) << 8) | Math.round(lerp(ab, bb, t));
};
/** Fill colours crossfading from the band it was to the band it is: { body, top, bottom }. */
export function fillColors(from, to, sinceMs) {
  const k = clamp01(sinceMs / FILL.crossfadeMs), a = FILL[from], b = FILL[to];
  return { body: mix(a.body, b.body, k), top: mix(a.top, b.top, k), bottom: mix(a.bottom, b.bottom, k) };
}

/** The cream damage chunk: it holds at `from` for holdMs then shrinks to `to` (lethal: no hold, quicker). Returns the displayed fraction. */
export function drainFrac(from, to, sinceMs, lethal = false) {
  if (to >= from) return to;
  const hold = lethal ? 0 : DRAIN.holdMs, shrink = lethal ? DRAIN.lethalShrinkMs : DRAIN.shrinkMs;
  if (sinceMs <= hold) return from;
  return lerp(from, to, quadOut(clamp01((sinceMs - hold) / shrink)));
}

/** Vertical jolt in px at `sinceMs` after a hit (decays to 0). */
export const joltOffset = (px, sinceMs, ms = HIT.joltMs) => (sinceMs >= ms ? 0 : px * (1 - quadOut(clamp01(sinceMs / ms))));

/** Everything the intro needs at `t` ms after the boss appears: 0..1 progress values. */
export function introState(t, I = INTRO) {
  const nameK = clamp01((t - I.name.atMs) / I.name.ms);
  return {
    wipe: clamp01(t / I.wipeMs), plate: clamp01((t - I.name.atMs) / I.name.plateFadeMs),
    nameScale: lerp(I.name.scaleFrom, 1, cubicIn(nameK)), nameAlpha: clamp01((t - I.name.atMs) / I.name.fadeMs),
    epithet: cubicOut(clamp01((t - I.epithet.atMs) / I.epithet.ms)), fill: cubicOut(clamp01((t - I.fill.atMs) / I.fill.ms)),
    tab: clamp01((t - I.tab.atMs) / I.tab.ms), readout: clamp01((t - I.readout.atMs) / I.readout.ms),
    slamJolt: t >= I.slam.atMs ? joltOffset(I.slam.joltPx, t - I.slam.atMs, I.slam.joltMs) : 0, done: t >= I.totalMs,
  };
}

/** Pulse 0..1 at `hz` (rage and critical states); a static 0.5 for Reduced Motion. */
export const pulse = (tMs, hz, reduced = false) => (reduced ? 0.5 : 0.5 + 0.5 * Math.sin((tMs / 1000) * Math.PI * 2 * Math.min(hz, RAGE.criticalPulseHz)));

/** Rage crossing: { flash 0..1, tab scale, plateShake px, tagK 0..1 } at `sinceMs`. */
export function rageMoment(sinceMs, reduced = false) {
  const f = RAGE.frameFlash, flashK = sinceMs <= f.holdMs ? 1 : 1 - quadOut(clamp01((sinceMs - f.holdMs) / f.decayMs));
  const popK = clamp01(sinceMs / RAGE.tabPop.ms);
  const step = Math.floor(sinceMs / RAGE.plateShake.stepMs), shake = reduced || sinceMs >= RAGE.plateShake.ms ? 0 : (step % 2 ? -1 : 1) * RAGE.plateShake.amplitudePx * (1 - sinceMs / RAGE.plateShake.ms);
  return { flash: sinceMs >= f.holdMs + f.decayMs ? 0 : flashK * f.alpha, tabScale: reduced ? 1 : lerp(RAGE.tabPop.scale, 1, backOut(popK)), plateShake: shake, tagK: clamp01((sinceMs - RAGE.tag.atMs) / RAGE.tag.ms) };
}

/** Death: { bar: 0..1 visible share of the bar (drain then shatter), text: alpha, done } at `sinceMs`. */
export function deathState(sinceMs, reduced = false) {
  if (reduced) return { shattered: false, text: 1 - clamp01((sinceMs - REDUCED.deathFadeFromMs) / REDUCED.deathFadeMs), bar: 1 - clamp01((sinceMs - REDUCED.deathFadeFromMs) / REDUCED.deathFadeMs), done: sinceMs >= REDUCED.deathFadeFromMs + REDUCED.deathFadeMs };
  return { shattered: sinceMs >= DEATH.shatterAtMs, text: 1 - cubicIn(clamp01((sinceMs - DEATH.textFade.fromMs) / DEATH.textFade.ms)), bar: sinceMs >= DEATH.shatterAtMs ? 0 : 1, done: sinceMs >= DEATH.totalMs };
}

/** Pixel x on the bar for a health fraction. */
export const fillX = (frac) => BAR.fill.x + BAR.fill.w * clamp01(frac);

/** Readout text: "98/150", or "n/n !" in the critical band. */
export const readoutText = (hp, maxHp, critical) => `${Math.max(0, Math.ceil(hp))}/${maxHp}${critical ? ' !' : ''}`;
