// Throwable weapons: a pickup puts Zed in the carrying pose; one press of the Throw key (U / N / pad B) hurls it. No Phaser.
// The bat flies along Zed's lane and asks for a hit-request each frame; it stops on the first enemy it lands on (or at max range).
import { PLAYER_ID, TEAMS } from '../shared/combatData.js';

export const WEAPON = Object.freeze({
  spriteKey: 'item.bat',
  spritePath: 'assets/sprites/Items/BaseBall/baseball_bat/rotations/baseball_bat.png',
  displaySize: 84,
  collectRadius: 50,
  maxAirborne: 60,
  speed: 900,        // px/s
  maxDist: 760,
  spinDegPerSec: 1100,
  hitbox: Object.freeze({ x: -22, y: -34, w: 44, h: 40 }),
  damage: 30,        // a heavy punch is 18: the throw is the reward for clearing the level
  knockback: 420,
  hitstun: 420,      // ms
});

let seq = 0;
export class ThrownWeapon {
  constructor({ x, y, lane, facing, spec = WEAPON }) {
    this.id = `${PLAYER_ID}:throw:${++seq}`;
    this.x = x; this.y = y; this.lane = lane; this.facing = facing >= 0 ? 1 : -1;
    this.spec = spec; this.travelled = 0; this.alive = true;
  }
  /** Advance and return this frame's hit-request, or null once it is spent. */
  update(dtMs) {
    if (!this.alive) return null;
    const step = this.spec.speed * Math.min(dtMs, 50) / 1000; // cap a long frame so it cannot skip an enemy
    this.x += this.facing * step; this.travelled += step;
    if (this.travelled >= this.spec.maxDist) { this.alive = false; return null; }
    return {
      attackerId: PLAYER_ID, attackId: this.id, team: TEAMS.PLAYER,
      hitbox: { ...this.spec.hitbox }, origin: { x: this.x, y: this.y }, lane: this.lane, facing: this.facing,
      damage: this.spec.damage, knockback: this.spec.knockback, hitstun: this.spec.hitstun,
    };
  }
  kill() { this.alive = false; }
}

/** True when a DAMAGE_APPLIED event is this weapon landing on someone. */
export const isThrowHit = (w, d) => !!d && d.attackId === w.id && d.landed !== false && d.amount > 0;
