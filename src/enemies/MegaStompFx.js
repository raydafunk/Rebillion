// Dugan's Mega Stomp effects, drawn with two Phaser Graphics (floor layer behind the fighters, debris layer above them) plus a small particle list.
// Everything is a primitive: flattened ellipses, rects, triangles, lines. Looks and numbers: design/art/dugan-mega-stomp.md via megaStompData.js.
// Reads the boss' public state each frame (move, cueClockMs, stompSeq, moveSeq), so the picture always follows the real timing.
import {
  MEGA_STOMP as M, WAVE_REACH, LANE_TOP, LANE_BOTTOM, waveRadius, frontAlpha, discAt, ghostPulseDistances, gateAlpha, shakeFrames,
} from './megaStompData.js';
import { loadSettings } from '../ui/optionsData.js';
import { shakeScale } from '../shared/hitFeedback.js';

const MAX_PARTS = 140;      // the spec's peak is about 140 simple shapes alive at once
const LANE_H = LANE_BOTTOM - LANE_TOP;
const rnd = (a, b) => a + Math.random() * (b - a);
const pickWeighted = (table) => { let r = Math.random(); for (const [v, w] of table) { r -= w; if (r <= 0) return v; } return table[table.length - 1][0]; };
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

export class MegaStompFx {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} o { getBosses: () => BrickDugan[], onSlam: (boss) => void (hit-stop), reduceFlash: () => boolean }
   */
  constructor(scene, { getBosses, onSlam = null, reduceFlash = () => false }) {
    this.scene = scene; this.getBosses = getBosses; this.onSlam = onSlam; this.reduceFlash = reduceFlash;
    this.floor = scene.add.graphics().setDepth(LANE_TOP);                // fighters sit at depth = their y (>= 460): this is behind them
    this.top = scene.add.graphics().setDepth(M.debris.layerDepth);
    this.parts = [];
    this.state = new Map();      // boss id -> { moveSeq, seq, ox, oy, last: {crack, dust, deb}: [left, right], timers: [] }
  }

  _settings() { try { return loadSettings(globalThis.localStorage); } catch { return {}; } }
  /** { shake: 0..1 camera-shake scale, parts: particle count scale } from Options (Screen Shake Off/Light/Full, Reduced Motion). */
  _scales() {
    const st = this._settings();
    const shake = st.reducedMotion === true ? 0 : shakeScale(st.screenShake);
    return { shake, parts: shake > 0 ? 1 : M.reduce.particleScaleWithoutShake };
  }

  _st(boss) {
    let s = this.state.get(boss.id);
    if (!s) { s = { moveSeq: 0, seq: 0, ox: boss.x, oy: boss.y, last: { crack: [0, 0], dust: [0, 0], deb: [0, 0] }, timers: [] }; this.state.set(boss.id, s); }
    return s;
  }

  _cancelTimers(s) { for (const t of s.timers) t.remove(false); s.timers.length = 0; }

  update(dtMs) {
    const dt = dtMs / 1000;
    this.floor.clear(); this.top.clear();
    const live = new Set();
    for (const boss of this.getBosses()) {
      if (!boss.move && !this.state.has(boss.id)) continue;
      const s = this._st(boss); live.add(boss.id);
      const clock = boss.alive ? boss.cueClockMs : null;
      const inStomp = clock !== null && boss.move && boss.move.id === 'stomp';
      if (!inStomp) { if (s.timers.length) this._cancelTimers(s); continue; }   // parried, stunned or finished: stop the rumble
      if (boss.moveSeq !== s.moveSeq) { s.moveSeq = boss.moveSeq; this._scheduleShake(s); }
      if (boss.stompSeq !== s.seq) { s.seq = boss.stompSeq; s.ox = boss.x; s.oy = boss.y; s.last = { crack: [0, 0], dust: [0, 0], deb: [0, 0] }; this._impact(boss, s); }
      this._telegraph(boss, s, clock);
      const r = waveRadius(clock);
      if (r >= 0) this._wave(s, r);
    }
    for (const id of [...this.state.keys()]) if (!live.has(id)) { this._cancelTimers(this.state.get(id)); this.state.delete(id); }
    this._particles(dt);
  }

  // ---- screen shake: the keyframe list runs from the start of the wind-up (rumble), peaks at the slam, decays ----
  _scheduleShake(s) {
    this._cancelTimers(s);
    const k = this._scales().shake;
    for (const f of shakeFrames(k)) {
      s.timers.push(this.scene.time.delayedCall(f.at, () => this.scene.cameras.main.shake(f.ms, f.intensity, true)));
    }
  }

  // ---- wind-up: floor disc, ghost pulses, reach gates ----
  _telegraph(boss, s, clock) {
    const g = this.floor, c = M.telegraph, rf = this.reduceFlash();
    const x = s.seq ? s.ox : boss.x, y = s.seq ? s.oy : boss.y;
    const d = discAt(clock);
    if (d) {
      g.fillStyle(d.fill, d.alpha).fillEllipse(x, y, d.rx * 2, d.ry * 2);
      if (d.rimWidth > 0) g.lineStyle(d.rimWidth, d.rimColor, d.rimAlpha).strokeEllipse(x, y, d.rx * 2, d.ry * 2);
    }
    const gp = c.ghostPulses, ga = rf ? M.reduce.hitFlashLow.ghostPulseAlpha : gp.alpha;
    for (const dist of ghostPulseDistances(clock)) {
      for (const side of [-1, 1]) g.fillStyle(gp.color, ga).fillRect(x + side * dist - gp.widthPx / 2, LANE_TOP, gp.widthPx, LANE_H);
    }
    const ra = gateAlpha(clock);
    if (ra > 0.01) {
      const rg = c.reachGates;
      for (const side of [-1, 1]) {
        g.fillStyle(rg.color, ra);
        for (let yy = LANE_TOP; yy < LANE_BOTTOM; yy += rg.dash[0] + rg.dash[1]) g.fillRect(x + side * rg.xOffsetPx - rg.widthPx / 2, yy, rg.widthPx, Math.min(rg.dash[0], LANE_BOTTOM - yy));
      }
    }
  }

  // ---- the slam: core flash, ring, chunks, dust burst, radial cracks, hit-stop ----
  _impact(boss, s) {
    const rf = this.reduceFlash(), sc = this._scales().parts, w = M.wave;
    const core = rf ? { ...w.slamCore, ...M.reduce.hitFlashLow.slamCore } : w.slamCore;
    this.parts.push({ kind: 'core', x: s.ox, y: s.oy, t: 0, life: core.lifeMs, rx: w.slamCore.rx, ratio: w.slamCore.heightRatio, color: core.color, alpha: core.alpha });
    this.parts.push({ kind: 'ring', x: s.ox, y: s.oy, t: 0, life: w.slamRing.lifeMs, rx: w.slamRing.rx, ratio: w.slamRing.heightRatio,
      width: rf ? M.reduce.hitFlashLow.slamRing.widthPx : w.slamRing.widthPx, alpha: rf ? M.reduce.hitFlashLow.slamRing.alpha : 1, colors: w.slamRing.colors });
    const deb = M.debris.slam;
    for (let i = 0; i < Math.round(deb.count * sc); i++) {
      const ang = (rnd(deb.coneDegUp[0], deb.coneDegUp[1]) * Math.PI) / 180, sp = rnd(deb.speed[0], deb.speed[1]);
      const sideBias = Math.random() < 0.5 ? -1 : 1;
      this.parts.push({ kind: 'chunk', x: s.ox + rnd(-30, 30), y: s.oy + rnd(-12, 12), z: 4, vx: Math.cos(ang) * sp * sideBias * 0.8 + rnd(-60, 60), vz: Math.sin(ang) * sp, t: 0, life: rnd(deb.lifeMs[0], deb.lifeMs[1]),
        size: rnd(deb.sizePx[0], deb.sizePx[1]), tri: Math.random() < deb.triangleShare, color: pickWeighted(deb.colors), bounces: 0, rest: deb.restitution, gravity: deb.gravity });
    }
    const du = M.dust.slamBurst;
    for (let i = 0; i < Math.round(du.count * sc); i++) this._dust(s.ox + rnd(-90, 90), s.oy + rnd(-14, 14), rnd(du.sizePx[0], du.sizePx[1]), 0.55, rnd(du.lifeMs[0], du.lifeMs[1]), 0.8, 24);
    const rd = w.trail.cracks.radial;
    for (let i = 0; i < rd.count; i++) {
      const ang = (i / rd.count) * Math.PI * 2 + rnd(-0.25, 0.25), len = rnd(rd.lengthPx[0], rd.lengthPx[1]);
      this.parts.push({ kind: 'crack', t: 0, hold: rd.lifeMs * 0.55, fade: rd.lifeMs * 0.45, pts: this._jag(s.ox, s.oy, Math.cos(ang), Math.sin(ang) * 0.3, len, 4), core: w.trail.cracks.core, glow: null });
    }
    if (this.onSlam) this.onSlam(boss);
  }

  _jag(x, y, ux, uy, len, segs) {
    const pts = [[x, y]];
    for (let i = 1; i <= segs; i++) pts.push([x + ux * len * (i / segs) + rnd(-5, 5), y + uy * len * (i / segs) + rnd(-3, 3)]);
    return pts;
  }

  _dust(x, y, size, alpha, life, ratio, rise) {
    if (this.parts.length >= MAX_PARTS) return;
    this.parts.push({ kind: 'dust', x, y, size, alpha, life, t: 0, ratio, rise, color: pickWeighted(M.dust.colors) });
  }

  // ---- the travelling front, both sides: band, trail, leading line, teeth, warning pops, and what it leaves behind ----
  _wave(s, r) {
    const g = this.floor, w = M.wave, rf = this.reduceFlash(), fa = frontAlpha(r);
    if (fa <= 0.01) return;
    const glowK = rf ? M.reduce.hitFlashLow.glowAlphaScale : 1, frontColor = rf ? M.reduce.hitFlashLow.frontColor : w.front.color;
    const slab = (side, from, to, color, alpha) => g.fillStyle(color, alpha * fa).fillRect(Math.min(s.ox + side * from, s.ox + side * to), LANE_TOP, Math.abs(to - from), LANE_H);
    for (const side of [-1, 1]) {
      const fx = s.ox + side * r;
      // dust trail then Ember band (4 slices each: a cheap gradient), behind the leading line
      const bw = w.band.widthPx, dw = w.trail.dust.widthPx;
      for (let i = 0; i < 4; i++) {
        slab(side, r - bw - dw * (i / 4), r - bw - dw * ((i + 1) / 4), w.trail.dust.color, lerp(w.trail.dust.alpha[0], w.trail.dust.alpha[1], (i + 0.5) / 4));
        slab(side, r - bw * (i / 4), r - bw * ((i + 1) / 4), w.band.color, lerp(w.band.alpha[0], w.band.alpha[1], (i + 0.5) / 4) * glowK);
      }
      slab(side, r - w.front.widthPx / 2, r + w.front.widthPx / 2, frontColor, w.front.alpha);
      // crest teeth, taller than the 30 px jump threshold: clear the teeth, be safe
      const t = w.teeth;
      g.lineStyle(t.outlinePx, t.outline, fa).fillStyle(t.fill, fa);
      for (let i = 0; i < t.count; i++) {
        const yb = LANE_TOP + (i + 1) * t.spacingPx;
        const tri = [fx - t.basePx / 2, yb, fx + t.basePx / 2, yb, fx + side * t.leanPx, yb - t.heightPx];
        g.fillTriangle(...tri); g.strokeTriangle(...tri);
      }
      // warning dirt pops ahead of the front: a small tick every 30 px, 30 to 120 px ahead, fading as the front arrives
      const wp = w.trail.warningPops;
      for (let a = wp.aheadPx[0], k = 0; a <= wp.aheadPx[1]; a += wp.everyPx, k++) {
        if (r + a > WAVE_REACH) break;
        const h = lerp(wp.sizePx[1], wp.sizePx[0], (a - wp.aheadPx[0]) / (wp.aheadPx[1] - wp.aheadPx[0]));
        const yy = LANE_TOP + 30 + ((k * 67) % (LANE_H - 60));
        g.fillStyle(wp.color, wp.alpha * fa).fillRect(fx + side * a - 1, yy - h, 2, h);
      }
      // what it leaves behind: cracks, dust puffs, and chunks thrown up at the front
      const i = side < 0 ? 0 : 1, tr = w.trail, deb = M.debris.front;
      while (r >= s.last.crack[i] + tr.cracks.everyPx) {
        s.last.crack[i] += tr.cracks.everyPx;
        if (this.parts.length < MAX_PARTS) {
          const cx = s.ox + side * (s.last.crack[i] - 6), cy = rnd(LANE_TOP + 20, LANE_BOTTOM - 20), ang = rnd(-0.7, 0.7);
          this.parts.push({ kind: 'crack', t: 0, hold: tr.cracks.core.holdMs, fade: tr.cracks.core.fadeMs, pts: this._jag(cx, cy, Math.cos(ang) * side, Math.sin(ang) * 0.35, rnd(tr.cracks.lengthPx[0], tr.cracks.lengthPx[1]), tr.cracks.segments), core: tr.cracks.core, glow: { ...tr.cracks.glow, alpha: tr.cracks.glow.alpha * glowK } });
        }
      }
      const du = M.dust.trail;
      while (r >= s.last.dust[i] + du.everyPx) {
        s.last.dust[i] += du.everyPx;
        this._dust(s.ox + side * (s.last.dust[i] - 10), rnd(LANE_TOP + 20, LANE_BOTTOM - 20), rnd(du.sizePx[0], du.sizePx[1]), du.alpha[0], rnd(du.lifeMs[0], du.lifeMs[1]), du.heightRatio, du.riseYPx);
      }
      while (r >= s.last.deb[i] + deb.everyPx) {
        s.last.deb[i] += deb.everyPx;
        if (this.parts.length < MAX_PARTS) {
          this.parts.push({ kind: 'chunk', x: s.ox + side * s.last.deb[i], y: rnd(LANE_TOP + 20, LANE_BOTTOM - 20), z: 2, vx: side * rnd(20, 90), vz: -rnd(deb.vy[0], deb.vy[1]), t: 0, life: deb.lifeMs,
            size: rnd(deb.sizePx[0], deb.sizePx[1]), tri: Math.random() < 0.4, color: pickWeighted(M.debris.slam.colors), bounces: 1, rest: 0, gravity: deb.gravity });
        }
      }
    }
  }

  // ---- particles ----
  _particles(dt) {
    const g = this.floor, top = this.top, ms = dt * 1000;
    for (const p of this.parts) {
      p.t += ms;
      const k = clamp01(p.t / p.life);
      switch (p.kind) {
        case 'core': {                               // one cream flattened flash at his feet
          const rx = lerp(p.rx[0], p.rx[1], 1 - (1 - k) * (1 - k));
          g.fillStyle(p.color, p.alpha * (1 - k)).fillEllipse(p.x, p.y, rx * 2, rx * 2 * p.ratio);
          break;
        }
        case 'ring': {                               // hot ring bursting out, cream to ember
          const rx = lerp(p.rx[0], p.rx[1], 1 - (1 - k) ** 3);
          g.lineStyle(p.width * (1 - k * 0.6), k < 0.35 ? p.colors[0] : p.colors[1], p.alpha * (1 - k)).strokeEllipse(p.x, p.y, rx * 2, rx * 2 * p.ratio);
          break;
        }
        case 'dust': {
          const grow = 0.7 + 0.5 * k;
          g.fillStyle(p.color, p.alpha * (1 - k)).fillEllipse(p.x, p.y - p.rise * k, p.size * grow, p.size * grow * p.ratio);
          break;
        }
        case 'crack': {
          const a = p.t <= p.hold ? 1 : 1 - clamp01((p.t - p.hold) / p.fade);
          if (a <= 0) break;
          g.lineStyle(p.core.widthPx, p.core.color, p.core.alpha * a).beginPath().moveTo(p.pts[0][0], p.pts[0][1]);
          for (let i = 1; i < p.pts.length; i++) g.lineTo(p.pts[i][0], p.pts[i][1]);
          g.strokePath();
          if (p.glow) {
            const ga = 1 - clamp01(p.t / p.glow.fadeMs);
            if (ga > 0) { g.lineStyle(p.glow.widthPx, p.glow.color, p.glow.alpha * ga).beginPath().moveTo(p.pts[0][0], p.pts[0][1]); for (let i = 1; i < p.pts.length; i++) g.lineTo(p.pts[i][0], p.pts[i][1]); g.strokePath(); }
          }
          break;
        }
        case 'chunk': {                              // flung up, falls, bounces once; drawn above the fighters
          p.vz -= p.gravity * dt; p.z += p.vz * dt; p.x += p.vx * dt;
          if (p.z < 0) { p.z = 0; if (p.bounces < 1 && p.rest > 0) { p.vz = -p.vz * p.rest; p.bounces++; } else { p.vz = 0; p.vx = 0; } }
          const a = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3, px = p.x, py = p.y - p.z;
          top.fillStyle(p.color, a);
          if (p.tri) top.fillTriangle(px - p.size / 2, py, px + p.size / 2, py, px, py - p.size); else top.fillRect(px - p.size / 2, py - p.size, p.size, p.size);
          break;
        }
        default: break;
      }
    }
    this.parts = this.parts.filter((p) => p.t < p.life);
  }

  reset() { this.parts.length = 0; for (const s of this.state.values()) this._cancelTimers(s); this.state.clear(); this.floor.clear(); this.top.clear(); }
  destroy() { this.reset(); this.floor.destroy(); this.top.destroy(); }
}
