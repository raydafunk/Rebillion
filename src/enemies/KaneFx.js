// "Crusher" Kane's floor effects, drawn with Phaser Graphics (primitives only): Hammer Slam's red circle and impact ring, Hook Chain Grab's red
// lock-on line and chain, Furnace Kick's steam hiss at the knee, Steam Vent Burst's red cone and lingering steam patches, Crushing Uppercut's red
// strip. Reads the boss' public state each frame (move, telegraphProgress, patches, hammerSeq, hookSeq, ventSeq), so the picture follows real timing.
import { KANE_MOVES } from './kaneData.js';

const LANE_TOP = 440;
const RED = 0xd23a2e, WHITE = 0xffffff, STEAM = 0xdfe9ea, ORANGE = 0xe3a92b;
const RING_MS = 350, CHAIN_MS = 260, PUFF_MS = 450;

export class KaneFx {
  /** @param {Phaser.Scene} scene @param {{getBosses: () => object[], onHammer?: (boss) => void, reduceFlash?: () => boolean}} o */
  constructor(scene, { getBosses, onHammer = null, reduceFlash = () => false }) {
    this.scene = scene; this.getBosses = getBosses; this.onHammer = onHammer; this.reduceFlash = reduceFlash;
    this.floor = scene.add.graphics().setDepth(LANE_TOP);
    this.top = scene.add.graphics().setDepth(5000);
    this.seen = new Map();   // boss id -> { hammerSeq, hammerAt, hookSeq, hookAt, ventSeq, ventAt }
    this.t = 0;
  }

  reset() { this.seen.clear(); this.floor.clear(); this.top.clear(); }
  destroy() { this.floor.destroy(); this.top.destroy(); this.seen.clear(); }

  update(dtMs) {
    this.t += dtMs;
    this.floor.clear(); this.top.clear();
    const flash = !this.reduceFlash();
    for (const b of this.getBosses()) {
      if (!b.patches) continue;
      let s = this.seen.get(b.id);
      if (!s) { s = { hammerSeq: b.hammerSeq, hammerAt: -1e9, hookSeq: b.hookSeq, hookAt: -1e9, ventSeq: b.ventSeq, ventAt: -1e9, ventX: b.x, ventDir: b.facing }; this.seen.set(b.id, s); }
      this._patches(b, flash);
      if (!b.alive) continue;
      const mv = b.move;
      if (mv && mv.id === 'hammer') this._hammer(b, s);
      if (mv && mv.id === 'hook') this._hook(b, s);
      if (mv && mv.id === 'kick') this._kick(b);
      if (mv && mv.id === 'vent') this._vent(b, s);
      if (mv && mv.id === 'uppercut') this._uppercut(b);
    }
  }

  _hammer(b, s) {
    const c = KANE_MOVES.hammer.circle, dir = b.facing >= 0 ? 1 : -1, cx = b.x + dir * c.cx, r = c.rx;
    if (b.hammerSeq !== s.hammerSeq) { s.hammerSeq = b.hammerSeq; s.hammerAt = this.t; if (this.onHammer) this.onHammer(b); }
    if (b.state === 'telegraph') {                                       // red circle fills in as the wind-up runs
      const p = b.telegraphProgress;
      this.floor.fillStyle(RED, 0.10 + 0.22 * p).fillEllipse(cx, b.y, r * 2, r * 0.7);
      this.floor.lineStyle(3, RED, 0.5 + 0.4 * p).strokeEllipse(cx, b.y, r * 2, r * 0.7);
    }
    const age = this.t - s.hammerAt;                                     // impact: a ring that spreads out and fades
    if (age >= 0 && age < RING_MS) {
      const k = age / RING_MS;
      this.floor.lineStyle(5 * (1 - k) + 1, WHITE, 0.8 * (1 - k)).strokeEllipse(cx, b.y, r * 2 * (0.7 + 0.5 * k), r * 0.7 * (0.7 + 0.5 * k));
      this.floor.fillStyle(ORANGE, 0.25 * (1 - k)).fillEllipse(cx, b.y, r * 2, r * 0.7);
    }
  }

  _hook(b, s) {
    const m = KANE_MOVES.hook, h = m.hitbox, dir = b.facing >= 0 ? 1 : -1;
    const x0 = b.x + dir * h.x, x1 = b.x + dir * (h.x + h.w), y = b.y - 60;
    if (b.hookSeq !== s.hookSeq) { s.hookSeq = b.hookSeq; s.hookAt = this.t; }
    if (b.state === 'telegraph') {                                       // hook flashes: a red line along the throw, tightening
      const p = b.telegraphProgress;
      this.top.lineStyle(2 + 2 * p, RED, 0.25 + 0.5 * p).lineBetween(x0, y, x1, y);
      this.top.fillStyle(RED, 0.4 + 0.5 * p).fillTriangle(x1, y - 8, x1, y + 8, x1 + dir * 14, y);
      return;
    }
    const age = this.t - s.hookAt;
    if (b.state === 'attack' && age >= 0 && age < CHAIN_MS) {            // the chain: a dashed line flying out then snapping back
      const k = age / CHAIN_MS, reach = k < 0.5 ? k * 2 : 1 - (k - 0.5) * 2, xe = x0 + (x1 - x0) * reach, a = 1 - k * 0.6;
      const segs = 14;
      for (let i = 0; i < segs; i += 2) {
        const xa = x0 + (xe - x0) * (i / segs), xb = x0 + (xe - x0) * ((i + 1) / segs);
        this.top.lineStyle(4, 0x9aa0a6, a).lineBetween(xa, y, xb, y + (i % 4 === 0 ? 2 : -2));
      }
      this.top.fillStyle(WHITE, a).fillCircle(xe, y, 7);
    }
  }

  _kick(b) {                                                             // steam hisses from the knee during the wind-up
    if (b.state !== 'telegraph') return;
    const dir = b.facing >= 0 ? 1 : -1, p = b.telegraphProgress;
    for (let i = 0; i < 3; i++) {
      const k = (p * 3 + i / 3) % 1;
      this.top.fillStyle(STEAM, 0.55 * (1 - k)).fillCircle(b.x + dir * (14 + k * 26), b.y - 38 - k * 26, 5 + k * 9);
    }
  }

  _vent(b, s) {
    const m = KANE_MOVES.vent, cfg = m.patch, dir = b.facing >= 0 ? 1 : -1;
    if (b.ventSeq !== s.ventSeq) { s.ventSeq = b.ventSeq; s.ventAt = this.t; s.ventX = b.x; s.ventDir = dir; }
    if (b.state === 'telegraph') {                                       // red cone on the ground + steam building on the shoulders
      const p = b.telegraphProgress, x0 = b.x + dir * 10, x1 = b.x + dir * (cfg.offsetX + cfg.widthPx / 2), hh = cfg.depthPx / 2;
      this.floor.fillStyle(RED, 0.10 + 0.22 * p).fillTriangle(x0, b.y, x1, b.y - hh, x1, b.y + hh);
      this.floor.lineStyle(3, RED, 0.5 + 0.4 * p).strokeTriangle(x0, b.y, x1, b.y - hh, x1, b.y + hh);
      for (const sx of [-18, 18]) {
        const k = (p * 4 + (sx > 0 ? 0.5 : 0)) % 1;
        this.top.fillStyle(STEAM, 0.25 + 0.4 * p).fillCircle(b.x + sx + (Math.random() - 0.5) * 4, b.y - 96 - k * 22, 5 + 6 * p);
      }
      return;
    }
    const age = this.t - s.ventAt;                                       // burst: a cone of steam puffs out
    if (age >= 0 && age < PUFF_MS) {
      const k = age / PUFF_MS, reach = cfg.offsetX + cfg.widthPx / 2, hh = cfg.depthPx / 2;
      this.top.fillStyle(STEAM, 0.55 * (1 - k)).fillTriangle(s.ventX + s.ventDir * 10, b.y - 40, s.ventX + s.ventDir * (reach * (0.4 + 0.6 * k)), b.y - 40 - hh, s.ventX + s.ventDir * (reach * (0.4 + 0.6 * k)), b.y - 40 + hh);
    }
  }

  _uppercut(b) {                                                         // red strip in front of him
    if (b.state !== 'telegraph') return;
    const h = KANE_MOVES.uppercut.hitbox, dir = b.facing >= 0 ? 1 : -1, p = b.telegraphProgress;
    const x = dir > 0 ? b.x + h.x : b.x - h.x - h.w;
    this.floor.fillStyle(RED, 0.12 + 0.25 * p).fillRect(x, b.y - 18, h.w, 36);
    this.floor.lineStyle(3, RED, 0.5 + 0.4 * p).strokeRect(x, b.y - 18, h.w, 36);
  }

  _patches(b, flash) {
    for (const p of b.patches) {
      const x = p.x - p.w / 2, y = p.y - p.d / 2;
      if (p.state === 'warn') {                                          // pulsing red outline: where the steam will settle
        const pulse = 0.35 + 0.35 * Math.abs(Math.sin(this.t / 120));
        this.floor.lineStyle(3, RED, pulse).strokeEllipse(p.x, p.y, p.w, p.d);
        continue;
      }
      const fade = Math.min(1, p.lifeLeft / 500);                        // fades in its last half second
      this.floor.fillStyle(STEAM, 0.28 * fade).fillEllipse(p.x, p.y, p.w, p.d);
      this.floor.lineStyle(2, STEAM, 0.7 * fade).strokeEllipse(p.x, p.y, p.w, p.d);
      const puffs = flash ? 5 : 2;                                       // drifting steam puffs (fewer and calmer under Reduced Flash)
      for (let i = 0; i < puffs; i++) {
        const k = ((this.t / 900) + i / puffs) % 1;
        const px = x + ((i + 0.5) / puffs) * p.w + Math.sin(this.t / 300 + i) * 8;
        this.floor.fillStyle(WHITE, 0.35 * (1 - k) * fade).fillCircle(px, y + p.d * 0.6 - k * 46, 9 + k * 12);
      }
    }
  }
}
