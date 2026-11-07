// Rust grunt AI: pure state machine, no Phaser or event dependencies.
// States: idle -> approach -> telegraph -> attack -> recover -> approach; hitstun; dead.
import { GRUNT, ATTACKER_CAP, PARRY_CUE_LEAD_MS } from './gruntData.js';
import { AttackSlots } from './AttackSlots.js';
import { RANGED_VARIANT } from './specialistRanged.js';

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
  constructor({ id, x = 0, y = 0, slots, data = GRUNT, hooks = {}, maxHp = data.maxHp, pickVariant = null }) {
    this.pickVariant = pickVariant; // (grunt) => attack variant; null = always the plain 1-2-3 string
    this.variant = plainVariant(data); this.lastVariantId = null;
    this.telegraphTotalMs = data.telegraphMs;
    this.id = id; this.x = x; this.y = y;
    this.data = data;
    this.slots = slots || new AttackSlots(ATTACKER_CAP);
    this.hooks = hooks;
    this.maxHp = maxHp;             // per-enemy: Breakers carry more than the data table's grunt value
    this.hp = maxHp;
    this.facing = 1;
    this.vx = 0; this.vy = 0;       // locomotion velocity this frame
    this.kx = 0;                    // knockback velocity (decays)
    this.state = GruntState.IDLE;
    this.timer = data.spawnIdleMs;
    this.hitFired = false;
    this.hitstunMs = 0;             // length of the current/last stun (renderer fits the hit animation to it)
    this.hitSeq = 0;                // bumps on every hit so the renderer can restart the hit animation
    this.jabIndex = 0;              // next hit of the jab string to emit
    this.attackCounter = 0;
    this.circling = false;
    this.rangedCd = data.ranged ? data.ranged.firstCooldownMs : 0; // Specialists: ms until the next Taser volley is allowed
    this.chainMs = 0;               // after a volley: ms left in which the next attack is the baton string
    this.circleDir = (Math.abs(hashId(id)) % 2) ? 1 : -1;
  }

  get alive() { return this.state !== GruntState.DEAD; }
  /** True while the telegraph wind-up is playing. */
  get telegraphing() { return this.state === GruntState.TELEGRAPH; }
  /** 0..1 progress through the telegraph, for tinting/flash. */
  get telegraphProgress() {
    return this.telegraphing ? 1 - this.timer / this.telegraphTotalMs : 0;
  }
  /** ms since the wind-up began (runs on through the attack), or null when not winding up / attacking. Drives the parry cue. */
  get cueClockMs() {
    if (this.state === GruntState.TELEGRAPH) return this.telegraphTotalMs - this.timer;
    if (this.state === GruntState.ATTACK) return this.telegraphTotalMs + (this.variant.attackMs - this.timer);
    return null;
  }
  /** cueClockMs at which the cue ring closes: PARRY_CUE_LEAD_MS before the hit worth parrying. */
  get parryMarkMs() {
    return this.telegraphTotalMs + this.variant.hits[this.variant.markIndex].atMs - PARRY_CUE_LEAD_MS;
  }
  _beginTelegraph() {
    let v;
    if (this.chainMs > 0 && this.data.ranged) { v = plainVariant(this.data); this.chainMs = 0; } // volley done: now the baton string
    else v = this.pickVariant ? this.pickVariant(this) : plainVariant(this.data);
    this.variant = v; this.lastVariantId = v.id;
    this.telegraphTotalMs = this.data.telegraphMs + (v.holdMs || 0);
    this.timer = this.telegraphTotalMs;
    this._set(GruntState.TELEGRAPH);
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
    if (this.rangedCd > 0) this.rangedCd -= dtMs;
    if (this.chainMs > 0) this.chainMs -= dtMs;

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
        if (this.timer <= 0) { this.timer = this.variant.attackMs; this.hitFired = false; this.jabIndex = 0; this._set(GruntState.ATTACK); }
        break;
      case GruntState.ATTACK: {
        this.timer -= dtMs;
        const hits = this.variant.hits, elapsed = this.variant.attackMs - this.timer;
        while (!this.hitFired && this.jabIndex < hits.length && elapsed >= hits[this.jabIndex].atMs) {
          const jab = hits[this.jabIndex++];
          if (this.jabIndex >= hits.length) this.hitFired = true;
          if (jab.projectile) { // Taser Shot: a travelling bolt, not a melee hitbox; the manager flies it and files the hit-requests
            this.attackCounter++;
            if (this.hooks.onProjectileRequest) this.hooks.onProjectileRequest({
              ownerId: this.id, x: this.x + this.facing * d.ranged.bolt.muzzle.x, y: this.y, lane: this.y, facing: this.facing,
              damage: jab.damage, knockback: jab.knockback, hitstun: jab.hitstun,
            });
          } else if (this.hooks.onHitRequest) {
            this.attackCounter++;
            this.hooks.onHitRequest({
              attackerId: this.id, attackId: `${this.id}:${this.attackCounter}`, team: d.team,
              hitbox: { ...d.attack.hitbox }, origin: { x: this.x, y: this.y }, lane: this.y, facing: this.facing,
              damage: jab.damage, knockback: jab.knockback, hitstun: jab.hitstun, pierceInvuln: !!jab.pierceInvuln,
            });
          }
        }
        if (this.timer <= 0) {
          const volley = this.variant.kind === 'ranged';
          if (volley) { this.rangedCd = d.ranged.cooldownMs; this.chainMs = d.ranged.chainWindowMs; }
          this.timer = volley ? d.ranged.recoverMs : d.recoverMs;
          this._set(GruntState.RECOVER);
        }
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

  /** Specialist only: at mid range, off cooldown and not mid-chain, line up on Zed's lane, then take a slot and start the Taser volley. True if it acted. */
  _tryRanged(dt, t, dx, dy, dist) {
    const r = this.data.ranged;
    if (!r || this.rangedCd > 0 || this.chainMs > 0 || dist < r.minDist || dist > r.maxDist) return false;
    if (Math.abs(dy) > r.laneTol) { this.circling = false; this._move(0, Math.sign(dy), this.data.moveSpeed * 0.8, dt); return true; } // line up first: the bolt flies along this lane
    if (!this.slots.tryAcquire(this.id)) return false;
    this.circling = false;
    this.variant = RANGED_VARIANT; this.lastVariantId = RANGED_VARIANT.id;
    this.telegraphTotalMs = this.data.telegraphMs + RANGED_VARIANT.holdMs;
    this.timer = this.telegraphTotalMs;
    this._set(GruntState.TELEGRAPH);
    return true;
  }

  _approach(dt, t) {
    const d = this.data;
    const dx = t.x - this.x, dy = t.y - this.y;
    const dist = Math.hypot(dx, dy) || 0.0001;
    if (this._tryRanged(dt, t, dx, dy, dist)) return;
    if (dist <= d.attackRange && Math.abs(dy) > (d.laneTolerance ?? Infinity)) {
      this.circling = false;
      this._move(0, Math.sign(dy), d.moveSpeed, dt); // in range but off-lane: line up first so the swing can connect
      return;
    }
    if (dist <= d.attackRange) {
      if (this.slots.tryAcquire(this.id)) {
        this.circling = false;
        this._beginTelegraph();
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
    this.hitFired = true; // cancel any pending attack (rest of the jab string)
    this.kx = knockback;
    this.timer = Math.max(hitstun, this.data.hitstunMinMs);
    this.hitstunMs = this.timer;
    this.hitSeq++;
    this._set(GruntState.HITSTUN);
  }

  die() {
    if (!this.alive) return;
    this.kx = 0;
    this._set(GruntState.DEAD);
    if (this.hooks.onDeath) this.hooks.onDeath();
  }

  /** Reposition (failsafe). */
  /** Story-card intro (wave leaders without their own boss class): stand in idle until releaseIdle(). */
  holdIdle() {
    if (this.state === GruntState.DEAD) return;
    this.vx = 0; this.vy = 0; this.kx = 0;
    this.timer = Infinity;
    this._set(GruntState.IDLE);
  }

  /** End the intro hold: he starts his approach on the next update. */
  releaseIdle() {
    if (this.state === GruntState.IDLE && this.timer === Infinity) this.timer = 0;
  }

  teleport(x, y) { this.x = x; this.y = y; this.kx = 0; }
}

/** The original single pattern, built from the data table (used when no variant picker is supplied). */
function plainVariant(d) {
  return { id: 'string', weight: 1, holdMs: 0, hits: d.jabString, markIndex: 0, kind: 'strike', attackMs: d.attackMs };
}

function hashId(id) {
  let h = 0; const s = String(id);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
