// Rust grunt AI: pure state machine, no Phaser or event dependencies.
// States: idle -> approach -> telegraph -> attack -> recover -> approach; hitstun; dead.
import { GRUNT, ATTACKER_CAP } from './gruntData.js';
import { AttackSlots } from './AttackSlots.js';

export const GruntState = {
  IDLE: 'idle', APPROACH: 'approach', TELEGRAPH: 'telegraph',
  ATTACK: 'attack', RECOVER: 'recover', HITSTUN: 'hitstun', DEAD: 'dead',
};

export class RustGrunt {
  /**
   * @param {object} o
   * @param {string} o.id
   * @param {number} o.x @param {number} o.y
   * @param {AttackSlots} [o.slots] shared attacker cap
   * @param {object} [o.data] stats table (defaults to GRUNT)
   * @param {object} [o.hooks] { onHitRequest(info), onStateChange(next, prev), onDeath() }
   */
  constructor({ id, x = 0, y = 0, slots, data = GRUNT, hooks = {} }) {
    this.id = id; this.x = x; this.y = y;
    this.data = data;
    this.slots = slots || new AttackSlots(ATTACKER_CAP);
    this.hooks = hooks;
    this.hp = data.maxHp;
    this.facing = 1;
    this.vx = 0; this.vy = 0;       // locomotion velocity this frame
    this.kx = 0;                    // knockback velocity (decays)
    this.state = GruntState.IDLE;
    this.timer = data.spawnIdleMs;
    this.hitFired = false;
    this.attackCounter = 0;
    this.circling = false;
    this.circleDir = (Math.abs(hashId(id)) % 2) ? 1 : -1;
  }

  get alive() { return this.state !== GruntState.DEAD; }
  /** True while the telegraph wind-up is visible (renderer shows fx.telegraph). */
  get telegraphing() { return this.state === GruntState.TELEGRAPH; }
  /** 0..1 progress through the telegraph, for tinting/flash. */
  get telegraphProgress() {
    return this.telegraphing ? 1 - this.timer / this.data.telegraphMs : 0;
  }

  _set(next) {
    const prev = this.state;
    if (prev === next) return;
    this.state = next;
    if (next !== GruntState.TELEGRAPH && next !== GruntState.ATTACK) this.slots.release(this.id);
    if (this.hooks.onStateChange) this.hooks.onStateChange(next, prev);
  }

  /** Attack hitbox in world space, honoring facing. */
  attackHitbox() {
    const h = this.data.attack.hitbox;
    const x = this.facing >= 0 ? this.x + h.x : this.x - h.x - h.w;
    return { x, y: this.y + h.y, w: h.w, h: h.h };
  }

  /** Hurtbox in world space, honoring facing. */
  hurtbox() {
    const h = this.data.hurtbox;
    const x = this.facing >= 0 ? this.x + h.x : this.x - h.x - h.w;
    return { x, y: this.y + h.y, w: h.w, h: h.h };
  }

  /**
   * @param {number} dtMs
   * @param {{x:number,y:number}|null} target
   */
  update(dtMs, target) {
    const d = this.data, dt = dtMs / 1000;
    this.vx = 0; this.vy = 0;
    if (this.state === GruntState.DEAD) return;

    if (this.kx !== 0) {
      this.x += this.kx * dt;
      const dec = d.knockbackDecay * dt;
      this.kx = Math.abs(this.kx) <= dec ? 0 : this.kx - Math.sign(this.kx) * dec;
    }
    if (target && this.state !== GruntState.HITSTUN && this.state !== GruntState.ATTACK) {
      this.facing = target.x >= this.x ? 1 : -1;
    }

    switch (this.state) {
      case GruntState.IDLE:
        this.timer -= dtMs;
        if (this.timer <= 0 && target) this._set(GruntState.APPROACH);
        break;
      case GruntState.APPROACH:
        if (target) this._approach(dt, target);
        break;
      case GruntState.TELEGRAPH:
        this.timer -= dtMs;
        if (this.timer <= 0) { this.timer = d.attackMs; this.hitFired = false; this._set(GruntState.ATTACK); }
        break;
      case GruntState.ATTACK: {
        this.timer -= dtMs;
        const elapsed = d.attackMs - this.timer;
        if (!this.hitFired && elapsed >= d.hitActiveAtMs) {
          this.hitFired = true;
          if (this.hooks.onHitRequest) {
            this.attackCounter++;
            this.hooks.onHitRequest({
              attackerId: this.id, attackId: `${this.id}:${this.attackCounter}`, team: d.team,
              hitbox: { ...d.attack.hitbox }, origin: { x: this.x, y: this.y }, facing: this.facing,
              damage: d.attack.damage, knockback: d.attack.knockback, hitstun: d.attack.hitstun,
            });
          }
        }
        if (this.timer <= 0) { this.timer = d.recoverMs; this._set(GruntState.RECOVER); }
        break;
      }
      case GruntState.RECOVER:
        this.timer -= dtMs;
        if (this.timer <= 0) this._set(GruntState.APPROACH);
        break;
      case GruntState.HITSTUN:
        this.timer -= dtMs;
        if (this.timer <= 0) this._set(GruntState.APPROACH);
        break;
    }
  }

  _approach(dt, t) {
    const d = this.data;
    const dx = t.x - this.x, dy = t.y - this.y;
    const dist = Math.hypot(dx, dy) || 0.0001;
    if (dist <= d.attackRange) {
      if (this.slots.tryAcquire(this.id)) {
        this.circling = false;
        this.timer = d.telegraphMs;
        this._set(GruntState.TELEGRAPH);
      } else {
        this.circling = true; // in range but cap full: back off
        this._move(-dx / dist, -dy / dist, d.circleSpeed, dt);
      }
      return;
    }
    // Within circle radius: request a slot; if denied, orbit instead of closing in.
    if (dist <= d.circleRadius && !this.slots.tryAcquire(this.id)) {
      this.circling = true;
      const nx = dx / dist, ny = dy / dist;
      const radial = dist < d.circleRadius * 0.9 ? -0.5 : 0;
      this._move(-ny * this.circleDir + nx * radial, nx * this.circleDir + ny * radial, d.circleSpeed, dt);
      return;
    }
    this.circling = false;
    this._move(dx / dist, dy / dist, d.moveSpeed, dt);
  }

  _move(ux, uy, speed, dt) {
    this.vx = ux * speed; this.vy = uy * speed;
    this.x += this.vx * dt; this.y += this.vy * dt;
  }

  /** React to damage that combat applied (hp bookkeeping stays with combat). */
  takeHit({ hitstun = 0, knockback = 0 } = {}) {
    if (!this.alive) return;
    this.hitFired = true; // cancel any pending attack
    this.kx = knockback;
    this.timer = Math.max(hitstun, this.data.hitstunMinMs);
    this._set(GruntState.HITSTUN);
  }

  die() {
    if (!this.alive) return;
    this.kx = 0;
    this._set(GruntState.DEAD);
    if (this.hooks.onDeath) this.hooks.onDeath();
  }

  /** Reposition (failsafe). */
  teleport(x, y) { this.x = x; this.y = y; this.kx = 0; }
}

function hashId(id) {
  let h = 0; const s = String(id);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
