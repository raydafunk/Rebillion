// "Glitch" effects, Phaser Graphics + the decoy's own sprites: Shock Disk Throw's red line of flight, Drone Barrage's red lane ticks and pack
// blinks, Hologram Duplicate's shimmering decoys (a cyan ghost of him that throws a weak uppercut), Data Spike's cyan floor line, Emergency
// Teleport's static flash at the origin and the arrival. Reads the boss' public state each frame (move, telegraphProgress, decoys, teleportSeq).
import { GLITCH_MOVES } from './glitchData.js';
import { glitchAnimKey, glitchRotationKey, GLITCH_ANIMS, GLITCH_PUNCH_MS, glitchFitScale } from './glitchSprites.js';

const LANE_TOP = 440;
const RED = 0xd23a2e, CYAN = 0x4fe3ff, WHITE = 0xffffff;
const FLASH_MS = 380;
const PUNCH_AT_MS = 900 - 360;          // the punch clip starts this long into the strike so its last frames meet the hit (hit at 900 ms)

export class GlitchFx {
  /** @param {Phaser.Scene} scene @param {{getBosses: () => object[], getScale: (boss) => number, getFeetFrac: (key) => number, reduceFlash?: () => boolean}} o */
  constructor(scene, { getBosses, getScale, getFeetFrac, reduceFlash = () => false }) {
    this.scene = scene; this.getBosses = getBosses; this.getScale = getScale; this.getFeetFrac = getFeetFrac; this.reduceFlash = reduceFlash;
    this.floor = scene.add.graphics().setDepth(LANE_TOP);
    this.top = scene.add.graphics().setDepth(5000);
    this.seen = new Map();     // boss id -> { teleportSeq, flashAt }
    this.ghosts = new Map();   // "<boss>/<decoy>" -> { sprite, punched }
    this.t = 0;
  }

  reset() { this.seen.clear(); this.floor.clear(); this.top.clear(); this._dropGhosts(() => true); }
  destroy() { this.reset(); this.floor.destroy(); this.top.destroy(); }

  _dropGhosts(pred) { for (const [k, g] of [...this.ghosts]) if (pred(k)) { g.sprite.destroy(); this.ghosts.delete(k); } }

  update(dtMs) {
    this.t += dtMs;
    this.floor.clear(); this.top.clear();
    const live = new Set();
    for (const b of this.getBosses()) {
      let s = this.seen.get(b.id);
      if (!s) { s = { teleportSeq: b.teleportSeq, flashAt: -1e9, fromX: b.x, fromY: b.y }; this.seen.set(b.id, s); }
      for (const dc of b.decoys) live.add(`${b.id}/${dc.id}`);
      this._decoys(b);
      if (!b.alive) continue;
      if (b.teleportSeq !== s.teleportSeq) { s.teleportSeq = b.teleportSeq; s.flashAt = this.t; s.fromX = b.teleportFrom.x; s.fromY = b.teleportFrom.y; }
      this._teleportFlash(b, s);
      const mv = b.move;
      if (!mv || b.state !== 'telegraph') continue;
      if (mv.id === 'disk') this._disk(b);
      if (mv.id === 'drones') this._drones(b);
      if (mv.id === 'spike') this._spike(b);
      if (mv.id === 'teleport') this._teleportWarn(b);
    }
    this._dropGhosts((k) => !live.has(k));
  }

  _disk(b) {                                                           // red line of flight along his lane, tightening as the disk spins up
    const dir = b.facing >= 0 ? 1 : -1, p = b.telegraphProgress, m = GLITCH_MOVES.disk.shot;
    const y = b.y - 56, x0 = b.x + dir * 36, x1 = b.x + dir * (36 + Math.min(m.maxDist, 620));
    this.top.lineStyle(2 + 2 * p, RED, 0.2 + 0.5 * p).lineBetween(x0, y, x1, y);
    this.top.fillStyle(RED, 0.4 + 0.5 * p).fillCircle(x0, y, 5 + 4 * p);
  }

  _drones(b) {                                                         // the pack lights blink red and a tick marks each drone's lane
    const dir = b.facing >= 0 ? 1 : -1, p = b.telegraphProgress, blink = Math.floor(p * 8) % 2 === 0;
    this.top.fillStyle(blink ? RED : CYAN, 0.9).fillCircle(b.x - dir * 14, b.y - 96, 4);
    const t = b.target;
    if (!t) return;
    const offs = b.phase2 ? GLITCH_MOVES.drones.laneOffsetsP2 : GLITCH_MOVES.drones.laneOffsets;
    for (const o of offs) {
      const y = Math.min(700, Math.max(440, t.y + o));
      this.floor.lineStyle(2, RED, 0.12 + 0.35 * p).lineBetween(b.x + dir * 40, y - 20, b.x + dir * 700, y - 20);
    }
  }

  _spike(b) {                                                          // cyan line draws along the floor before the spike runs along it
    const m = GLITCH_MOVES.spike, dir = b.facing >= 0 ? 1 : -1, p = b.telegraphProgress;
    const reach = (b.phase2 ? m.hitboxFar.x + m.hitboxFar.w : m.hitbox.x + m.hitbox.w) * Math.min(1, p * 1.4);
    this.floor.lineStyle(4, CYAN, 0.35 + 0.5 * p).lineBetween(b.x + dir * m.hitbox.x, b.y - 4, b.x + dir * (m.hitbox.x + reach), b.y - 4);
    this.floor.fillStyle(CYAN, 0.08 + 0.16 * p).fillRect(Math.min(b.x + dir * m.hitbox.x, b.x + dir * (m.hitbox.x + reach)), b.y - 26, Math.abs(reach), 30);
  }

  _teleportWarn(b) {                                                   // mask static: flickering cyan bars on his body
    const p = b.telegraphProgress, n = this.reduceFlash() ? 2 : 5;
    for (let i = 0; i < n; i++) {
      const k = (p * 6 + i / n) % 1;
      this.top.fillStyle(CYAN, 0.2 + 0.5 * p).fillRect(b.x - 24 + (i % 2) * 6, b.y - 100 + k * 100, 36, 3);
    }
  }

  _teleportFlash(b, s) {                                               // a cyan burst where he left and where he lands
    const age = this.t - s.flashAt;
    if (age < 0 || age >= FLASH_MS) return;
    const k = age / FLASH_MS, a = 0.7 * (1 - k);
    for (const [x, y] of [[s.fromX, s.fromY], [b.x, b.y]]) {
      this.top.lineStyle(4 * (1 - k) + 1, CYAN, a).strokeEllipse(x, y - 45, 70 + 90 * k, 110 - 30 * k);
      if (!this.reduceFlash()) this.top.fillStyle(WHITE, 0.35 * (1 - k)).fillRect(x - 24, y - 100, 48, 100);
    }
  }

  _decoys(b) {                                                         // each decoy is a cyan ghost of him: it flickers in, then throws its uppercut
    for (const dc of b.decoys) {
      const key = `${b.id}/${dc.id}`;
      let g = this.ghosts.get(key);
      const face = dc.facing < 0 ? 'west' : 'east';
      if (!g) {
        const sprite = this.scene.add.sprite(dc.x, dc.y, glitchRotationKey(face)).setTint(CYAN).setAlpha(0);
        g = { sprite, born: this.t, punched: false };
        this.ghosts.set(key, g);
      }
      const sp = g.sprite;
      sp.setPosition(dc.x, dc.y).setDepth(dc.y).setScale(this.getScale(b));
      const age = this.t - g.born;
      const flicker = dc.state === 'warn' ? 0.25 + 0.3 * Math.abs(Math.sin(age / 40)) : 0.6;     // its outline wobbles: that is how you tell it from the real one
      sp.setAlpha(Math.min(1, age / 200) * flicker * (dc.lifeLeft < 300 ? Math.max(0, dc.lifeLeft / 300) : 1));
      sp.setFlipX(false);
      if (dc.state === 'live' && !g.punched && this.scene.anims.exists(glitchAnimKey('punch', face))) {
        g.liveAt = g.liveAt ?? this.t;
        if (this.t - g.liveAt >= PUNCH_AT_MS) { g.punched = true; sp.play(glitchAnimKey('punch', face)); sp.anims.timeScale = glitchFitScale('punch', GLITCH_PUNCH_MS); }
      } else if (!g.punched) {
        sp.setTexture(glitchRotationKey(face));
      }
      const tex = sp.texture.key;
      sp.setOrigin(0.5, this.getFeetFrac(tex));
    }
  }
}
