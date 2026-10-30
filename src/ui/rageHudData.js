// Pure layout and state mapping for the Rage meter HUD (spec: Zed Rage System Spec.docx sections 3 and 8). No Phaser.
import { RAGE_COPY } from './rageHudCopy.js';

// Sits under Zed's health bar (HudScene: x 32, y 52, 360 wide, 28 high).
export const RAGE_LAYOUT = { x: 32, y: 96, w: 300, h: 22, skew: 10, iconX: 14, hiddenOffsetX: -420, slideMs: 600, introMs: 6500 };

export const RAGE_PALETTE = { ember: 0x7a2410, orange: 0xf07a1c, redWhite: 0xffe3d6, frame: 0x2e1f16, ready: 0xffd34a, active: 0xff4a2e, back: 0x3a2218 };

export const RAGE_ICONS = Object.freeze({ BUILDING: 'flame', READY: 'burst', ACTIVE: 'fist' });

const clamp01 = (n) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
const lerp = (a, b, t) => a + (b - a) * t;
function mix(c1, c2, t) {
  const ch = (s) => Math.round(lerp((c1 >> s) & 255, (c2 >> s) & 255, t));
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

/** Ember -> orange -> red-white as fill rises 0..1. */
export function fillColor(frac) {
  const f = clamp01(frac);
  return f < 0.5 ? mix(RAGE_PALETTE.ember, RAGE_PALETTE.orange, f / 0.5) : mix(RAGE_PALETTE.orange, RAGE_PALETTE.redWhite, (f - 0.5) / 0.5);
}

/** Pulses per second: slow when empty, faster as it fills; READY is fastest, ACTIVE steady and strong. */
export function pulseHz(state, frac) {
  if (state === 'READY') return 6;
  if (state === 'ACTIVE') return 4;
  return 0.8 + 3.2 * clamp01(frac);
}

/** Everything the scene needs to draw one frame, from a RageMeter snapshot (or undefined => hidden). */
export function rageVisual(snap, cfg = {}) {
  const readyWindow = cfg.readyWindowSec ?? 4, rageDur = cfg.rageDurationSec ?? 9;
  if (!snap || !snap.visible || snap.state === 'HIDDEN') return { visible: false, state: 'HIDDEN', fillFrac: 0, pulseHz: 0, label: '', icon: null, showPrompt: false, windowFrac: 0, countdownText: '', fillColor: RAGE_PALETTE.ember };
  const frac = clamp01(snap.value / (snap.max || 100));
  const ready = snap.state === 'READY', active = snap.state === 'ACTIVE';
  const left = ready ? snap.readyTimeLeft : active ? snap.rageTimeLeft : 0;
  return {
    visible: true, state: snap.state, fillFrac: frac, pulseHz: pulseHz(snap.state, frac),
    label: RAGE_COPY.stateLabels[snap.state] || RAGE_COPY.meterLabel, icon: RAGE_ICONS[snap.state] || 'flame',
    showPrompt: ready, buffered: !!snap.buffered,
    windowFrac: ready ? clamp01(snap.readyTimeLeft / readyWindow) : active ? clamp01(snap.rageTimeLeft / rageDur) : 0,
    countdownText: ready || active ? RAGE_COPY.seconds(left) : '',
    fillColor: ready ? RAGE_PALETTE.ready : active ? RAGE_PALETTE.active : fillColor(frac),
  };
}

/** Horizontal offset of the meter while sliding in (0 = resting place). t is 0..1 progress. */
export function slideOffset(t) { const e = 1 - Math.pow(1 - clamp01(t), 3); return Math.round(lerp(RAGE_LAYOUT.hiddenOffsetX, 0, e)); }

/** Parallelogram points (skewed bar, distinct from the rectangular health bar) for a given fill 0..1. */
export function barPoints(x, y, w, h, skew, frac = 1) {
  const fw = Math.max(0, w * clamp01(frac));
  return [{ x: x + skew, y }, { x: x + skew + fw, y }, { x: x + fw, y: y + h }, { x, y: y + h }];
}

/** Show the one-time intro only when the meter is enabled this level and it has not been seen. */
export function shouldShowIntro(levelNumber, seen, enabledFromLevel = 2) { return levelNumber >= enabledFromLevel && !seen; }
