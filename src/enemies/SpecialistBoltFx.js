// Draws the Copper Fang Taser volley so it reads as a gun being fired: a muzzle flash and spark burst where each bolt leaves, the dart
// sprite (projectile_state art) flying along the lane with a short fading wire trail, and a small impact spark when it ends. Reads the
// bolts EnemyManager keeps in flight; no gameplay state is written here.
import { SPECIALIST_RANGED } from './specialistRanged.js';
import { SPECIALIST_BOLT_FRAMES, specialistBoltAnimKey, specialistBoltFrameKey } from './specialistData.js';

const CYAN = 0x5fe8ff, WHITE = 0xffffff, YELLOW = 0xffe94d;
const FLASH_MS = 110, SPARK_MS = 160, TRAIL_PX = 54;
const B = SPECIALIST_RANGED.bolt;
const MUZZLE_Y = B.muzzle.y;                                  // where the rifle tip is drawn
const HIT_Y = B.hitbox.y + B.hitbox.h / 2;                    // where the bolt actually hits (chest height)
const EASE_PX = 170;                                          // the dart drops from the muzzle to the hit line over this much travel
const visualY = (b) => b.y + MUZZLE_Y + (HIT_Y - MUZZLE_Y) * Math.min(1, b.travelled / EASE_PX);

export class SpecialistBoltFx {
  /** @param {Phaser.Scene} scene @param {{getBolts: () => object[], reduceFlash?: () => boolean, scale?: number}} o */
  constructor(scene, { getBolts, reduceFlash = () => false, scale = 1 }) {
    this.scene = scene; this.getBolts = getBolts; this.reduceFlash = reduceFlash; this.scale = scale;
    this.sprites = new Map();   // bolt id -> Phaser.GameObjects.Sprite
    this.bursts = [];           // { x, y, dir, t, kind }
    this.g = scene.add.graphics().setDepth(4900);
  }

  reset() { for (const s of this.sprites.values()) s.destroy(); this.sprites.clear(); this.bursts.length = 0; this.g.clear(); }
  destroy() { this.reset(); this.g.destroy(); }

  update(dtMs) {
    const live = new Set();
    for (const b of this.getBolts()) {
      live.add(b.id);
      let s = this.sprites.get(b.id);
      if (!s) { s = this._spawn(b); if (!s) continue; this.sprites.set(b.id, s); this.bursts.push({ x: b.x, y: b.y + MUZZLE_Y, dir: b.facing, t: 0, kind: 'muzzle' }); }
      s.setPosition(b.x, visualY(b)).setDepth(b.lane + 1);
    }
    for (const [id, s] of this.sprites) {
      if (live.has(id)) continue;
      this.bursts.push({ x: s.x, y: s.y, dir: s.getData('dir'), t: 0, kind: 'impact' });
      s.destroy(); this.sprites.delete(id);
    }
    this._draw(dtMs);
  }

  _spawn(b) {
    const dir = b.facing < 0 ? 'west' : 'east';
    if (!this.scene.textures.exists(specialistBoltFrameKey(dir, 0))) return null;   // art not loaded: no view, the hit still resolves
    const anim = specialistBoltAnimKey(dir);
    if (!this.scene.anims.exists(anim)) this.scene.anims.create({ key: anim, frames: Array.from({ length: SPECIALIST_BOLT_FRAMES }, (_, i) => ({ key: specialistBoltFrameKey(dir, i) })), frameRate: 24, repeat: -1 });
    return this.scene.add.sprite(b.x, visualY(b), specialistBoltFrameKey(dir, 0)).setScale(this.scale).setData('dir', b.facing < 0 ? -1 : 1).play(anim);
  }

  _draw(dtMs) {
    const g = this.g; g.clear();
    const flash = !this.reduceFlash();
    for (const s of this.sprites.values()) {   // wire trail behind each dart
      const wob = flash ? Math.sin(this.scene.time.now / 25) * 2 : 0;
      g.lineStyle(2, CYAN, 0.55).lineBetween(s.x, s.y, s.x - s.getData('dir') * TRAIL_PX, s.y + wob);
    }
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const f = this.bursts[i]; f.t += dtMs;
      const life = f.kind === 'muzzle' ? FLASH_MS : SPARK_MS;
      if (f.t >= life) { this.bursts.splice(i, 1); continue; }
      const k = f.t / life, a = 1 - k;
      if (f.kind === 'muzzle') {
        const len = (flash ? 34 : 18) * (1 - k * 0.5), h = (flash ? 9 : 5) * a;
        g.fillStyle(WHITE, a).fillTriangle(f.x, f.y - h, f.x + f.dir * len, f.y, f.x, f.y + h);                 // the flash cone out of the muzzle
        g.fillStyle(YELLOW, a * 0.8).fillCircle(f.x + f.dir * 6, f.y, 9 * a + 2);
        if (flash) for (let j = 0; j < 3; j++) g.lineStyle(2, CYAN, a).lineBetween(f.x + f.dir * 10, f.y, f.x + f.dir * (22 + 14 * k), f.y + (j - 1) * (8 + 14 * k)); // sparks
      } else {
        g.lineStyle(2, CYAN, a).strokeCircle(f.x, f.y, 6 + 18 * k);
        if (flash) g.fillStyle(WHITE, a).fillCircle(f.x, f.y, 5 * a + 1);
      }
    }
  }
}
