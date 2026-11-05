// Rage impact visuals: a red/white screen punch + contact burst on every Rage hit, and a big dust cloud with ground rings when the hit kills.
// Primitives only (Phaser Graphics). Numbers: src/shared/rageImpactFxData.js (spec: design/art/rage-impact-fx.md). Camera shake and hit-stop
// are handled by ArenaScene through MOVE_FEEDBACK; this class only draws.
import { RAGE_IMPACT_FX as F } from '../shared/rageImpactFxData.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const pickWeighted = (colors, weights) => { let r = Math.random() * weights.reduce((a, b) => a + b, 0); for (let i = 0; i < colors.length; i++) { r -= weights[i]; if (r <= 0) return colors[i]; } return colors[colors.length - 1]; };

export class RageImpactFx {
  /** @param {Phaser.Scene} scene  @param {{reduceFlash?:()=>boolean}} o */
  constructor(scene, { reduceFlash = () => false } = {}) {
    this.scene = scene; this.reduceFlash = reduceFlash;
    this.world = scene.add.graphics().setDepth(5990);
    this.screen = scene.add.graphics().setDepth(6100).setScrollFactor(0);
    this.parts = []; this.rings = []; this.bursts = []; this.flash = null;
  }

  /** A Rage move connected at (x, y). moveId is rageKick | rageUppercut | rageAirKick (the Special activation strike uses rageKick numbers). */
  hit(moveId, x, y) {
    const c = F.shake[moveId] ?? F.shake.rageKick, rf = this.reduceFlash();
    if (!(rf && F.reduced.impactBurst === false)) this.bursts.push({ x, y, t: 0, life: c.impactBurst.durationMs, r: c.impactBurst.radius, color: c.impactBurst.color, edge: c.impactBurst.edge });
    const fl = c.flash;
    this.flash = { t: 0, inMs: fl.inMs, outMs: fl.outMs, alpha: rf ? Math.min(fl.alpha, F.reduced.flashAlphaMax) : fl.alpha, color: rf ? F.reduced.flashColor : fl.color };
  }

  /** The Rage hit killed the enemy standing at (x, feetY): loads of dust. */
  killDust(x, feetY) {
    const D = F.killDust, rf = this.reduceFlash(), R = F.reduced;
    const n = Math.round(D.count * (rf ? R.killDustCountScale : 1)), sp = rf ? R.killDustSpeedScale : 1;
    for (let i = 0; i < n && this.parts.length < D.maxActiveParticles; i++) {
      const side = Math.random() < 0.5 ? -1 : 1;
      this.parts.push({
        x: x + rnd(-D.spawnXJitter, D.spawnXJitter), y: feetY + rnd(-D.spawnYJitter, D.spawnYJitter),
        vx: side * rnd(D.speedMin, D.speedMax) * sp * Math.cos((rnd(0, D.spreadDeg / 2) * Math.PI) / 180), vy: -rnd(D.riseSpeedMin, D.riseSpeedMax) * sp,
        r0: rnd(D.radiusMin, D.radiusMax), t: 0, life: rnd(D.lifetimeMinMs, D.lifetimeMaxMs), color: pickWeighted(D.colors, D.colorWeights),
      });
    }
    this.rings.push({ x, y: feetY, t: 0, delay: 0, spec: D.ring, fill: true });
    if (!(rf && !R.killDustSecondaryRing)) this.rings.push({ x, y: feetY, t: 0, delay: D.secondaryRing.delayMs, spec: { ...D.secondaryRing, radiusFrom: D.ring.radiusFrom }, fill: false });
  }

  /** Call every scene update with the real frame delta (ms). */
  tick(dtMs) {
    const D = F.killDust, dt = dtMs / 1000, w = this.world, s = this.screen;
    w.clear(); s.clear();
    for (const b of this.bursts) {
      b.t += dtMs; const k = Math.min(1, b.t / b.life), r = b.r * (0.4 + 0.6 * k), a = 1 - k;
      w.fillStyle(b.edge, 0.7 * a).fillCircle(b.x, b.y, r);
      w.fillStyle(b.color, a).fillCircle(b.x, b.y, r * 0.55);
    }
    this.bursts = this.bursts.filter((b) => b.t < b.life);
    for (const p of this.parts) {
      p.t += dtMs; const k = p.t / p.life; if (k >= 1) continue;
      p.vx *= Math.pow(D.drag, dt); p.vy += D.gravity * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      const a = D.alphaStart * (1 - k) * (1 - k) + D.alphaEnd * k, r = p.r0 * (1 + (D.growTo - 1) * k);
      w.fillStyle(p.color, a).fillCircle(p.x, p.y, r);
    }
    this.parts = this.parts.filter((p) => p.t < p.life);
    for (const g of this.rings) {
      g.t += dtMs; const t = g.t - g.delay; if (t < 0) continue;
      const k = Math.min(1, t / g.spec.durationMs), r = g.spec.radiusFrom + (g.spec.radiusTo - g.spec.radiusFrom) * (1 - (1 - k) * (1 - k)), a = (1 - k);
      if (g.fill) w.fillStyle(g.spec.fillColor, g.spec.fillAlpha * a).fillEllipse(g.x, g.y, r * 2, r * 2 * D.ring.squashY);
      w.lineStyle(g.spec.lineWidth * (1 - 0.5 * k), g.spec.color, g.spec.alphaStart * a).strokeEllipse(g.x, g.y, r * 2, r * 2 * (D.ring.squashY));
    }
    this.rings = this.rings.filter((g) => g.t - g.delay < g.spec.durationMs);
    if (this.flash) {
      const f = this.flash; f.t += dtMs;
      const a = f.t < f.inMs ? f.alpha * (f.t / f.inMs) : f.alpha * Math.max(0, 1 - (f.t - f.inMs) / f.outMs);
      if (a > 0) s.fillStyle(f.color, a).fillRect(0, 0, this.scene.scale.width, this.scene.scale.height); else this.flash = null;
    }
  }

  destroy() { this.world.destroy(); this.screen.destroy(); this.parts = []; this.rings = []; this.bursts = []; this.flash = null; }
}
