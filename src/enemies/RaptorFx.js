// "Raptor" effects, Phaser Graphics only: the red ground marker (Dive Kick circle, Falcon Drop shadow that grows until it locks), landing dust, and a ring when he goes FRENZIED. Reads the boss' public fields
// each frame (marker, impactSeq/impact, phase2Seq). Honours reduceFlash (no white flashes, calmer pulses).
const FLOOR_DEPTH = 440;
const RED = 0xd23a2e, WHITE = 0xffffff, DUST = 0xb9a58c;
const DUST_MS = 420, RING_MS = 600;
const SLAM_MS = 1500, CRACK_COUNT = 11, CHIPS = 18;   // Falcon Drop: ground cracks that fade slowly, three shock rings, flying chips

export class RaptorFx {
  /** @param {Phaser.Scene} scene @param {{getBosses: () => object[], onSlam?: (boss) => void, reduceFlash?: () => boolean}} o */
  constructor(scene, { getBosses, onSlam = () => {}, reduceFlash = () => false }) {
    this.scene = scene; this.getBosses = getBosses; this.onSlam = onSlam; this.reduceFlash = reduceFlash;
    this.floor = scene.add.graphics().setDepth(FLOOR_DEPTH);
    this.top = scene.add.graphics().setDepth(5000);
    this.seen = new Map();   // boss id -> { impactSeq, phase2Seq }
    this.dust = [];          // { x, y, kind, at }
    this.rings = [];         // { id, at }
    this.slams = [];         // Falcon Drop impacts: { x, y, at, cracks:[[angle,len,kinks]], chips:[{vx,vy,s}] }
    this.sparks = [];        // blocked hits: { id, at }
    this.t = 0;
  }

  reset() { this.seen.clear(); this.dust.length = 0; this.rings.length = 0; this.slams.length = 0; this.sparks.length = 0; this.floor.clear(); this.top.clear(); }
  destroy() { this.reset(); this.floor.destroy(); this.top.destroy(); }

  update(dtMs) {
    this.t += dtMs;
    this.floor.clear(); this.top.clear();
    for (const b of this.getBosses()) {
      let s = this.seen.get(b.id);
      if (!s) { s = { impactSeq: b.impactSeq, phase2Seq: b.phase2Seq, guardHitSeq: b.guardHitSeq }; this.seen.set(b.id, s); }
      if (b.impactSeq !== s.impactSeq) {
        s.impactSeq = b.impactSeq;
        if (b.impact) { this.dust.push({ x: b.impact.x, y: b.impact.y, kind: b.impact.kind, at: this.t }); if (b.impact.kind === 'falcon') this._slam(b.impact); this.onSlam(b, b.impact.kind); }
      }
      if (b.phase2Seq !== s.phase2Seq) { s.phase2Seq = b.phase2Seq; this.rings.push({ id: b.id, at: this.t }); }
      if (b.guardHitSeq !== undefined && b.guardHitSeq !== s.guardHitSeq) { this.sparks.push({ id: b.id, at: this.t }); s.guardHitSeq = b.guardHitSeq; }
      if (!b.alive) continue;
      if (b.state === 'block') this._guard(b);
      if (b.marker) this._marker(b.marker);
      if (b.move && b.move.id === 'rush') this._rush(b);
    }
    this._sparks();
    this._dust();
    this._rings();
    this._slams();
  }

  _marker(m) {                                                         // red circle on the ground; Falcon Drop's is a shadow that swells, solid once locked
    const falcon = m.kind === 'falcon', r = m.radius * (falcon ? 0.35 + 0.65 * m.grow : 1);
    const a = m.locked ? 0.55 : 0.2 + 0.25 * m.grow;
    this.floor.fillStyle(falcon ? 0x000000 : RED, falcon ? a * 0.9 : a * 0.45).fillEllipse(m.x, m.y, r * 2, r * 0.8);
    this.floor.lineStyle(m.locked ? 4 : 2, RED, m.locked ? 0.95 : 0.6).strokeEllipse(m.x, m.y, r * 2, r * 0.8);
    if (m.locked && !this.reduceFlash() && Math.floor(this.t / 90) % 2 === 0) this.floor.lineStyle(2, WHITE, 0.5).strokeEllipse(m.x, m.y, r * 2 + 8, r * 0.8 + 4);
  }

  _rush(b) {   // 6-Hit Charge: red chevrons on the floor pointing at Zed while he winds up, speed streaks behind him while he runs
    const calm = this.reduceFlash(), f = b.facing >= 0 ? 1 : -1;
    if (b.state === 'telegraph') {
      const p = b.telegraphProgress, a = calm ? 0.6 : 0.4 + 0.4 * (Math.floor(this.t / 70) % 2);
      for (let i = 0; i < 3; i++) {
        const x = b.x + f * (50 + i * 36), h = 16 + i * 4;
        this.floor.lineStyle(4, RED, a * (0.5 + 0.5 * p)).beginPath().moveTo(x - f * 10, b.y - h * 0.5).lineTo(x + f * 10, b.y).lineTo(x - f * 10, b.y + h * 0.5).strokePath();
      }
    } else if (b.state === 'attack' && b.running) {
      for (let i = 0; i < 4; i++) {
        const y = b.y - 20 - i * 18, x = b.x - f * (30 + i * 8);
        this.floor.lineStyle(3, calm ? DUST : WHITE, calm ? 0.35 : 0.55 - i * 0.1).beginPath().moveTo(x, y).lineTo(x - f * (46 + i * 10), y).strokePath();
      }
    }
  }

  _guard(b) {   // BLOCK: a pale arc in front of him while the guard is up (steady under reduceFlash)
    const f = b.facing >= 0 ? 1 : -1, calm = this.reduceFlash(), a = calm ? 0.5 : 0.45 + 0.2 * Math.sin(this.t / 90);
    const c = f > 0 ? 0 : Math.PI;
    this.top.lineStyle(4, 0x9fd0ff, a).beginPath().arc(b.x + f * 14, b.y - 48, 62, c - 1, c + 1, false).strokePath();
  }

  _sparks() {   // a hit absorbed by the guard: short bright flash line in front of him
    this.sparks = this.sparks.filter((s) => this.t - s.at < 180);
    const boss = new Map(this.getBosses().map((b) => [b.id, b]));
    for (const s of this.sparks) {
      const b = boss.get(s.id); if (!b) continue;
      const k = (this.t - s.at) / 180, f = b.facing >= 0 ? 1 : -1, calm = this.reduceFlash();
      this.top.lineStyle(calm ? 3 : 6 * (1 - k) + 2, calm ? 0x9fd0ff : WHITE, 0.9 * (1 - k)).beginPath().moveTo(b.x + f * 36, b.y - 92).lineTo(b.x + f * 36, b.y - 12).strokePath();
      if (!calm) for (let i = -1; i <= 1; i++) this.top.lineStyle(2, WHITE, 0.8 * (1 - k)).beginPath().moveTo(b.x + f * 40, b.y - 52).lineTo(b.x + f * (54 + 22 * k), b.y - 52 + i * 18 * (0.4 + k)).strokePath();
    }
  }

  _slam(im) {   // Falcon Drop touchdown: random radial cracks and flying chips
    const cracks = Array.from({ length: CRACK_COUNT }, (_, i) => [(i / CRACK_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.4, 90 + Math.random() * 190, 2 + Math.floor(Math.random() * 3)]);
    const chips = Array.from({ length: CHIPS }, () => ({ vx: (Math.random() - 0.5) * 520, vy: -(160 + Math.random() * 380), s: 3 + Math.random() * 4 }));
    this.slams.push({ x: im.x, y: im.y, at: this.t, cracks, chips });
  }

  _slams() {
    this.slams = this.slams.filter((m) => this.t - m.at < SLAM_MS);
    const calm = this.reduceFlash();
    for (const m of this.slams) {
      const age = this.t - m.at, k = age / SLAM_MS;
      for (const [ang, len, kinks] of m.cracks) {                      // cracks open fast, fade slowly (squashed to the floor plane)
        const grow = Math.min(1, age / 140), a = 0.85 * (1 - k * k);
        let px = m.x, py = m.y; this.floor.lineStyle(3, 0x1b1410, a);
        this.floor.beginPath().moveTo(px, py);
        for (let j = 1; j <= kinks; j++) {
          const r = (len * grow * j) / kinks, jig = Math.sin(ang * 7 + j * 2.3) * 0.35;
          px = m.x + Math.cos(ang + jig) * r; py = m.y + Math.sin(ang + jig) * r * 0.4;
          this.floor.lineTo(px, py);
        }
        this.floor.strokePath();
      }
      for (let i = 0; i < (calm ? 1 : 3); i++) {                        // three staggered shock rings
        const ra = age - i * 110; if (ra < 0 || ra > 700) continue;
        const rk = ra / 700, w = 560 * rk + 40;
        this.floor.lineStyle(7 * (1 - rk) + 1, i === 0 && !calm ? WHITE : DUST, 0.75 * (1 - rk)).strokeEllipse(m.x, m.y, w, w * 0.38);
      }
      if (age < 700) {                                                  // chips of floor thrown up and back down
        const t = age / 1000;
        for (const c of m.chips) {
          const cx = m.x + c.vx * t, cy = m.y + c.vy * t + 1100 * t * t * 0.5;
          if (cy > m.y + 6) continue;
          this.top.fillStyle(0x4a3a2c, 1 - age / 700).fillRect(cx, cy, c.s, c.s);
        }
      }
    }
  }

  _dust() {
    this.dust = this.dust.filter((d) => this.t - d.at < DUST_MS);
    for (const d of this.dust) {
      const k = (this.t - d.at) / DUST_MS, big = d.kind === 'falcon';
      this.floor.lineStyle(3 * (1 - k) + 1, DUST, 0.7 * (1 - k)).strokeEllipse(d.x, d.y, (big ? 260 : 150) * k + 30, (big ? 260 : 150) * k * 0.4 + 10);
      this.floor.fillStyle(DUST, 0.35 * (1 - k)).fillEllipse(d.x, d.y - 6 - 20 * k, 60 + 60 * k, 30 + 20 * k);
    }
  }

  _rings() {
    this.rings = this.rings.filter((r) => this.t - r.at < RING_MS);
    const boss = new Map(this.getBosses().map((b) => [b.id, b]));
    for (const r of this.rings) {
      const b = boss.get(r.id);
      if (!b) continue;
      const k = (this.t - r.at) / RING_MS;
      this.top.lineStyle(4 * (1 - k) + 1, RED, 0.8 * (1 - k)).strokeEllipse(b.x, b.y - 40, 80 + 160 * k, 110 + 60 * k);
    }
  }
}
