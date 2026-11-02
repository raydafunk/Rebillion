// Dugan's Wall Slam impact when Zed is slammed: dent, cream core flash, ember ring, ripples, cracks (radial, long, along the slide),
// shoved dust and pebbles, chunks and sparks, a skid groove while he slides, a camera shake and a screen-edge vignette.
// Primitives only (Phaser Graphics), two world layers plus one screen-space layer. Looks and numbers: design/art/dugan-wall-slam.md via wallSlamData.js.
// The camera punch-in zoom from the spec is not used (it fights the follow camera).
import { WALL_SLAM as W, clampImpactY, shakeFrames, dentAt, ringRadius, vignetteK, sparkColor } from './wallSlamData.js';
import { loadSettings } from '../ui/optionsData.js';
import { shakeScale } from '../shared/hitFeedback.js';
import { EVENTS } from '../shared/events.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const pickWeighted = (table) => { let r = Math.random(); for (const [v, p] of table) { r -= p; if (r <= 0) return v; } return table[table.length - 1][0]; };

export class WallSlamFx {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} o { events, getZed: () => {x, feetY, vx}, getXRange: () => {min,max}, reduceFlash: () => boolean }
   */
  constructor(scene, { events, getZed, getXRange = null, reduceFlash = () => false }) {
    this.scene = scene; this.events = events; this.getZed = getZed; this.getXRange = getXRange; this.reduceFlash = reduceFlash;
    this.floor = scene.add.graphics().setDepth(W.floorDepth);
    this.top = scene.add.graphics().setDepth(W.topDepth);
    this.screen = scene.add.graphics().setDepth(W.topDepth + 10).setScrollFactor(0);
    this.parts = []; this.cracks = []; this.pebbles = []; this.groove = [];
    this.imp = null;            // the impact in progress: { t, x, y, dir, grooveT, dustT, scrapeT, lastX }
    this.timers = [];
    this._on = (p) => this._impact(p);
    events.on(EVENTS.PLAYER_SLAMMED, this._on);
  }

  _settings() { try { return loadSettings(globalThis.localStorage); } catch { return {}; } }
  _scales() {
    const st = this._settings();
    const shake = st.reducedMotion === true ? 0 : shakeScale(st.screenShake);
    return { shake, parts: shake > 0 ? 1 : W.reduce.particleScale };
  }
  _add(p) { if (this.parts.length < W.particleCap) this.parts.push(p); }

  _impact({ x, slamDir = 1 }) {
    const z = this.getZed(), y = clampImpactY(z.feetY ?? 600), dir = slamDir < 0 ? -1 : 1;
    const rf = this.reduceFlash(), { shake, parts: pk } = this._scales();
    this._cancel();
    for (const f of shakeFrames(shake)) this.timers.push(this.scene.time.delayedCall(f.at, () => this.scene.cameras.main.shake(f.ms, f.intensity, true)));
    this.imp = { t: 0, x, y, dir, grooveT: 0, dustT: 0, scrapeT: 0, lastX: x, rf, groovePts: [[x, y + W.slide.groove.yOffsetPx]] };
    this.groove.length = 0; this.cracks.length = 0; this.pebbles.length = 0;
    const core = rf ? { ...W.core, ...W.reduce.flashLow.core, alpha: [W.reduce.flashLow.core.alpha, 0] } : W.core;
    this.parts.push({ kind: 'core', x, y, t: 0, life: core.lifeMs, rx: W.core.rx, ratio: W.core.heightRatio, color: core.color, a0: core.alpha[0] });
    this.parts.push({ kind: 'ring', x, y, t: 0, life: W.ring.lifeMs, wait: 0, rx: W.ring.rx, ratio: W.ring.heightRatio, width: rf ? W.reduce.flashLow.ring.widthPx : W.ring.widthPx[0], a0: rf ? W.reduce.flashLow.ring.alpha : 1, colors: rf ? W.reduce.flashLow.ring.colors : W.ring.colors });
    for (const r of W.ripples) this.parts.push({ kind: 'ripple', x, y, t: -r.startMs, life: r.lifeMs, rx: r.rx });
    // cracks: radial short, long along the lane, one long along the slide, a few branches
    const C = W.cracks, ratio = 0.3;
    const addCrack = (ox, oy, ang, len, grow = C.growMs) => {
      const segs = Math.max(2, Math.round(len / rnd(C.segmentPx[0], C.segmentPx[1])));
      const pts = [[ox, oy]];
      for (let i = 1; i <= segs; i++) pts.push([ox + Math.cos(ang) * len * (i / segs) + rnd(-C.jitterPx[0], C.jitterPx[0]), oy + Math.sin(ang) * len * ratio * (i / segs) + rnd(-C.jitterPx[1], C.jitterPx[1])]);
      this.cracks.push({ t: 0, grow: shake > 0 ? (grow ?? 100) : 0, pts, scale0: C.startLengthScale });
      return pts;
    };
    for (let i = 0; i < C.short.count; i++) addCrack(x, y, (i / C.short.count) * Math.PI * 2 + rnd(-C.short.angleJitterRad, C.short.angleJitterRad), rnd(...C.short.lengthPx), 120);
    for (const a of C.long.anglesDeg) addCrack(x, y, (a * Math.PI) / 180 + rnd(-C.long.angleJitterRad, C.long.angleJitterRad), rnd(...C.long.lengthPx), 160);
    const sl = addCrack(x, y + C.slide.yOffsetPx, dir > 0 ? 0 : Math.PI, this._clampLen(x, dir, C.slide.lengthPx), C.slide.growMs);
    for (let i = 0; i < C.branches.count; i++) {
      const at = Math.round(lerp(C.branches.atPercent[0], C.branches.atPercent[1], i / Math.max(1, C.branches.count - 1)) / 100 * (sl.length - 1));
      const side = i % 2 ? 1 : -1, p = sl[Math.min(sl.length - 1, Math.max(1, at))];
      addCrack(p[0], p[1], (dir > 0 ? 0 : Math.PI) + side * (C.branches.angleDeg * Math.PI) / 180, C.slide.lengthPx * C.branches.lengthScale, 160);
    }
    // chunks, sparks, ring dust, pebbles, burst dust
    const ch = W.chunks;
    for (let i = 0; i < Math.round(ch.count * pk); i++) {
      const ang = (rnd(...ch.coneDegUp) * Math.PI) / 180, sp = rnd(...ch.speed), bias = i < ch.slideBiasCount ? dir : (Math.random() < 0.5 ? -1 : 1);
      this._add({ kind: 'chunk', x: x + rnd(-ch.spawnSpreadPx[0], ch.spawnSpreadPx[0]), y: y + rnd(-ch.spawnSpreadPx[1], ch.spawnSpreadPx[1]), z: 4, vx: Math.cos(ang) * sp * bias * 0.8 + rnd(-50, 50), vz: Math.sin(ang) * sp,
        t: 0, life: rnd(...ch.lifeMs), size: rnd(...ch.sizePx), tri: Math.random() < ch.triangleShare, color: pickWeighted(ch.colors), bounced: false });
    }
    for (let i = 0; i < Math.round(W.sparks.count * pk); i++) this._spark(x, y, dir);
    for (let i = 0; i < Math.round(W.ringDust.count * pk); i++) {
      const a = (i / W.ringDust.count) * Math.PI * 2 + rnd(-0.15, 0.15);
      this._add({ kind: 'ringdust', x, y, a, t: 0, life: W.ringDust.travelMs, size: rnd(...W.ringDust.sizePx), color: pickWeighted(W.ringDust.colors) });
    }
    for (let i = 0; i < Math.round(W.pebbles.count * pk); i++) {
      const a = rnd(0, Math.PI * 2), r = rnd(...W.pebbles.radiusPx);
      this.pebbles.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.3, r, z: 0, vz: 0, hopped: false, t: 0, size: rnd(...W.pebbles.sizePx), color: Math.random() < 0.5 ? W.pebbles.colors[0] : W.pebbles.colors[1], a });
    }
    for (let i = 0; i < Math.round(W.burstDust.count * pk); i++) this._add({ kind: 'dust', x: x + rnd(-W.burstDust.spreadPx, W.burstDust.spreadPx), y: y + rnd(-12, 12), t: 0, life: rnd(...W.burstDust.lifeMs), size: rnd(...W.burstDust.sizePx), ratio: 0.8, rise: W.burstDust.risePx, a0: W.burstDust.alpha[0], color: pickWeighted(W.ringDust.colors) });
  }

  _clampLen(x, dir, len) {
    const r = this.getXRange ? this.getXRange() : null;
    if (!r) return len;
    return Math.max(40, Math.min(len, dir > 0 ? r.max - x : x - r.min));
  }

  _spark(x, y, dir) {
    const S = W.sparks, ang = ((rnd(-S.coneDeg, S.coneDeg) + 20) * Math.PI) / 180, sp = rnd(...S.speed), side = Math.random() < 0.6 ? dir : -dir;
    this._add({ kind: 'spark', x, y: y - 6, z: 6, vx: Math.cos(ang) * sp * side, vz: Math.sin(ang) * sp, t: 0, life: rnd(...S.lifeMs), len: rnd(...S.lengthPx) });
  }

  _cancel() { for (const t of this.timers) t.remove(false); this.timers.length = 0; }

  update(dtMs) {
    const dt = dtMs / 1000, f = this.floor, top = this.top;
    f.clear(); top.clear(); this.screen.clear();
    const imp = this.imp;
    if (imp) {
      imp.t += dtMs;
      this._dent(imp, f); this._slide(imp, dtMs); this._vignette(imp);
      if (imp.t > 1500 && !this.parts.length && !this.cracks.length && !this.groove.length) this.imp = null;
    }
    this._cracks(f, dtMs); this._groove(f, dtMs); this._pebbles(f, top, dt); this._particles(f, top, dt);
  }

  _dent(imp, g) {
    const d = dentAt(imp.t);
    if (!d) return;
    g.fillStyle(W.dent.fill, d.alpha).fillEllipse(imp.x, imp.y, d.rx * 2, d.ry * 2);
    g.lineStyle(W.dent.rim.widthPx, W.dent.rim.color, W.dent.rim.alpha * (d.alpha / W.dent.alpha)).strokeEllipse(imp.x, imp.y, d.rx * 2, d.ry * 2);
  }

  // while Zed skids along the floor: a groove behind him, dust puffs, and now and then a scrape spark
  _slide(imp, dtMs) {
    const z = this.getZed(), sp = Math.abs(z.vx || 0);
    if (sp < W.slide.activeAboveSpeed || imp.t > 900) return;
    const gv = W.slide.groove, du = W.slide.dust;
    imp.groovePts.push([z.x, imp.y + gv.yOffsetPx]);
    this.groove.length = 0; this.groove.push({ pts: imp.groovePts, t: 0 });
    imp.dustT -= dtMs; imp.scrapeT -= dtMs;
    if (imp.dustT <= 0) { imp.dustT = du.everyMs; this._add({ kind: 'dust', x: z.x - imp.dir * 10, y: imp.y + rnd(-6, 6), t: 0, life: rnd(...du.lifeMs), size: rnd(...du.sizePx), ratio: du.heightRatio, rise: du.risePx, a0: du.alpha[0], color: pickWeighted(W.ringDust.colors) }); }
    if (imp.scrapeT <= 0 && sp >= W.sparks.scrape.minSlideSpeed) { imp.scrapeT = W.sparks.scrape.everyMs; for (let i = 0; i < 2; i++) this._spark(z.x, imp.y, -imp.dir); }
  }

  _groove(g, dtMs) {
    const gv = W.slide.groove;
    for (const s of this.groove) {
      s.t += dtMs;
      const a = this.imp && this.imp.t < 900 ? 1 : 1 - clamp01((this.imp ? this.imp.t - 900 - gv.lingerMs : 0) / gv.fadeMs);
      if (a <= 0 || s.pts.length < 2) continue;
      g.lineStyle(gv.widthPx, gv.color, gv.alpha * a).beginPath().moveTo(s.pts[0][0], s.pts[0][1]);
      for (let i = 1; i < s.pts.length; i++) g.lineTo(s.pts[i][0], s.pts[i][1]);
      g.strokePath();
    }
    if (this.imp && this.imp.t > 900 + gv.lingerMs + gv.fadeMs) this.groove.length = 0;
  }

  _vignette(imp) {
    const v = W.vignette, k = vignetteK(imp.t) * (this._scales().shake > 0 ? 1 : W.reduce.vignetteScale) * (imp.rf ? W.reduce.vignetteScale : 1);
    if (k <= 0) return;
    const cam = this.scene.cameras.main, w = cam.width, h = cam.height;
    for (let i = 0; i < v.frames; i++) {
      const a = lerp(v.alphaOuterToInner[0], v.alphaOuterToInner[1], i / (v.frames - 1)) * k, o = i * v.frameWidthPx;
      this.screen.fillStyle(v.color, a);
      this.screen.fillRect(0, o, w, v.frameWidthPx).fillRect(0, h - o - v.frameWidthPx, w, v.frameWidthPx);
      this.screen.fillRect(o, o + v.frameWidthPx, v.frameWidthPx, h - 2 * (o + v.frameWidthPx)).fillRect(w - o - v.frameWidthPx, o + v.frameWidthPx, v.frameWidthPx, h - 2 * (o + v.frameWidthPx));
    }
  }

  _cracks(g, dtMs) {
    const C = W.cracks;
    for (const c of this.cracks) {
      c.t += dtMs;
      const grow = c.grow > 0 ? lerp(c.scale0, 1, 1 - (1 - clamp01(c.t / c.grow)) ** 3) : 1;
      const fade = c.t <= C.holdMs ? 1 : 1 - clamp01((c.t - C.holdMs) / C.fadeMs);
      if (fade <= 0) continue;
      const n = Math.max(2, Math.ceil(c.pts.length * grow));
      const draw = (width, color, alpha) => {
        g.lineStyle(width, color, alpha).beginPath().moveTo(c.pts[0][0], c.pts[0][1]);
        for (let i = 1; i < n; i++) g.lineTo(c.pts[i][0], c.pts[i][1]);
        g.strokePath();
      };
      draw(C.core.widthPx, C.core.color, C.core.alpha * fade);
      const ga = 1 - clamp01(c.t / C.glow.fadeMs);
      if (ga > 0) draw(C.glow.widthPx, C.glow.color, C.glow.alpha * ga * (this.imp && this.imp.rf ? W.reduce.glowScale : 1));
    }
    this.cracks = this.cracks.filter((c) => c.t < C.holdMs + C.fadeMs);
  }

  // pebbles hop when the ring passes their radius
  _pebbles(g, top, dt) {
    const imp = this.imp;
    if (!imp) { this.pebbles.length = 0; return; }
    const ringR = ringRadius(imp.t);
    for (const p of this.pebbles) {
      if (!p.hopped && ringR >= p.r) { p.hopped = true; p.vz = rnd(...W.pebbles.hopVz); }
      if (!p.hopped) { g.fillStyle(p.color, 0.8).fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); continue; }
      p.t += dt * 1000; p.vz -= W.pebbles.gravity * dt; p.z = Math.max(0, p.z + p.vz * dt); p.x += Math.cos(p.a) * rnd(...W.pebbles.driftSpeed) * dt;
      top.fillStyle(p.color, 1 - clamp01(p.t / W.pebbles.lifeMs)).fillRect(p.x - p.size / 2, p.y - p.z - p.size, p.size, p.size);
    }
    this.pebbles = this.pebbles.filter((p) => !p.hopped || p.t < W.pebbles.lifeMs);
  }

  _particles(f, top, dt) {
    const ms = dt * 1000;
    for (const p of this.parts) {
      p.t += ms;
      if (p.t < 0) continue;
      const k = clamp01(p.t / p.life);
      switch (p.kind) {
        case 'core': { const rx = lerp(p.rx[0], p.rx[1], 1 - (1 - k) ** 2); f.fillStyle(p.color, p.a0 * (1 - k)).fillEllipse(p.x, p.y, rx * 2, rx * 2 * p.ratio); break; }
        case 'ring': {
          const rx = lerp(p.rx[0], p.rx[1], 1 - (1 - k) ** 3);
          f.lineStyle(Math.max(1, lerp(p.width, 2, k)), k < W.ring.switchAtLife ? p.colors[0] : p.colors[1], p.a0 * (1 - k)).strokeEllipse(p.x, p.y, rx * 2, rx * 2 * p.ratio);
          break;
        }
        case 'ripple': { const rx = lerp(p.rx[0], p.rx[1], 1 - (1 - k) ** 3); f.lineStyle(W.ripple.widthPx, W.ripple.color, W.ripple.alpha * (1 - k)).strokeEllipse(p.x, p.y, rx * 2, rx * 2 * 0.3); break; }
        case 'ringdust': {
          const r = ringRadius(p.t), s = p.size * lerp(1, W.ringDust.grow, k);
          f.fillStyle(p.color, W.ringDust.alpha[0] * (1 - k)).fillEllipse(p.x + Math.cos(p.a) * r, p.y + Math.sin(p.a) * r * 0.3, s, s * W.ringDust.heightRatio);
          break;
        }
        case 'dust': { const s = p.size * (0.7 + 0.5 * k); f.fillStyle(p.color, p.a0 * (1 - k)).fillEllipse(p.x, p.y - p.rise * k, s, s * p.ratio); break; }
        case 'chunk': {
          p.vz -= W.chunks.gravity * dt; p.z += p.vz * dt; p.x += p.vx * dt;
          if (p.z < 0) { p.z = 0; if (!p.bounced) { p.vz = -p.vz * W.chunks.restitution; p.bounced = true; } else { p.vz = 0; p.vx = 0; } }
          const a = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3, px = p.x, py = p.y - p.z;
          top.fillStyle(p.color, a);
          if (p.tri) top.fillTriangle(px - p.size / 2, py, px + p.size / 2, py, px, py - p.size); else top.fillRect(px - p.size / 2, py - p.size, p.size, p.size);
          break;
        }
        case 'spark': {
          p.vz -= W.sparks.gravity * dt; p.z = Math.max(0, p.z + p.vz * dt); p.x += p.vx * dt;
          const col = this.imp && this.imp.rf && sparkColor(k) === 0xffffff ? 0xffd24a : sparkColor(k);
          const sx = Math.sign(p.vx) || 1, ln = p.len * (1 - k * 0.5), py = p.y - p.z;
          top.lineStyle(W.sparks.thicknessPx, col, 1 - k * 0.6).beginPath().moveTo(p.x - sx * ln * 0.5, py + (p.vz > 0 ? ln * 0.3 : -ln * 0.3)).lineTo(p.x + sx * ln * 0.5, py).strokePath();
          break;
        }
        default: break;
      }
    }
    this.parts = this.parts.filter((p) => p.t < p.life);
  }

  reset() { this._cancel(); this.parts.length = 0; this.cracks.length = 0; this.pebbles.length = 0; this.groove.length = 0; this.imp = null; this.floor.clear(); this.top.clear(); this.screen.clear(); }
  destroy() { this.events.off(EVENTS.PLAYER_SLAMMED, this._on); this.reset(); this.floor.destroy(); this.top.destroy(); this.screen.destroy(); }
}
