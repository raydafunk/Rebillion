// Grab Break prompt (the bubble shown while Dugan holds Zed): look, timing and layout from design/art/dugan-grab-break-cue.md
// (art-direction-agent, PROPOSED values for playtest). Pure data and maths, no Phaser. Feedback only: gameplay numbers
// (holdMs, breakTaps) are read at runtime from the grab itself.
import { KEY_MAP, PAD_MAP } from '../player/input.js';
import { GRAB_CONFIG } from '../player/grabConfig.js';

const hex = (s) => parseInt(s.replace('#', ''), 16);

export const CUE = {
  depth: 5900, wordDepth: 5950, urgencyMs: 250,
  view: { w: 1280, h: 720, marginPx: 16, hudBandPx: 70, hudGapPx: 8, hintExtraTopPx: 28 },
  anchor: { gapPx: 6 },
  bubble: { outline: hex('#2E1F16'), outlineRadius: 55, track: { color: hex('#2E1F16'), r: [46, 52] }, ring: { centreRadius: 49, widthPx: 6, urgentWidthPx: 8 }, separatorPx: 3, body: { r: 43, fill: hex('#FFF6D6') },
    tail: { basePx: 18, lengthPx: 16, minPx: 10, maxPx: 22, outlinePx: 3 } },
  // The ring is a CLOCK, not a meter: the time that has gone fills RED clockwise (danger rising) behind a hand; the time left stays cream, then mustard.
  // The pips are the only green, and they are the only thing the player fills. Rule: fill the green before the red closes the ring.
  ringColors: { calm: hex('#FFF6D6'), warn: hex('#E3A92B'), danger: hex('#FF3B30'), elapsed: hex('#FF3B30'), warnBelowMs: 450, dangerAtMostMs: 250, hand: { radius: 5, fill: hex('#FFF6D6'), outline: hex('#2E1F16'), outlinePx: 2 }, outerLine: { radius: 57, widthPx: 2, alpha: 0.8 } },
  keyCap: { size: 36, centre: [0, -8], fill: hex('#F58A2A'), side: hex('#B85F14'), sidePx: 4, pressDropPx: 3, outlinePx: 3, outline: hex('#2E1F16'), label: hex('#2E1F16'),
    fontPxByLength: { 1: 28, 2: 20, 3: 20, 4: 16, 5: 16 }, widthPad: 18, widthClamp: [36, 64], padRadius: 19,
    rhythm: { periodMs: 170, downMs: 70, idleBeforeMetronomeMs: 200, urgentPeriodMs: 100, pressDownMs: 50, pressUpMs: 70 }, bubbleBump: { scale: 1.05, ms: 90 } },
  pips: { count: GRAB_CONFIG.breakTaps, size: 8, gap: 2, outlinePx: 2, centre: [0, 24], outline: hex('#2E1F16'), empty: hex('#C9B79A'), filled: hex('#4C9A55'), filledTop: hex('#7BC47F'), nextOutline: hex('#F58A2A'),
    partialMinPx: 2, fillPop: { fromScale: 1.7, ms: 100, fromColor: hex('#A8E6AB') }, aboutToBreak: { filledAtLeast: GRAB_CONFIG.breakTaps - 1, filled: hex('#7BC47F'), top: hex('#FFF6D6'), nextPulseHz: 4 } },
  popIn: { fromScale: 0.4, ms: 80, overshoot: 1.7 },
  urgency: { pulseHz: 10, pulseScale: [1.0, 1.06] },
  breakFree: { bubbleMs: 70, bubbleScaleTo: 1.25, shards: { count: 8, length: [14, 18], width: 5, from: 52, to: 96, ms: 260, colors: [hex('#FFF6D6'), hex('#E3A92B')] },
    burst: { color: hex('#FFF6D6'), radius: [30, 70], alpha: 0.6, ms: 70, lowColor: hex('#E8C27A'), lowAlpha: 0.3, lowMs: 160 },
    word: { text: 'FREE!', sizePx: 34, fill: '#FFF6D6', strokePx: 5, stroke: '#2E1F16', popFrom: 0.5, popTo: 1.15, popMs: 90, settleMs: 160, risePx: 18, fadeFromMs: 260, fadeToMs: 480 } },
  slam: { cracks: { count: 3, length: [40, 60], width: 3, jitter: 4, holdMs: 50 }, wedges: { count: 8, speed: [520, 900], coneDeg: 35, upBiasDeg: 25, spin: 8, gravity: 900, lifeMs: 420, fadeLastShare: 0.4, startMs: 50 }, totalMs: 470 },
  release: { ms: 160, scaleTo: 0.9 },
  hint: { text: 'MASH!', sizePx: 18, pill: [64, 24], fill: hex('#F58A2A'), outlinePx: 3, centreY: -69, maxShowsPerSession: 3 },
  reduce: { breakFadeMs: 120, wordStaticMs: 400, wordFadeMs: 80, slamCrackMs: 150, slamFadeMs: 150 },
};

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const backOut = (t, s = 1.7) => { const u = t - 1; return 1 + (s + 1) * u * u * u + s * u * u; };

/** Printable cap label for a KeyboardEvent.code: 'KeyJ' -> 'J', 'Space' -> 'SPACE', 'ArrowLeft' -> '<'. */
export function keyLabel(code = '') {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit\d$/.test(code)) return code.slice(5);
  const names = { Space: 'SPACE', Enter: 'ENTER', ShiftLeft: 'SHIFT', ShiftRight: 'SHIFT', ArrowLeft: '<', ArrowRight: '>', ArrowUp: '^', ArrowDown: 'v' };
  return names[code] || String(code).toUpperCase().slice(0, 5);
}

/** The label for the two attack buttons (light / heavy), read from the live key map each grab so a rebind is picked up. */
export const attackLabel = (keyMap = KEY_MAP) => `${keyLabel((keyMap.light || ['KeyJ'])[0])} / ${keyLabel((keyMap.heavy || ['KeyK'])[0])}`;

/** Face-button label for a pad: standard mapping (button 2 = X on Xbox, a drawn square on PlayStation, Y on Nintendo). Heavy is button 3. */
export function padLabel(index = PAD_MAP.light[0], id = '') {
  const s = String(id).toLowerCase();
  if (index !== 2) return ['A', 'B', 'X', 'Y'][index] || '?';
  if (/playstation|dualshock|dualsense|054c/.test(s)) return 'SQUARE';
  if (/nintendo|switch|pro controller|057e/.test(s)) return 'Y';
  return 'X';
}

/** Colour of the time still LEFT on the clock (the elapsed part is always red). Cream, then mustard in the last 450 ms. */
export function ringColor(timeLeftMs, rc = CUE.ringColors) {
  return timeLeftMs <= rc.warnBelowMs ? rc.warn : rc.calm;
}

/** Where the clock hand is: angle in radians (0 = 12 o'clock, clockwise) for the time that has gone. */
export const handAngle = (ringFrac) => (1 - ringFrac) * Math.PI * 2;

/**
 * Everything the renderer needs for one frame while held.
 * @param {{timerMs:number, holdMs:number, progress:number, breakTaps?:number, sinceTapMs?:number, reduced?:boolean}} s
 * @returns {{ringFrac:number, timeLeftMs:number, color:number, width:number, urgent:boolean, scale:number, pips:{filled:number, partial:number, next:number|null, nextPulse:number, aboutToBreak:boolean}, capDown:number, popScale:number}}
 */
export function grabBreakCue({ timerMs, holdMs, progress, breakTaps = CUE.pips.count, sinceTapMs = 1e9, reduced = false }) {
  const left = Math.max(0, holdMs - timerMs), urgent = left <= CUE.urgencyMs;
  const taps = Math.min(breakTaps, progress * breakTaps), whole = Math.floor(taps + 1e-9);
  const rh = CUE.keyCap.rhythm, period = urgent ? rh.urgentPeriodMs : rh.periodMs;
  let capDown = 0;
  if (!reduced) {
    if (sinceTapMs < rh.pressDownMs) capDown = 1;
    else if (sinceTapMs > rh.idleBeforeMetronomeMs) capDown = (timerMs % period) < rh.downMs ? 1 : 0;
  }
  const pulse = urgent && !reduced ? CUE.urgency.pulseScale[0] + (CUE.urgency.pulseScale[1] - CUE.urgency.pulseScale[0]) * (0.5 + 0.5 * Math.sin(timerMs * Math.PI * 2 * CUE.urgency.pulseHz / 1000)) : 1;
  const pop = reduced ? 1 : CUE.popIn.fromScale + (1 - CUE.popIn.fromScale) * backOut(clamp01(timerMs / CUE.popIn.ms), CUE.popIn.overshoot);
  return {
    ringFrac: clamp01(left / holdMs), timeLeftMs: left, color: ringColor(left), width: urgent ? CUE.bubble.ring.urgentWidthPx : CUE.bubble.ring.widthPx, urgent,
    scale: pop * pulse,
    pips: { filled: whole, partial: taps - whole, next: whole < breakTaps ? whole : null, nextPulse: reduced ? 1 : 0.5 + 0.5 * Math.sin(timerMs * Math.PI * 2 * CUE.pips.aboutToBreak.nextPulseHz / 1000), aboutToBreak: whole >= CUE.pips.aboutToBreak.filledAtLeast },
    capDown, popScale: pop,
  };
}

/** Clamp the bubble centre inside the view, below the HUD band (and lower when the hint pill is shown above it). */
export function clampBubble(x, y, withHint = false, v = CUE.view, r = CUE.bubble.outlineRadius) {
  const top = v.hudBandPx + v.hudGapPx + r + (withHint ? v.hintExtraTopPx : 0);
  return { x: Math.max(v.marginPx + r, Math.min(v.w - v.marginPx - r, x)), y: Math.max(top, Math.min(v.h - v.marginPx - r, y)) };
}
