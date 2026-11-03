// Railgun Royce's floor effects, drawn with Phaser Graphics (primitives only): Shockwave Slam's red circle and impact ring, Rail Trap's cyan
// marker lines and electrified strips, Taser Burst's red lock-on line and cyan bolt. The Charging Dash's red lane strip is the scene's shared
// charge strip (chargeWarning). Reads the boss' public state each frame (move, cueClockMs, traps, slamSeq), so the picture follows real timing.
import { ROYCE_MOVES } from './royceData.js';

const LANE_TOP = 440, LANE_BOTTOM = 700;      // same lane band as the Mega Stomp fronts (460..680 lane plus a margin)
const CYAN = 0x5fe8ff, WHITE = 0xffffff, RED = 0xd23a2e;
const BOLT_MS = 180;                           // how long the taser bolt is drawn after the shot

export class RoyceFx {
  /** @param {Phaser.Scene} scene @param {{getBosses: () => object[], onSlam?: (boss) => void, reduceFlash?: () => boolean}} o */
  constructor(scene, { getBosses, onSlam = null, reduceFlash = () => false }) {
    this.scene = scene; this.getBosses = getBosses; this.onSlam = onSlam; this.reduceFlash = reduceFlash;
    this.floor = scene.add.graphics().setDepth(LANE_TOP);
    this.top = scene.add.graphics().setDepth(5000);
    this.seen = new Map();   // boss id -> { slamSeq, slamAt, taserSeq, taserAt }
    this.t = 0;
  }

  reset() { this.seen.clear(); this.floor.clear(); this.top.clear(); }
  destroy() { this.floor.destroy(); this.top.destroy(); this.seen.clear(); }

  update(dtMs) {
    this.t += dtMs;
    this.floor.clear(); this.top.clear();
    const flash = !this.reduceFlash();
    for (const b of this.getBosses()) {
      if (!b.traps) continue;
      let s = this.seen.get(b.id);
      if (!s) { s = { slamSeq: b.slamSeq, slamAt: -1e9, taserMove: -1, taserAt: -1e9 }; this.seen.set(b.id, s); }
      this._traps(b, flash);
      if (!b.alive) continue;
      const clock = b.cueClockMs, mv = b.move;
      if (mv && mv.id === 'slam') this._slam(b, s, clock);
      if (mv && mv.id === 'taser') this._taser(b, s, clock, flash);
    }
  }

  _slam(b, s, clock) {
    const m = ROYCE_MOVES.slam, r = m.radiusPx;
    if (b.slamSeq !== s.slamSeq) { s.slamSeq = b.slamSeq; s.slamAt = this.t; if (this.onSlam) this.onSlam(b); }
    if (clock !== null && b.state === 'telegraph') {                     // red circle fills in as the wind-up runs
      const p = b.telegraphProgress;
      this.floor.fillStyle(RED, 0.10 + 0.22 * p).fillEllipse(b.x, b.y, r * 2, r * 0.7);
      this.floor.lineStyle(3, RED, 0.5 + 0.4 * p).strokeEllipse(b.x, b.y, r * 2, r * 0.7);
    }
    const age = this.t - s.slamAt;                                       // impact: a ring that spreads out and fades
    if (age >= 0 && age < 350) {
      const k = age / 350;
      this.floor.lineStyle(5 * (1 - k) + 1, WHITE, 0.8 * (1 - k)).strokeEllipse(b.x, b.y, r * 2 * (0.7 + 0.5 * k), r * 0.7 * (0.7 + 0.5 * k));
      this.floor.fillStyle(CYAN, 0.25 * (1 - k)).fillEllipse(b.x, b.y, r * 2, r * 0.7);
    }
  }

  _taser(b, s, clock, flash) {
    const m = ROYCE_MOVES.taser, h = m.hitbox, dir = b.facing >= 0 ? 1 : -1;
    const x0 = b.x + dir * h.x, x1 = b.x + dir * (h.x + h.w), y = b.y - 50;
    if (b.state === 'telegraph') {                                       // visor locks on: a red line along the shot, tightening
      const p = b.telegraphProgress;
      this.top.lineStyle(2 + 2 * p, RED, 0.25 + 0.5 * p).lineBetween(x0, y, x1, y);
      this.top.fillStyle(RED, 0.4 + 0.5 * p).fillTriangle(x1, y - 8, x1, y + 8, x1 + dir * 14, y);
      return;
    }
    if (b.state === 'attack') {
      const at = m.hits[0].atMs, el = m.attackMs - b.timer;
      if (el >= at) {                                                    // the bolt: zigzag cyan line
        if (s.taserMove !== b.moveSeq) { s.taserMove = b.moveSeq; s.taserAt = this.t; }
        const age = this.t - s.taserAt;
        if (age < BOLT_MS) {
          const a = 1 - age / BOLT_MS, seg = 12;
          const pts = [];
          for (let i = 0; i <= seg; i++) pts.push({ x: x0 + (x1 - x0) * (i / seg), y: y + (i === 0 || i === seg ? 0 : (Math.random() - 0.5) * 22) });
          this.top.lineStyle(flash ? 5 : 3, CYAN, a).strokePoints(pts);
          this.top.lineStyle(2, WHITE, a).strokePoints(pts);
        }
      }
    }
  }

  _traps(b, flash) {
    const top = LANE_TOP + 20, h = LANE_BOTTOM - LANE_TOP - 20;
    for (const tr of b.traps) {
      const x = tr.x - tr.w / 2;
      if (tr.state === 'warn') {                                         // cyan outline pulsing: where it will electrify
        const pulse = 0.35 + 0.35 * Math.abs(Math.sin(this.t / 120));
        this.floor.lineStyle(3, CYAN, pulse).strokeRect(x, top, tr.w, h);
        this.floor.fillStyle(CYAN, 0.06 + 0.06 * pulse).fillRect(x, top, tr.w, h);
        continue;
      }
      const fade = Math.min(1, tr.lifeLeft / 500);                       // fades in its last half second
      this.floor.fillStyle(CYAN, 0.22 * fade).fillRect(x, top, tr.w, h);
      this.floor.lineStyle(3, CYAN, 0.9 * fade).strokeRect(x, top, tr.w, h);
      // crackling arcs: random zigzags across the strip (fewer and calmer under Reduced Flash)
      const arcs = flash ? 4 : 1;
      for (let a = 0; a < arcs; a++) {
        const y0 = top + Math.random() * h, pts = [];
        for (let i = 0; i <= 6; i++) pts.push({ x: x + (tr.w * i) / 6, y: y0 + (Math.random() - 0.5) * 26 });
        this.floor.lineStyle(2, WHITE, 0.8 * fade).strokePoints(pts);
      }
    }
  }
}
