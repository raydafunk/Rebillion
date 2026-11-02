// Grab Break prompt: a bubble over Zed while Dugan holds him. Outer ring = time until the slam (drains, empty on the slam frame);
// six pips = break taps; the orange key cap shows the attack button and presses to a mash rhythm. Break: bursts + "FREE!".
// Slam: cracks and flies apart. Release: quiet fade. Phaser Graphics + two Text objects, no assets. Looks and numbers: design/art/dugan-grab-break-cue.md.
import { CUE, grabBreakCue, attackLabel, padLabel, clampBubble, handAngle } from './grabBreakCueData.js';
import { loadSettings } from '../ui/optionsData.js';
import { FONTS } from '../config/assetKeys.js';
import { EVENTS } from '../shared/events.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const quadOut = (t) => 1 - (1 - t) * (1 - t);
const cubicOut = (t) => 1 - (1 - t) ** 3;

export class GrabBreakCueFx {
  /** @param o { events, getZed: () => Zed, getHeadTop: () => number|null (world y of the top of Zed's sprite), reduceFlash: () => boolean, getPad?: () => Gamepad|null } */
  constructor(scene, { events, getZed, getHeadTop = null, reduceFlash = () => false, getPad = () => null }) {
    this.scene = scene; this.events = events; this.getZed = getZed; this.getHeadTop = getHeadTop; this.reduceFlash = reduceFlash; this.getPad = getPad;
    this.g = scene.add.graphics().setDepth(CUE.depth);
    this.label = scene.add.text(0, 0, 'J', { fontFamily: FONTS.button, fontSize: '28px', color: '#2E1F16' }).setOrigin(0.5).setDepth(CUE.depth + 1).setVisible(false);
    this.word = scene.add.text(0, 0, CUE.breakFree.word.text, { fontFamily: FONTS.display, fontSize: `${CUE.breakFree.word.sizePx}px`, color: CUE.breakFree.word.fill, stroke: CUE.breakFree.word.stroke, strokeThickness: CUE.breakFree.word.strokePx })
      .setOrigin(0.5).setDepth(CUE.wordDepth).setVisible(false);
    this.hint = scene.add.text(0, 0, CUE.hint.text, { fontFamily: FONTS.button, fontSize: `${CUE.hint.sizePx}px`, color: '#2E1F16' }).setOrigin(0.5).setDepth(CUE.depth + 1).setVisible(false);
    this.mode = 'none';         // none | held | break | slam | release
    this.t = 0; this.heldMs = 0; this.lastProgress = 0; this.sinceTap = 1e9; this.popPip = -1; this.popT = 1e9;
    this.shows = 0; this.broken = false;
    this.last = { x: 0, y: 0 }; this.shards = []; this.wedges = []; this.slamDir = 1; this.cracks = [];
    this._onBroken = () => this._begin('break');
    this._onSlam = (p) => { this.slamDir = p && p.slamDir < 0 ? -1 : 1; this._begin('slam'); };
    this._onRelease = () => { if (this.mode === 'held') this._begin('release'); };
    events.on(EVENTS.GRAB_BROKEN, this._onBroken); events.on(EVENTS.PLAYER_SLAMMED, this._onSlam); events.on(EVENTS.GRAB_RELEASE, this._onRelease);
  }

  _reduced() { try { return loadSettings(globalThis.localStorage).reducedMotion === true; } catch { return false; } }

  _begin(mode) {
    if (this.mode === 'none') return;
    this.mode = mode; this.t = 0;
    const B = CUE.breakFree, S = CUE.slam, { x, y } = this.last;
    if (mode === 'break') {
      this.broken = true;
      this.shards = Array.from({ length: B.shards.count }, (_, i) => ({ a: (i / B.shards.count) * Math.PI * 2 + rnd(-0.2, 0.2), len: rnd(...B.shards.length), color: B.shards.colors[i % 2] }));
    } else if (mode === 'slam') {
      this.cracks = Array.from({ length: S.cracks.count }, () => ({ a: rnd(0, Math.PI * 2), len: rnd(...S.cracks.length), seed: Math.random() }));
      const dir = this.slamDir;
      this.wedges = Array.from({ length: S.wedges.count + 1 }, (_, i) => {
        const ang = ((rnd(-S.wedges.coneDeg, S.wedges.coneDeg) + S.wedges.upBiasDeg) * Math.PI) / 180, sp = rnd(...S.wedges.speed);
        return { x, y, vx: Math.cos(ang) * sp * dir, vy: -Math.sin(ang) * sp, rot: rnd(0, Math.PI * 2), spin: rnd(-1, 1) * S.wedges.spin, size: i === S.wedges.count ? 18 : rnd(14, 24) };
      });
    }
    if (mode !== 'break') this.word.setVisible(false);
  }

  update(dtMs) {
    const z = this.getZed(), grab = z.grab, reduced = this._reduced();
    const heldNow = z.state === 'held' && grab && grab.info;
    if (heldNow && this.mode === 'none') { this.mode = 'held'; this.t = 0; this.heldMs = 0; this.lastProgress = 0; this.sinceTap = 1e9; this.popPip = -1; this.broken0 = this.broken; if (!this.broken && this.shows < CUE.hint.maxShowsPerSession) { this.showHint = true; this.shows++; } else this.showHint = false; this.label.setText(this._labelText()); }
    if (this.mode === 'held' && !heldNow) this._begin('release');           // released without an event (e.g. death)
    this.g.clear();
    if (this.mode === 'none') { this._hideText(); return; }
    this.t += dtMs;
    const cam = this.scene.cameras.main;
    if (this.mode === 'held') {
      this.heldMs = grab.timer;
      const prog = grab.progress;
      if (prog > this.lastProgress + 1e-6) { this.sinceTap = 0; this.popPip = Math.floor(prog * CUE.pips.count + 1e-9) - 1; this.popT = 0; } else { this.sinceTap += dtMs; this.popT += dtMs; }
      this.lastProgress = prog;
      const frame = grabBreakCue({ timerMs: this.heldMs, holdMs: grab.info.holdMs, progress: prog, breakTaps: grab.cfg.breakTaps, sinceTapMs: this.sinceTap, reduced });
      this._place(z, cam);
      this._drawBubble(frame, reduced);
    } else this._drawEnd(cam, reduced, dtMs);
  }

  _labelText() { const pad = this.getPad(); return pad ? `${padLabel(2, pad.id)} / ${padLabel(3, pad.id)}` : attackLabel(); }

  _place(z, cam) {
    const head = this.getHeadTop ? this.getHeadTop() : z.sprite.y - 60;
    const b = CUE.bubble, wy = head - b.tail.lengthPx - CUE.anchor.gapPx - b.outlineRadius;
    const c = clampBubble(z.x - cam.scrollX, wy - cam.scrollY, this.showHint);
    this.last = { x: Math.round(c.x + cam.scrollX), y: Math.round(c.y + cam.scrollY), headX: z.x, head };
    this.screen = c;
  }

  _drawBubble(f, reduced) {
    const g = this.g, { x, y } = this.last, b = CUE.bubble, sc = f.scale * (!reduced && this.popT < CUE.keyCap.bubbleBump.ms ? lerp(CUE.keyCap.bubbleBump.scale, 1, clamp01(this.popT / CUE.keyCap.bubbleBump.ms)) : 1);
    const R = (r) => r * sc;
    // tail: from the bubble toward Zed's head
    const tailLen = Math.max(b.tail.minPx, Math.min(b.tail.maxPx, this.last.head - (y + b.outlineRadius * sc) + b.tail.lengthPx)), tipX = this.last.headX, tipY = y + b.outlineRadius * sc + tailLen;
    const half = b.tail.basePx / 2;
    g.fillStyle(b.outline, 1).fillTriangle(x - half - 3, y + R(b.body.r), x + half + 3, y + R(b.body.r), tipX, tipY + 3);
    g.fillStyle(b.body.fill, 1).fillTriangle(x - half, y + R(b.body.r), x + half, y + R(b.body.r), tipX, tipY);
    // outline disc, track, ring (drains clockwise from the top), separator, body
    g.fillStyle(b.outline, 1).fillCircle(x, y, R(b.outlineRadius));
    g.fillStyle(b.track.color, 1).fillCircle(x, y, R(b.track.r[1]));
    {
      // a clock: red fills clockwise for the time that has gone, the time left stays cream/mustard, a hand marks now
      const rr = R(b.ring.centreRadius), top = -Math.PI / 2, a = handAngle(f.ringFrac), w = f.width * sc;
      if (a > 0.02) g.lineStyle(w, CUE.ringColors.elapsed, 1).beginPath().arc(x, y, rr, top, top + a, false).strokePath();
      if (f.ringFrac > 0.004) g.lineStyle(w, f.color, 1).beginPath().arc(x, y, rr, top + a, top + Math.PI * 2, false).strokePath();
      const H = CUE.ringColors.hand, hx = x + Math.cos(top + a) * rr, hy = y + Math.sin(top + a) * rr;
      g.fillStyle(H.outline, 1).fillCircle(hx, hy, R(H.radius + H.outlinePx)); g.fillStyle(H.fill, 1).fillCircle(hx, hy, R(H.radius));
    }
    if (f.urgent) g.lineStyle(CUE.ringColors.outerLine.widthPx, CUE.ringColors.danger, CUE.ringColors.outerLine.alpha).strokeCircle(x, y, R(CUE.ringColors.outerLine.radius));
    g.fillStyle(b.outline, 1).fillCircle(x, y, R(b.body.r + b.separatorPx));
    g.fillStyle(b.body.fill, 1).fillCircle(x, y, R(b.body.r));
    // key cap
    const K = CUE.keyCap, text = this.label.text, len = text.length, fpx = K.fontPxByLength[Math.min(5, len)] || 16;
    this.label.setFontSize(`${fpx}px`);
    const w = Math.max(K.widthClamp[0], Math.min(K.widthClamp[1], this.label.width + K.widthPad)) * sc, h = K.size * sc, drop = K.pressDropPx * f.capDown * sc, side = K.sidePx * (1 - f.capDown) * sc;
    const cx = x + K.centre[0] * sc, cy = y + K.centre[1] * sc;
    const pad = this.getPad();
    if (pad) { g.fillStyle(K.outline, 1).fillCircle(cx, cy + drop, (K.padRadius + K.outlinePx) * sc); g.fillStyle(K.side, 1).fillCircle(cx, cy + drop + side * 0.5, K.padRadius * sc); g.fillStyle(K.fill, 1).fillCircle(cx, cy + drop, (K.padRadius - 2) * sc); }
    else {
      g.fillStyle(K.outline, 1).fillRoundedRect(cx - w / 2 - K.outlinePx, cy - h / 2 - K.outlinePx + drop, w + 2 * K.outlinePx, h + 2 * K.outlinePx + side, 6);
      g.fillStyle(K.side, 1).fillRoundedRect(cx - w / 2, cy - h / 2 + drop, w, h + side, 5);
      g.fillStyle(K.fill, 1).fillRoundedRect(cx - w / 2, cy - h / 2 + drop, w, h, 5);
    }
    this.label.setPosition(cx, cy + drop).setScale(sc).setVisible(true);
    // pips
    const P = CUE.pips, pw = P.size * sc, gap = P.gap * sc, total = P.count * pw + (P.count - 1) * gap, px0 = x + P.centre[0] * sc - total / 2, py = y + P.centre[1] * sc;
    for (let i = 0; i < P.count; i++) {
      const px = px0 + i * (pw + gap);
      const popK = !this.popT || i !== this.popPip ? 1 : lerp(P.fillPop.fromScale, 1, quadOut(clamp01(this.popT / P.fillPop.ms)));
      const s2 = pw * (i < f.pips.filled ? popK : 1), ox = px - (s2 - pw) / 2, oy = py - (s2 - pw) / 2;
      g.fillStyle(P.outline, 1).fillRect(ox - P.outlinePx, oy - P.outlinePx, s2 + 2 * P.outlinePx, s2 + 2 * P.outlinePx);
      g.fillStyle(P.empty, 1).fillRect(ox, oy, s2, s2);
      if (i < f.pips.filled) {
        g.fillStyle(f.pips.aboutToBreak ? P.aboutToBreak.filled : P.filled, 1).fillRect(ox, oy, s2, s2);
        g.fillStyle(f.pips.aboutToBreak ? P.aboutToBreak.top : P.filledTop, 1).fillRect(ox, oy, s2, Math.max(2, s2 * 0.3));
      } else if (i === f.pips.next && f.pips.partial > 0.01) {
        const pxh = Math.max(P.partialMinPx, s2 * f.pips.partial); g.fillStyle(P.filled, 1).fillRect(ox, oy + s2 - pxh, s2, pxh);
      }
      if (i === f.pips.next) g.lineStyle(f.pips.aboutToBreak ? 2 + f.pips.nextPulse : 2, P.nextOutline, 1).strokeRect(ox - 1, oy - 1, s2 + 2, s2 + 2);
    }
    // first-time hint pill above the bubble
    if (this.showHint) {
      const H = CUE.hint, hx = x, hy = y + H.centreY * sc;
      g.fillStyle(CUE.bubble.outline, 1).fillRoundedRect(hx - H.pill[0] / 2 - H.outlinePx, hy - H.pill[1] / 2 - H.outlinePx, H.pill[0] + 2 * H.outlinePx, H.pill[1] + 2 * H.outlinePx, 8);
      g.fillStyle(H.fill, 1).fillRoundedRect(hx - H.pill[0] / 2, hy - H.pill[1] / 2, H.pill[0], H.pill[1], 6);
      this.hint.setPosition(hx, hy).setVisible(true);
    } else this.hint.setVisible(false);
  }

  _drawEnd(cam, reduced, dtMs) {
    const g = this.g, { x, y } = this.last, t = this.t, dt = dtMs / 1000;
    this.label.setVisible(false); this.hint.setVisible(false);
    if (this.mode === 'break') {
      const B = CUE.breakFree, W = B.word;
      const bt = reduced ? clamp01(t / CUE.reduce.breakFadeMs) : clamp01(t / B.bubbleMs);
      if (bt < 1) { g.fillStyle(CUE.bubble.body.fill, 1 - bt).fillCircle(x, y, CUE.bubble.body.r * (reduced ? 1 : lerp(1, B.bubbleScaleTo, quadOut(bt)))); g.lineStyle(3, CUE.bubble.outline, 1 - bt).strokeCircle(x, y, CUE.bubble.outlineRadius); }
      if (!reduced) {
        const lowFlash = this.reduceFlash(), bu = B.burst, bk = clamp01(t / (lowFlash ? bu.lowMs : bu.ms));
        if (bk < 1) g.fillStyle(lowFlash ? bu.lowColor : bu.color, (lowFlash ? bu.lowAlpha : bu.alpha) * (1 - bk)).fillCircle(x, y, lerp(bu.radius[0], bu.radius[1], quadOut(bk)));
        const sk = clamp01(t / B.shards.ms);
        if (sk < 1) for (const s of this.shards) {
          const r = lerp(B.shards.from, B.shards.to, cubicOut(sk)), px = x + Math.cos(s.a) * r, py = y + Math.sin(s.a) * r;
          g.lineStyle(B.shards.width, s.color, 1 - sk).beginPath().moveTo(px, py).lineTo(px + Math.cos(s.a) * s.len, py + Math.sin(s.a) * s.len).strokePath();
        }
      }
      // FREE! over where the bubble was, rising and fading
      const wt = t, total = reduced ? CUE.reduce.wordStaticMs + CUE.reduce.wordFadeMs : W.fadeToMs;
      if (wt < total) {
        const scale = reduced ? 1 : (wt < W.popMs ? lerp(W.popFrom, W.popTo, wt / W.popMs) : lerp(W.popTo, 1, clamp01((wt - W.popMs) / W.settleMs)));
        const alpha = reduced ? 1 - clamp01((wt - CUE.reduce.wordStaticMs) / CUE.reduce.wordFadeMs) : 1 - clamp01((wt - W.fadeFromMs) / (W.fadeToMs - W.fadeFromMs));
        this.word.setPosition(x, y - (reduced ? 0 : W.risePx * clamp01(wt / W.fadeToMs))).setScale(scale).setAlpha(alpha).setVisible(true);
      } else this._finish();
    } else if (this.mode === 'slam') {
      const S = CUE.slam, total = reduced ? CUE.reduce.slamCrackMs + CUE.reduce.slamFadeMs : S.totalMs;
      const crackMs = reduced ? CUE.reduce.slamCrackMs : S.cracks.holdMs;
      if (t < crackMs) {
        g.fillStyle(CUE.bubble.body.fill, 1).fillCircle(x, y, CUE.bubble.body.r); g.lineStyle(3, CUE.bubble.outline, 1).strokeCircle(x, y, CUE.bubble.outlineRadius);
        for (const c of this.cracks) { g.lineStyle(S.cracks.width, CUE.bubble.outline, 1).beginPath().moveTo(x, y).lineTo(x + Math.cos(c.a) * c.len * 0.5 + (c.seed - 0.5) * S.cracks.jitter * 2, y + Math.sin(c.a) * c.len * 0.5).lineTo(x + Math.cos(c.a) * c.len, y + Math.sin(c.a) * c.len).strokePath(); }
      } else if (reduced) {
        g.fillStyle(CUE.bubble.body.fill, 1 - clamp01((t - crackMs) / CUE.reduce.slamFadeMs)).fillCircle(x, y, CUE.bubble.body.r);
      } else {
        const wt = t - S.wedges.startMs, life = S.wedges.lifeMs;
        for (const w of this.wedges) {
          w.vy += S.wedges.gravity * dt; w.x += w.vx * dt; w.y += w.vy * dt; w.rot += w.spin * dt;
          const a = 1 - clamp01((wt - life * (1 - S.wedges.fadeLastShare)) / (life * S.wedges.fadeLastShare));
          const p = (k) => [w.x + Math.cos(w.rot + k * 2.1) * w.size, w.y + Math.sin(w.rot + k * 2.1) * w.size];
          const [a1, a2, a3] = [p(0), p(1), p(2)];
          g.fillStyle(CUE.bubble.body.fill, a).fillTriangle(a1[0], a1[1], a2[0], a2[1], a3[0], a3[1]);
          g.lineStyle(3, CUE.bubble.outline, a).strokeTriangle(a1[0], a1[1], a2[0], a2[1], a3[0], a3[1]);
        }
      }
      if (t >= total) this._finish();
    } else if (this.mode === 'release') {
      const k = clamp01(t / CUE.release.ms), sc = lerp(1, CUE.release.scaleTo, k * k);
      g.fillStyle(CUE.bubble.outline, 1 - k * k).fillCircle(x, y, CUE.bubble.outlineRadius * sc);
      g.fillStyle(CUE.bubble.body.fill, 1 - k * k).fillCircle(x, y, CUE.bubble.body.r * sc);
      if (k >= 1) this._finish();
    }
  }

  _hideText() { this.label.setVisible(false); this.word.setVisible(false); this.hint.setVisible(false); }
  _finish() { this.mode = 'none'; this._hideText(); this.g.clear(); }
  reset() { this.mode = 'none'; this._hideText(); this.g.clear(); this.shards.length = 0; this.wedges.length = 0; this.cracks.length = 0; }
  destroy() {
    this.events.off(EVENTS.GRAB_BROKEN, this._onBroken); this.events.off(EVENTS.PLAYER_SLAMMED, this._onSlam); this.events.off(EVENTS.GRAB_RELEASE, this._onRelease);
    this.g.destroy(); this.label.destroy(); this.word.destroy(); this.hint.destroy();
  }
}
