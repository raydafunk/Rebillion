// "Subject 88" effects, Phaser Graphics only: the green gas cone and fading puddles (drawn from boss.hazards, so what you see is the hurt area),
// the spit mark circle, the red charge lane strip, the Chemical Explosion warning ring and burst, and a green vein glow on him that brightens when
// he flares. No gore. Honours reduceFlash (steady glow, no white flash, calmer pulses).
const FLOOR_DEPTH = 440;
const GREEN = 0x7be04a, DEEP = 0x2f8f2a, RED = 0xd23a2e, WHITE = 0xffffff;
const POP_MS = 300;

export class Subject88Fx {
  /** @param {Phaser.Scene} scene @param {{getBosses: () => object[], onBurst?: (boss) => void, reduceFlash?: () => boolean}} o */
  constructor(scene, { getBosses, onBurst = () => {}, reduceFlash = () => false }) {
    this.scene = scene; this.getBosses = getBosses; this.onBurst = onBurst; this.reduceFlash = reduceFlash;
    this.floor = scene.add.graphics().setDepth(FLOOR_DEPTH);
    this.top = scene.add.graphics().setDepth(5000);
    this.seen = new Map();   // boss id -> { explosionSeq, burstAt }
    this.t = 0;
  }

  reset() { this.seen.clear(); this.floor.clear(); this.top.clear(); }
  destroy() { this.reset(); this.floor.destroy(); this.top.destroy(); }

  update(dtMs) {
    this.t += dtMs;
    this.floor.clear(); this.top.clear();
    for (const b of this.getBosses()) {
      let s = this.seen.get(b.id);
      if (!s) { s = { explosionSeq: b.explosionSeq, burstAt: -1e9 }; this.seen.set(b.id, s); }
      if (b.explosionSeq !== s.explosionSeq) { s.explosionSeq = b.explosionSeq; s.burstAt = this.t; this.onBurst(b); }
      for (const h of b.hazards || []) (h.kind === 'gas' ? this._gas(h) : this._puddle(h));
      if (!b.alive) continue;
      if (b.spitMark) this._spit(b);
      if (b.chargeLane) this._lane(b);
      if (b.explosion) this._explosion(b, s);
      this._veins(b);
    }
  }

  _fade(h) { return Math.max(0, Math.min(1, h.alpha ?? (h.maxLife ? h.life / h.maxLife : 1))); }

  _gas(h) {                                                            // cone from his mouth: the rect that hurts, wedge-shaped so it reads as a breath
    const bx = h.box, a = this._fade(h), dir = h.facing >= 0 ? 1 : -1;
    const x0 = dir > 0 ? bx.x : bx.x + bx.w, x1 = dir > 0 ? bx.x + bx.w : bx.x, cy = bx.y + bx.h / 2;
    this.floor.fillStyle(GREEN, 0.28 * a).fillTriangle(x0, cy - 6, x1, bx.y, x1, bx.y + bx.h);
    this.floor.fillStyle(DEEP, 0.18 * a).fillEllipse((x0 + x1) / 2, cy, Math.abs(x1 - x0) * 0.8, bx.h * 0.7);
    this.floor.lineStyle(2, GREEN, 0.5 * a).strokeRect(bx.x, bx.y, bx.w, bx.h);
  }

  _puddle(h) {                                                         // toxic puddle: fades out as its life runs down
    const a = this._fade(h), pop = Math.min(1, ((h.maxLife || 1) - h.life) / POP_MS), r = h.r * (0.6 + 0.4 * pop);
    const wobble = this.reduceFlash() ? 1 : 1 + 0.03 * Math.sin(this.t / 120 + h.x);
    this.floor.fillStyle(DEEP, 0.4 * a).fillEllipse(h.x, h.y, r * 2 * wobble, r * 0.9);
    this.floor.fillStyle(GREEN, 0.25 * a).fillEllipse(h.x, h.y, r * 1.3, r * 0.55);
    this.floor.lineStyle(2, GREEN, 0.7 * a).strokeEllipse(h.x, h.y, r * 2, r * 0.9);
  }

  _spit(b) {                                                           // where the glob will land
    const m = b.spitMark, p = Math.max(b.telegraphProgress, 0.2);
    this.floor.lineStyle(3, GREEN, 0.4 + 0.5 * p).strokeEllipse(m.x, m.y, m.r * 2, m.r * 0.9);
    this.floor.fillStyle(GREEN, 0.12 + 0.2 * p).fillEllipse(m.x, m.y, m.r * 2 * p, m.r * 0.9 * p);
  }

  _lane(b) {                                                           // red strip along the floor he is about to run down
    const c = b.chargeLane, x = Math.min(c.x0, c.x1), w = Math.abs(c.x1 - c.x0), p = b.telegraphing ? b.telegraphProgress : 1;
    this.floor.fillStyle(RED, 0.16 + 0.2 * p).fillRect(x, c.y - c.h / 2, w, c.h);
    this.floor.lineStyle(2, RED, 0.4 + 0.4 * p).strokeRect(x, c.y - c.h / 2, w, c.h);
  }

  _explosion(b, s) {                                                   // warning ring grows while he is rooted, then a green burst
    const e = b.explosion, burst = e.state === 'burst';
    this.floor.lineStyle(burst ? 6 : 3, burst ? GREEN : RED, burst ? 0.9 : 0.5 + 0.4 * (e.r / e.maxR)).strokeEllipse(e.x, e.y, e.r * 2, e.r * 0.8);
    this.floor.fillStyle(burst ? GREEN : RED, burst ? 0.3 : 0.08).fillEllipse(e.x, e.y, e.r * 2, e.r * 0.8);
    if (burst && !this.reduceFlash() && this.t - s.burstAt < 120) this.top.fillStyle(WHITE, 0.3).fillEllipse(e.x, e.y - 20, e.r * 2, e.r);
    if (!burst) this.floor.lineStyle(2, RED, 0.25).strokeEllipse(e.x, e.y, e.maxR * 2, e.maxR * 0.8);
  }

  _veins(b) {                                                          // green glow on his body; brighter once flared
    const base = b.flared ? 0.32 : 0.14, pulse = this.reduceFlash() ? 0 : 0.1 * Math.sin(this.t / 160);
    this.top.fillStyle(GREEN, Math.max(0, base + pulse)).fillEllipse(b.x, b.y - 55, 54, 96);
  }
}
