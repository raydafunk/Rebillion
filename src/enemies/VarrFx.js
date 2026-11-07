// "Overseer Halden Varr" effects, Phaser Graphics + one banner text. Reads the boss' public fields every frame (state, move, telegraphProgress, shieldHp,
// shieldSeq, shieldBreakSeq, summonSeq, stance/stanceSeq, tasersSeq, droneSeq/droneLanes/droneTelegraph, collapseSeq, wallsLive, transformSeq, phase), so what
// you see is what hurts. Phase 1: Command Shield bubble (and its break), Command Override call rings, Adaptive Counter glyph. Phase 2: transform flash and
// aura, "RUST PROTOCOL" banner, Breaker Slam circle, taser lane line, Control Pulse sweep, drones with laser lane warnings, Rust Collapse ring and blast,
// electrified walls. Honours reduceFlash (no white flashes, steady glows, no banner pop).
// Callbacks: onCue(name, boss) for sounds (names = keys of VARR_CUES), onShake(ms, intensity), onPhaseChange(boss).
import { VARR_MOVES } from './varrData.js';

const FLOOR_DEPTH = 440;
const TOP_DEPTH = 5000;
const CYAN = 0x4fe3ff, VIOLET = 0xa45cff, RED = 0xd23a2e, AMBER = 0xffa41c, WHITE = 0xffffff, DEEP = 0x2b1646;
const BODY_Y = 70;                  // centre of his body above the feet
const FLASH_MS = 260, SHATTER_MS = 520, CALL_MS = 700, BLAST_MS = 700, LASER_MS = 240, BANNER_MS = 2200;
const TWO_PI = Math.PI * 2;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

export class VarrFx {
  /** @param {Phaser.Scene} scene @param {object} o { getBosses, getXRange, onCue, onShake, onPhaseChange, reduceFlash } */
  constructor(scene, { getBosses, getXRange = () => ({ min: 0, max: 1280 }), onCue = () => {}, onShake = () => {}, onPhaseChange = () => {}, reduceFlash = () => false }) {
    this.scene = scene; this.getBosses = getBosses; this.getXRange = getXRange;
    this.onCue = onCue; this.onShake = onShake; this.onPhaseChange = onPhaseChange; this.reduceFlash = reduceFlash;
    this.floor = scene.add.graphics().setDepth(FLOOR_DEPTH);
    this.top = scene.add.graphics().setDepth(TOP_DEPTH);
    this.banner = scene.add.text(640, 300, '', { fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: '72px', color: '#e0c8ff', stroke: '#1c0b33', strokeThickness: 10, align: 'center' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(TOP_DEPTH + 10).setAlpha(0);
    this.seen = new Map();     // boss id -> per-boss edge tracking
    this.t = 0;
    this.bannerAt = -1e9;
  }

  reset() { this.seen.clear(); this.floor.clear(); this.top.clear(); this.bannerAt = -1e9; this.banner.setAlpha(0); }
  destroy() { this.reset(); this.floor.destroy(); this.top.destroy(); this.banner.destroy(); }

  _state(b) {
    let s = this.seen.get(b.id);
    if (!s) {
      s = {
        shieldSeq: b.shieldSeq, breakSeq: b.shieldBreakSeq, summonSeq: b.summonSeq, stanceSeq: b.stanceSeq, tasersSeq: b.tasersSeq, droneSeq: b.droneSeq,
        transformSeq: b.transformSeq, phase: b.phase, walls: b.wallsLive, moveSeq: b.moveSeq, blastFired: false, shieldMax: 1,
        flashAt: -1e9, shatterAt: -1e9, callAt: -1e9, blastAt: -1e9, laserAt: -1e9, shatterX: 0, shatterY: 0, lanes: [], p2At: -1e9,
      };
      this.seen.set(b.id, s);
    }
    return s;
  }

  update(dtMs) {
    this.t += dtMs;
    this.floor.clear(); this.top.clear();
    const bt = (this.t - this.bannerAt) / BANNER_MS;
    this.banner.setAlpha(bt >= 0 && bt < 1 ? clamp01(Math.min(1, (1 - bt) * 3, bt * 8)) : 0);
    if (bt >= 0 && bt < 1 && !this.reduceFlash()) this.banner.setScale(1 + 0.25 * Math.max(0, 1 - bt * 5));
    for (const b of this.getBosses()) {
      const s = this._state(b);
      this._edges(b, s);
      if (!b.alive) { this._walls(b, s, false); continue; }
      this._phaseAura(b, s);
      this._shield(b, s);
      this._stance(b);
      this._summon(b, s);
      this._slam(b);
      this._taser(b);
      this._pulse(b);
      this._drones(b, s);
      this._collapse(b, s);
      this._walls(b, s, b.wallsLive);
      this._transform(b, s);
    }
  }

  // ---- one-shot events: bump counters on the boss become cues, shakes and timestamps ----
  _edges(b, s) {
    const t = this.t;
    if (b.shieldSeq !== s.shieldSeq) { s.shieldSeq = b.shieldSeq; s.shieldMax = Math.max(1, b.shieldHp); }
    if (b.shieldBreakSeq !== s.breakSeq) { s.breakSeq = b.shieldBreakSeq; s.shatterAt = t; s.shatterX = b.x + b.facing * 44; s.shatterY = b.y - BODY_Y; this.onCue('shieldBreak', b); this.onShake(160, 0.004); }
    if (b.summonSeq !== s.summonSeq) { s.summonSeq = b.summonSeq; s.callAt = t; this.onCue('summon', b); }
    if (b.stanceSeq !== s.stanceSeq) { s.stanceSeq = b.stanceSeq; if (b.stance) this.onCue('counter', b); }
    if (b.tasersSeq !== s.tasersSeq) { s.tasersSeq = b.tasersSeq; s.flashAt = t; this.onCue('taser', b); }
    if (b.droneSeq !== s.droneSeq) { s.droneSeq = b.droneSeq; s.laserAt = t; s.lanes = (b.droneLanes || []).slice(); this.onCue('drones', b); }
    if (b.transformSeq !== s.transformSeq) { s.transformSeq = b.transformSeq; s.flashAt = t; this.onCue('transform', b); this.onShake(500, 0.008); }
    if (b.phase !== s.phase) {
      s.phase = b.phase; s.p2At = t; s.flashAt = t;
      if (b.phase === 2) { this.bannerAt = t; this.banner.setText('PHASE 2\nRUST PROTOCOL'); this.onShake(420, 0.012); this.onPhaseChange(b); }
    }
    if (b.wallsLive !== s.walls) { s.walls = b.wallsLive; if (b.wallsLive) this.onCue('wallZap', b); }
    if (b.moveSeq !== s.moveSeq) {                                   // a move just began its wind-up
      s.moveSeq = b.moveSeq; s.blastFired = false;
      const id = b.move && b.move.id;
      if (id === 'shield') this.onCue('shieldRaise', b);
      else if (id === 'control') this.onCue('pulse', b);
      else if (id === 'collapse') this.onCue('collapseCharge', b);
      else if (id === 'combo') this.onCue('combo', b);
    }
    if (b.state === 'attack' && b.move) {
      const id = b.move.id, elapsed = b.move.attackMs - b.timer;
      if (id === 'slam' && !s.blastFired && elapsed >= b.move.hits[0].atMs) { s.blastFired = true; s.blastAt = t; this.onCue('slam', b); this.onShake(200, 0.006); }
      if (id === 'collapse' && !s.blastFired && elapsed >= b.move.hits[0].atMs) { s.blastFired = true; s.blastAt = t; this.onCue('collapseBlast', b); this.onShake(560, this.reduceFlash() ? 0.01 : 0.02); }
      if (id === 'control' && !s.blastFired && elapsed >= b.move.hits[0].atMs) { s.blastFired = true; s.blastAt = t; }
    }
  }

  _bodyY(b) { return b.y - BODY_Y * (b.visualScale || 1); }

  _phaseAura(b, s) {                                                 // faint violet core glow in phase 2, red once relentless
    if (b.phase !== 2 || b.state === 'transform') return;
    const base = b.relentless ? 0.2 : 0.12, pulse = this.reduceFlash() ? 0 : 0.06 * Math.sin(this.t / 170);
    this.top.fillStyle(b.relentless ? RED : VIOLET, Math.max(0, base + pulse)).fillEllipse(b.x, this._bodyY(b), 64, 118);
    if (!this.reduceFlash() && this.t - s.p2At < 500) this.top.fillStyle(WHITE, 0.35 * (1 - (this.t - s.p2At) / 500)).fillEllipse(b.x, this._bodyY(b), 120, 160);
  }

  _transform(b, s) {                                                 // rebuild: violet column, rising sparks, a growing ring
    if (b.state !== 'transform') return;
    const total = b.data.transformMs, p = clamp01(1 - b.timer / total), cx = b.x, cy = this._bodyY(b);
    const pulse = this.reduceFlash() ? 0.5 : 0.5 + 0.5 * Math.sin(this.t / 90);
    this.top.fillStyle(VIOLET, 0.18 + 0.2 * pulse).fillEllipse(cx, cy, 90 + 60 * p, 150 + 40 * p);
    this.floor.lineStyle(4, VIOLET, 0.8 * (1 - p * 0.4)).strokeEllipse(cx, b.y, 120 + 520 * p, 40 + 140 * p);
    this.floor.fillStyle(DEEP, 0.3).fillEllipse(cx, b.y, 140 + 300 * p, 46 + 70 * p);
    for (let i = 0; i < 9; i++) {                                    // sparks drifting up the body
      const ph = ((this.t / 900) + i / 9) % 1, x = cx + Math.sin(i * 12.9) * 36;
      this.top.fillStyle(i % 2 ? CYAN : VIOLET, 0.8 * (1 - ph)).fillRect(x - 2, b.y - 20 - ph * 150, 4, 10);
    }
    if (b.hp !== undefined && b._restored && !this.reduceFlash() && this.t - s.flashAt < FLASH_MS) this.top.fillStyle(WHITE, 0.25).fillEllipse(cx, cy, 200, 240);
  }

  _shield(b, s) {                                                    // bubble in front of him: shrinks and reddens as it takes damage; shards when it breaks
    const t = this.t, f = b.facing >= 0 ? 1 : -1, cx = b.x + f * 44, cy = b.y - BODY_Y;
    if (b.state === 'telegraph' && b.move && b.move.id === 'shield') {
      const p = Math.max(b.telegraphProgress, 0.1);
      this.top.lineStyle(3, CYAN, 0.3 + 0.5 * p).strokeEllipse(cx, cy, 80 * p, 120 * p);
    } else if (b.shieldHp > 0) {
      const share = clamp01(b.shieldHp / s.shieldMax), pulse = this.reduceFlash() ? 0 : 0.06 * Math.sin(t / 110);
      const col = share > 0.4 ? CYAN : AMBER;
      this.top.fillStyle(col, 0.16 + 0.12 * share + pulse).fillEllipse(cx, cy, 86, 128);
      this.top.lineStyle(4, col, 0.7 + pulse).strokeEllipse(cx, cy, 86, 128);
      this.top.lineStyle(2, WHITE, 0.25).strokeEllipse(cx, cy, 70, 108);
      this.top.fillStyle(col, 0.5).fillRect(b.x - 30, b.y - 150, 60 * share, 5);   // remaining shield strength
    }
    const age = t - s.shatterAt;
    if (age >= 0 && age < SHATTER_MS) {
      const p = age / SHATTER_MS;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TWO_PI, d = 20 + 90 * p, x = s.shatterX + Math.cos(a) * d * 0.8, y = s.shatterY + Math.sin(a) * d;
        this.top.fillStyle(i % 2 ? CYAN : WHITE, 0.9 * (1 - p)).fillTriangle(x, y, x + 8, y + 4, x + 2, y + 10);
      }
      this.top.lineStyle(3, CYAN, 0.7 * (1 - p)).strokeEllipse(s.shatterX, s.shatterY, 90 + 180 * p, 130 + 180 * p);
    }
  }

  _stance(b) {                                                       // Adaptive Counter: a glyph above his head says what he has read (up arrow, forward chevrons, shield dots)
    if (!b.stance || b.phase !== 1) return;
    const x = b.x, y = b.y - 150 * (b.visualScale || 1) / 1.3 - 10, f = b.facing >= 0 ? 1 : -1, a = 0.6 + (this.reduceFlash() ? 0 : 0.25 * Math.sin(this.t / 140));
    this.top.fillStyle(AMBER, a);
    if (b.stance === 'anti-air') this.top.fillTriangle(x, y - 12, x - 10, y + 6, x + 10, y + 6);
    else if (b.stance === 'anti-rush') { this.top.fillTriangle(x - f * 4 + f * 12, y, x - f * 4, y - 9, x - f * 4, y + 9); this.top.fillTriangle(x + f * 12 + f * 8, y, x + f * 8, y - 9, x + f * 8, y + 9); }
    else { this.top.fillCircle(x - 10, y, 4); this.top.fillCircle(x, y, 4); this.top.fillCircle(x + 10, y, 4); }
  }

  _summon(b, s) {                                                    // Command Override: amber ring grows over his raised hand, then a call ring bursts out
    if (b.state === 'telegraph' && b.move && b.move.id === 'override') {
      const p = Math.max(b.telegraphProgress, 0.1), x = b.x, y = this._bodyY(b) - 40;
      this.top.lineStyle(3, AMBER, 0.4 + 0.5 * p).strokeCircle(x, y, 8 + 34 * p);
      this.top.fillStyle(AMBER, 0.1 + 0.25 * p).fillCircle(x, y, 6 + 20 * p);
    }
    const age = this.t - s.callAt;
    if (age >= 0 && age < CALL_MS) {
      const p = age / CALL_MS;
      this.floor.lineStyle(5, AMBER, 0.8 * (1 - p)).strokeEllipse(b.x, b.y, 160 + 600 * p, 50 + 160 * p);
      this.top.lineStyle(3, AMBER, 0.6 * (1 - p)).strokeCircle(b.x, this._bodyY(b) - 40, 20 + 80 * p);
    }
  }

  _slam(b) {                                                         // Breaker Slam: the ground circle that will be hit fills as the wind-up runs, then locks bright
    if (!b.move || b.move.id !== 'slam' || (b.state !== 'telegraph' && b.state !== 'attack')) return;
    const box = b.attackHitbox(), cx = box.x + box.w / 2, p = b.state === 'telegraph' ? b.telegraphProgress : 1, hit = b.state === 'attack';
    this.floor.fillStyle(hit ? WHITE : RED, hit ? 0.22 : 0.08 + 0.2 * p).fillEllipse(cx, b.y, box.w, 54);
    this.floor.fillStyle(RED, 0.12 + 0.22 * p).fillEllipse(cx, b.y, box.w * p, 54 * p);
    this.floor.lineStyle(3, hit ? WHITE : RED, 0.5 + 0.4 * p).strokeEllipse(cx, b.y, box.w, 54);
  }

  _taser(b) {                                                        // Taser Shot: a thin cyan line down his lane that brightens until he fires
    const m = b.move;
    if (!m || m.id !== 'taser' || b.state !== 'telegraph') return;
    const f = b.facing >= 0 ? 1 : -1, x0 = b.x + f * 44, x1 = x0 + f * Math.min(m.shot.maxDist, 800), p = b.telegraphProgress;
    const range = this.getXRange(), end = Math.max(range.min, Math.min(range.max, x1));
    this.floor.lineStyle(2 + 2 * p, CYAN, 0.25 + 0.6 * p).lineBetween(x0, b.y - 6, end, b.y - 6);
    this.floor.fillStyle(CYAN, 0.15 + 0.4 * p).fillCircle(x0, b.y - 68, 4 + 8 * p);
  }

  _pulse(b) {                                                        // Control Pulse: wide frontal wedge fills, then a violet sweep rolls outward
    const m = b.move;
    if (!m || m.id !== 'control' || (b.state !== 'telegraph' && b.state !== 'attack')) return;
    const f = b.facing >= 0 ? 1 : -1, w = m.hitbox.w, hit = b.state === 'attack';
    const p = hit ? clamp01(1 - b.timer / m.attackMs) : b.telegraphProgress;
    const x0 = b.x, y0 = b.y;
    if (!hit) {
      this.floor.fillStyle(VIOLET, 0.08 + 0.18 * p).fillTriangle(x0, y0 - 8, x0 + f * w, y0 - 42, x0 + f * w, y0 + 42);
      this.floor.lineStyle(2, VIOLET, 0.4 + 0.5 * p).strokeTriangle(x0, y0 - 8, x0 + f * w, y0 - 42, x0 + f * w, y0 + 42);
    } else {
      const r = w * p;                                                // sweep front
      this.floor.fillStyle(VIOLET, 0.22 * (1 - p * 0.5)).fillTriangle(x0, y0 - 8, x0 + f * w, y0 - 42, x0 + f * w, y0 + 42);
      this.floor.lineStyle(6, WHITE, this.reduceFlash() ? 0.4 : 0.8 * (1 - p)).lineBetween(x0 + f * r, y0 - 40 * p - 6, x0 + f * r, y0 + 40 * p + 6);
      this.top.lineStyle(3, VIOLET, 0.7 * (1 - p)).strokeEllipse(x0 + f * r * 0.5, this._bodyY(b), r, 90);
    }
  }

  _drones(b, s) {
    const m = b.move, tele = b.droneTelegraph, t = this.t;
    const active = !!m && m.id === 'drones' && (b.state === 'telegraph' || b.state === 'attack');
    if (active) {                                                    // three drones orbit overhead while he commands them
      const range = this.getXRange(), cx = (range.min + range.max) / 2, p = b.state === 'telegraph' ? b.telegraphProgress : 1;
      for (let i = 0; i < 3; i++) {
        const a = t / 600 + (i / 3) * TWO_PI, x = b.x + Math.cos(a) * 110, y = b.y - 190 + Math.sin(a * 1.3) * 22;
        this.top.fillStyle(0x24202e, 0.95).fillEllipse(x, y, 26, 12);
        this.top.fillStyle(CYAN, 0.4 + 0.5 * p).fillCircle(x, y + 2, 4);
        this.top.lineStyle(1, CYAN, 0.3 * p).lineBetween(x, y, b.x, this._bodyY(b) - 30);
      }
      void cx;
    }
    if (tele) {                                                      // warning lines on the lanes the next beat fires along (Zed: slip between them)
      const range = this.getXRange(), f = b.facing >= 0 ? 1 : -1, x1 = f > 0 ? range.max : range.min;
      const p = b.state === 'telegraph' ? b.telegraphProgress : 0.6;
      for (const ly of tele.lanes) {
        this.floor.lineStyle(2, RED, 0.2 + 0.4 * p).lineBetween(b.x, ly, x1, ly);
        this.floor.fillStyle(RED, 0.3 + 0.4 * p).fillCircle(b.x + f * 30, ly, 4);
      }
    }
    const age = t - s.laserAt;
    if (age >= 0 && age < LASER_MS && s.lanes.length) {              // the fired beat: bright beams
      const range = this.getXRange(), f = b.facing >= 0 ? 1 : -1, x1 = f > 0 ? range.max : range.min, a = 1 - age / LASER_MS;
      for (const ly of s.lanes) {
        this.floor.lineStyle(6, CYAN, 0.35 * a).lineBetween(b.x, ly, x1, ly);
        this.floor.lineStyle(2, this.reduceFlash() ? CYAN : WHITE, 0.8 * a).lineBetween(b.x, ly, x1, ly);
      }
    }
  }

  _collapse(b, s) {                                                  // Rust Collapse: overload ring grows around him (jump it), then the blast ring races out
    const m = b.move;
    if (m && m.id === 'collapse' && b.state === 'telegraph') {
      const p = b.telegraphProgress, reach = Math.abs(m.hitbox.x), pulse = this.reduceFlash() ? 0 : 0.25 * Math.sin(this.t / (140 - 90 * p));
      this.floor.fillStyle(RED, 0.06 + 0.16 * p).fillEllipse(b.x, b.y, reach * 2, 90);
      this.floor.lineStyle(4, RED, 0.45 + 0.4 * p + pulse).strokeEllipse(b.x, b.y, reach * 2 * p, 90 * p);
      this.floor.lineStyle(2, RED, 0.35).strokeEllipse(b.x, b.y, reach * 2, 90);
      this.top.fillStyle(RED, 0.15 + 0.3 * p + pulse * 0.5).fillEllipse(b.x, this._bodyY(b), 70 + 50 * p, 120 + 40 * p);
    }
    const age = this.t - s.blastAt;
    if (age >= 0 && age < BLAST_MS && m && m.id === 'collapse' && s.blastFired) {
      const p = age / BLAST_MS, r = Math.abs(VARR_MOVES.collapse.hitbox.x) * p;
      this.floor.fillStyle(RED, 0.3 * (1 - p)).fillEllipse(b.x, b.y, r * 2, 80 + 60 * p);
      this.floor.lineStyle(8 * (1 - p) + 2, this.reduceFlash() ? RED : WHITE, 0.85 * (1 - p)).strokeEllipse(b.x, b.y, r * 2, 80 + 60 * p);
      if (!this.reduceFlash() && age < 120) this.top.fillStyle(WHITE, 0.3 * (1 - age / 120)).fillRect(b.x - 640, b.y - 260, 1280, 300);
    }
  }

  _walls(b, s, live) {                                               // electrified arena walls after Rust Collapse: crackling columns at both edges
    if (!live) return;
    const r = this.getXRange(), edge = b.data.relentless.wallEdgePx, t = this.t, y0 = 380, y1 = 740;
    for (const [x, dir] of [[r.min, 1], [r.max, -1]]) {
      this.floor.fillStyle(CYAN, 0.08 + (this.reduceFlash() ? 0 : 0.04 * Math.sin(t / 90))).fillRect(dir > 0 ? x : x - edge, y0, edge, y1 - y0);
      this.floor.lineStyle(3, CYAN, 0.7).lineBetween(x, y0, x, y1);
      if (this.reduceFlash()) continue;                              // steady glow only, no crackle
      let px = x, py = y0;
      const seed = Math.floor(t / 80);
      for (let i = 1; i <= 8; i++) {
        const nx = x + dir * (Math.sin(seed * 7.1 + i * 3.3) * 14 + 6), ny = y0 + ((y1 - y0) * i) / 8;
        this.floor.lineStyle(2, WHITE, 0.55).lineBetween(px, py, nx, ny);
        px = nx; py = ny;
      }
    }
    void s;
  }
}
