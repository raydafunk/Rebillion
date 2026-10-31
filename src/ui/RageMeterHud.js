// Rage meter HUD (spec sections 3 and 8). Programmatic graphics only; wording from rageHudCopy.js, numbers from rageHudData.js.
// Pure event consumer: reads RageMeter snapshots from game.events, never mutates meter state.
import { RAGE_EVENTS } from '../player/rageConfig.js';
import { CSS, FONTS } from '../config/assetKeys.js';
import { RAGE_LAYOUT as L, RAGE_PALETTE as P, rageVisual, slideOffset, barPoints, shouldShowIntro } from './rageHudData.js';
import { RAGE_COPY } from './rageHudCopy.js';

let introSeen = false; // one-time prompt: once per session, also persisted when storage exists
const STORE_KEY = 'rebellion.rageIntroSeen';
const readSeen = () => { try { return introSeen || globalThis.localStorage?.getItem(STORE_KEY) === '1'; } catch (e) { return introSeen; } };
const writeSeen = () => { introSeen = true; try { globalThis.localStorage?.setItem(STORE_KEY, '1'); } catch (e) { /* no storage */ } };

export default class RageMeterHud {
  constructor(scene, levelNumber) {
    this.scene = scene;
    this.levelNumber = levelNumber;
    this.snap = null; this.slideT = 0; this.sliding = false; this.shown = false;
    this.flash = 0; this.endFx = 0; this.sparks = 0;
    this.g = scene.add.graphics().setDepth(5);
    this.fx = scene.add.graphics().setDepth(6);
    const t = (s, size, color = CSS.cream) => scene.add.text(0, 0, s, { fontFamily: FONTS.button, fontSize: `${size}px`, color, stroke: CSS.darkBrown, strokeThickness: 4 }).setDepth(7).setVisible(false);
    this.label = t('', 16); this.timeText = t('', 16); this.prompt = t(RAGE_COPY.prompt, 26, CSS.mustard); this.hint = t(RAGE_COPY.promptHint, 14);

    const ev = scene.game.events;
    const on = (n, f) => { ev.on(n, f); scene.events.once('shutdown', () => ev.off(n, f)); };
    on(RAGE_EVENTS.CHANGED, (s) => this._set(s));
    on(RAGE_EVENTS.GAIN, (s) => this._pop(s.amount, s.bonus));
    on(RAGE_EVENTS.ACTIVATED, () => { this.flash = 1; scene.cameras.main.flash(180, 255, 120, 40, false); });
    on(RAGE_EVENTS.ENDED, () => { this.endFx = 1; this._popText(RAGE_COPY.endText, CSS.cream); });
    // The HUD scene is created after Zed.setLevel() already fired, so seed from the level number: level 2+ starts BUILDING at 0.
    if (levelNumber >= 2) this._set({ visible: true, state: 'BUILDING', value: 0, max: 100, readyTimeLeft: 0, rageTimeLeft: 0, level: levelNumber });
  }

  _set(s) {
    const was = this.snap?.visible;
    this.snap = s;
    if (s.visible && !was && !this.shown) { this.shown = true; this.sliding = true; this.slideT = 0; this._maybeIntro(s.level ?? this.levelNumber); }
    if (!s.visible) { this.shown = false; this.sliding = false; this.slideT = 0; }
  }

  _maybeIntro(level) {
    if (!shouldShowIntro(level, readSeen())) return;
    writeSeen();
    const s = this.scene, x = L.x, y = L.y + 44;
    const box = s.add.graphics().setDepth(8).fillStyle(P.frame, 0.92).fillRect(x, y, 420, 92).lineStyle(3, P.orange, 1).strokeRect(x, y, 420, 92);
    const title = s.add.text(x + 14, y + 8, RAGE_COPY.introTitle, { fontFamily: FONTS.button, fontSize: '22px', color: CSS.mustard }).setDepth(9);
    const body = s.add.text(x + 14, y + 38, RAGE_COPY.introLines.join('\n'), { fontFamily: FONTS.body, fontSize: '16px', color: CSS.cream, lineSpacing: 4 }).setDepth(9);
    const parts = [box, title, body];
    s.tweens.add({ targets: parts, alpha: 0, delay: L.introMs, duration: 500, onComplete: () => parts.forEach((p) => p.destroy()) });
  }

  _pop(amount, bonus) {
    this._popText(RAGE_COPY.gain(amount, bonus), bonus ? CSS.mustard : CSS.cream, bonus ? 24 : 18);
    this.sparks = 1;
  }

  _popText(str, color, size = 18) {
    const x = L.x + L.w + 24 + Math.random() * 30, y = L.y - 2;
    const t = this.scene.add.text(x, y, str, { fontFamily: FONTS.button, fontSize: `${size}px`, color, stroke: CSS.darkBrown, strokeThickness: 4 }).setDepth(8);
    this.scene.tweens.add({ targets: t, y: y - 26, alpha: 0, duration: 700, onComplete: () => t.destroy() });
  }

  update(time, delta) {
    const v = rageVisual(this.snap);
    const g = this.g, fx = this.fx; g.clear(); fx.clear();
    if (!v.visible) { [this.label, this.timeText, this.prompt, this.hint].forEach((o) => o.setVisible(false)); return; }
    if (this.sliding) { this.slideT = Math.min(1, this.slideT + delta / L.slideMs); if (this.slideT >= 1) this.sliding = false; }
    const ox = slideOffset(this.slideT), x = L.x + ox, y = L.y, { w, h, skew } = L;
    const pulse = 0.5 + 0.5 * Math.sin((time / 1000) * v.pulseHz * Math.PI * 2);
    const poly = (px, py, pw, ph, f) => barPoints(px, py, pw, ph, skew, f);
    const flare = v.state === 'READY' ? 0.4 + 0.6 * pulse : 0;
    g.fillStyle(P.frame, 1).fillPoints(poly(x - 4, y - 4, w + 8, h + 8), true);
    g.fillStyle(P.back, 1).fillPoints(poly(x, y, w, h), true);
    if (v.fillFrac > 0) { // brightness pulses faster as it fills
      g.fillStyle(v.fillColor, v.state === 'BUILDING' ? 0.78 + 0.22 * pulse : 1).fillPoints(poly(x, y, w, h, v.fillFrac), true);
      g.fillStyle(0xffffff, 0.12 + 0.18 * pulse).fillPoints(poly(x, y, w, h / 3, v.fillFrac), true);
    }
    if (v.state !== 'BUILDING') { // READY frame flares; ACTIVE frame is thicker (shape cue, not just colour)
      g.lineStyle(v.state === 'ACTIVE' ? 4 : 3, v.state === 'READY' ? P.ready : P.redWhite, v.state === 'READY' ? 0.5 + flare * 0.5 : 0.6 + 0.4 * pulse).strokePoints(poly(x - 4, y - 4, w + 8, h + 8), true);
    }
    if (flare) fx.fillStyle(P.ready, 0.18 * flare).fillPoints(poly(x - 12, y - 12, w + 24, h + 24), true);
    this._icon(g, v.icon, x - 22, y + h / 2, pulse, v.fillColor);
    if (v.state === 'READY' || v.state === 'ACTIVE') { // 4s window / 9s countdown bar
      g.fillStyle(P.frame, 1).fillRect(x, y + h + 6, w, 8).fillStyle(v.state === 'READY' ? P.ready : P.active, 1).fillRect(x + 1, y + h + 7, (w - 2) * v.windowFrac, 6);
    }
    if (this.flash > 0) { fx.fillStyle(0xffffff, this.flash * 0.7).fillPoints(poly(x - 16, y - 16, w + 32, h + 32), true); this.flash = Math.max(0, this.flash - delta / 350); }
    if (this.endFx > 0) { const k = 1 - this.endFx; fx.lineStyle(3, P.orange, this.endFx).strokeRect(x - 10 - k * 12, y - 10, w + 28 + k * 24, h + 20); this.endFx = Math.max(0, this.endFx - delta / 500); }
    if (this.sparks > 0) {
      for (let i = 0; i < 4; i++) fx.fillStyle(P.redWhite, this.sparks).fillRect(x + skew + w * v.fillFrac + (i * 5 - 6), y + (i % 2) * 14 - 3 - (1 - this.sparks) * 8, 3, 3);
      this.sparks = Math.max(0, this.sparks - delta / 250);
    }
    this.label.setText(v.label).setFontSize(v.state === 'BUILDING' ? 16 : 18).setColor(v.state === 'READY' ? CSS.mustard : CSS.cream).setVisible(true);
    this.label.setPosition(x + skew + 6, y + (h - this.label.height) / 2);
    this.timeText.setText(v.countdownText).setVisible(!!v.countdownText);
    this.timeText.setPosition(x + w - 4 - this.timeText.width, y + h + 16);
    this.prompt.setVisible(v.showPrompt).setPosition(x + w + 22, y - 4).setScale(1 + 0.15 * pulse);
    this.hint.setVisible(v.showPrompt).setText(v.buffered ? 'QUEUED' : RAGE_COPY.promptHint).setPosition(x + w + 56, y + 4);
  }

  // Distinct silhouette per state: flame (building), star burst (READY), fist block (ACTIVE).
  _icon(g, icon, cx, cy, pulse, color) {
    g.fillStyle(P.frame, 1).fillCircle(cx, cy, 14);
    g.fillStyle(color, 1);
    if (icon === 'flame') g.fillTriangle(cx, cy - 10, cx - 7, cy + 8, cx + 7, cy + 8);
    else if (icon === 'burst') {
      const r = 12 + 2 * pulse;
      g.fillTriangle(cx, cy - r, cx - 5, cy, cx + 5, cy); g.fillTriangle(cx, cy + r, cx - 5, cy, cx + 5, cy);
      g.fillTriangle(cx - r, cy, cx, cy - 5, cx, cy + 5); g.fillTriangle(cx + r, cy, cx, cy - 5, cx, cy + 5);
    } else {
      g.fillRect(cx - 8, cy - 6, 16, 12);
      g.fillStyle(P.frame, 1).fillRect(cx - 8, cy - 1, 16, 2).fillRect(cx - 3, cy - 6, 2, 12).fillRect(cx + 3, cy - 6, 2, 12);
    }
  }
}
