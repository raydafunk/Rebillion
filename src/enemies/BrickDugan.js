// "Brick" Dugan AI: Level 1 mini-boss. Pure state machine, no Phaser. Same public shape as RustGrunt so EnemyManager,
// ArenaFailsafe, EnemyHitFx and the scene's cue ring treat him like any other enemy.
// States: idle -> approach -> telegraph -> attack -> recover -> approach; hitstun (parry only); dead.
// He takes an attacker slot before every move, ignores ordinary hitstun (no juggle loops) and barely moves when hit.
import { DUGAN, DUGAN_MOVES, DUGAN_RAGE_THRESHOLD, pickDuganMove } from './duganData.js';
import { AttackSlots } from './AttackSlots.js';
import { PARRY_CUE_LEAD_MS } from './gruntData.js';

export const DuganState = {
  IDLE: 'idle', APPROACH: 'approach', TELEGRAPH: 'telegraph',
  ATTACK: 'attack', RECOVER: 'recover', HITSTUN: 'hitstun', DEAD: 'dead',
};

const CHARGE_REPEAT_MS = 50;      // a charge re-sends its hit-request this often until it connects (same attackId, so it lands once)
const WALL_INSET = 70;            // he crashes this far inside the edge of the fighting range
const MELEE_FORGET_PX = 1.6;      // leaves melee when farther than attackRange * this

export class BrickDugan {
  /**
   * @param {object} o
   * @param {string} o.id @param {number} o.x @param {number} o.y
   * @param {AttackSlots} [o.slots] shared attacker cap
   * @param {object} [o.data] stats table (defaults to DUGAN)
   * @param {object} [o.hooks] { onHitRequest(info), onStateChange(next, prev), onDeath() }
   * @param {() => {min:number,max:number}} [o.getXRange] fighting range, so a charge can crash into the wall
   * @param {() => number} [o.rng]
   */
  constructor({ id, x = 0, y = 0, slots, data = DUGAN, hooks = {}, maxHp = data.maxHp, getXRange = null, rng = Math.random }) {
    this.id = id; this.x = x; this.y = y;
    this.data = data;
    this.slots = slots || new AttackSlots(2);
    this.hooks = hooks; this.getXRange = getXRange; this.rng = rng;
    this.maxHp = maxHp; this.hp = maxHp;
    this.isBoss = true;
    this.skin = data.skin;
    this.visualScale = data.visualScale;
    this.facing = -1;
    this.vx = 0; this.vy = 0;
    this.kx = 0;
    this.state = DuganState.IDLE;
    this.timer = data.spawnIdleMs;
    this.move = null;               // the DUGAN_MOVES entry in progress
    this.variant = { id: 'idle', kind: 'strike', hits: [{ atMs: 0 }], markIndex: 0, attackMs: 0 };
    this.lastMoveId = null;
    this.telegraphTotalMs = 0;
    this.hitFired = false; this.hitIndex = 0; this.attackCounter = 0;
    this.hitstunMs = 0; this.hitSeq = 0;
    this.circling = false;
    this.cooldownMs = data.moveCooldownMs;
    this.chargeCdMs = 1500;         // first charge is a beat after he walks in
    this.meleeMs = 0;
    this.ragePending = false; this.rageUsed = false;
    this.charge = null;             // { travelled, repeatMs, dir, landed, crashed }
    this.crashed = false;           // last move ended in a wall crash (the scene can shake the camera)
    this.crashSeq = 0;
    this.moveSeq = 0;               // bumps at every wind-up so the renderer restarts the move's clip
    this.telegraphDir = 0;          // for the scene's red lane strip during a charge wind-up
  }

  get alive() { return this.state !== DuganState.DEAD; }
  get telegraphing() { return this.state === DuganState.TELEGRAPH; }
  get telegraphProgress() { return this.telegraphing ? 1 - this.timer / this.telegraphTotalMs : 0; }
  get cueClockMs() {
    if (this.state === DuganState.TELEGRAPH) return this.telegraphTotalMs - this.timer;
    if (this.state === DuganState.ATTACK) return this.telegraphTotalMs + (this.variant.attackMs - this.timer);
    return null;
  }
  get parryMarkMs() { return this.telegraphTotalMs + this.variant.hits[this.variant.markIndex].atMs - PARRY_CUE_LEAD_MS; }
  /** True while the red lane strip should be drawn (Running Shoulder Charge wind-up). */
  get chargeWarning() { return this.state === DuganState.TELEGRAPH && this.move && this.move.id === 'charge'; }

  _set(next) {
    const prev = this.state;
    if (prev === next) return;
    this.state = next;
    if (next !== DuganState.TELEGRAPH && next !== DuganState.ATTACK) this.slots.release(this.id);
    if (this.hooks.onStateChange) this.hooks.onStateChange(next, prev);
  }

  /** Hurtbox in world space, honoring facing. */
  hurtbox() {
    const h = this.data.hurtbox;
    const x = this.facing >= 0 ? this.x + h.x : this.x - h.x - h.w;
    return { x, y: this.y + h.y, w: h.w, h: h.h };
  }
  attackHitbox() {
    const h = (this.move || DUGAN_MOVES.punch).hitbox;
    const x = this.facing >= 0 ? this.x + h.x : this.x - h.x - h.w;
    return { x, y: this.y + h.y, w: h.w, h: h.h };
  }

  _beginTelegraph(move) {
    this.move = move;
    this.variant = { id: move.id, kind: move.kind, hits: move.hits, markIndex: move.markIndex, attackMs: move.attackMs };
    this.telegraphTotalMs = move.telegraphMs;
    this.timer = move.telegraphMs;
    this.lastMoveId = move.id;
    this.moveSeq++;
    this.crashed = false;
    if (move.id === 'rage') this.ragePending = false;
    if (move.id === 'charge') { this.chargeCdMs = this.data.chargeCooldownMs; this.telegraphDir = this.facing; }
    this._set(DuganState.TELEGRAPH);
  }

  _beginAttack() {
    const m = this.move;
    this.timer = m.attackMs; this.hitFired = false; this.hitIndex = 0;
    this.attackCounter++;               // one attackId per move: a repeated charge request cannot hit twice
    this.charge = m.id === 'charge' ? { travelled: 0, repeatMs: 0, dir: this.telegraphDir || this.facing, landed: false } : null;
    if (this.charge) this.facing = this.charge.dir;
    this._set(DuganState.ATTACK);
  }

  _emitHit(h) {
    if (!this.hooks.onHitRequest) return;
    const m = this.move;
    this.hooks.onHitRequest({
      attackerId: this.id, attackId: `${this.id}:${this.attackCounter}:${h.atMs}`, team: this.data.team,
      hitbox: { ...m.hitbox }, origin: { x: this.x, y: this.y }, lane: this.y, facing: this.facing,
      damage: h.damage, knockback: h.knockback, hitstun: h.hitstun, pierceInvuln: !!h.pierceInvuln,
    });
  }

  /** @param {{x:number,y:number,lift?:number}|null} target */
  update(dtMs, target) {
    const d = this.data, dt = dtMs / 1000;
    this.vx = 0; this.vy = 0;
    if (this.state === DuganState.DEAD) return;

    if (this.kx !== 0) {
      this.x += this.kx * dt;
      const dec = d.knockbackDecay * dt;
      this.kx = Math.abs(this.kx) <= dec ? 0 : this.kx - Math.sign(this.kx) * dec;
    }
    this.cooldownMs = Math.max(0, this.cooldownMs - dtMs);
    this.chargeCdMs = Math.max(0, this.chargeCdMs - dtMs);
    if (target) this._trackMelee(dtMs, target);
    if (!this.rageUsed && this.hp <= this.maxHp * DUGAN_RAGE_THRESHOLD) { this.rageUsed = true; this.ragePending = true; }

    if (target && (this.state === DuganState.IDLE || this.state === DuganState.APPROACH || this.state === DuganState.TELEGRAPH
        || this.state === DuganState.RECOVER)) {
      if (!(this.state === DuganState.TELEGRAPH && this.move && this.move.id === 'charge')) this.facing = target.x >= this.x ? 1 : -1;
    }

    switch (this.state) {
      case DuganState.IDLE:
        this.timer -= dtMs;
        if (this.timer <= 0 && target) this._set(DuganState.APPROACH);
        break;
      case DuganState.APPROACH:
        if (target) this._approach(dt, target);
        break;
      case DuganState.TELEGRAPH:
        this.timer -= dtMs;
        if (this.timer <= 0) this._beginAttack();
        break;
      case DuganState.ATTACK:
        this._attack(dtMs, dt);
        break;
      case DuganState.RECOVER:
        this.timer -= dtMs;
        if (this.timer <= 0) { this.cooldownMs = d.moveCooldownMs; this._set(DuganState.APPROACH); }
        break;
      case DuganState.HITSTUN:
        this.timer -= dtMs;
        if (this.timer <= 0) { this.cooldownMs = d.moveCooldownMs; this._set(DuganState.APPROACH); }
        break;
    }
  }

  _trackMelee(dtMs, t) {
    const dist = Math.hypot(t.x - this.x, t.y - this.y);
    if (dist <= this.data.attackRange) this.meleeMs += dtMs;
    else if (dist > this.data.attackRange * MELEE_FORGET_PX) this.meleeMs = 0;
  }

  _attack(dtMs, dt) {
    const m = this.move;
    if (this.charge) { this._chargeStep(dtMs, dt); return; }
    this.timer -= dtMs;
    const elapsed = m.attackMs - this.timer;
    while (!this.hitFired && this.hitIndex < m.hits.length && elapsed >= m.hits[this.hitIndex].atMs) {
      const h = m.hits[this.hitIndex++];
      if (this.hitIndex >= m.hits.length) this.hitFired = true;
      this._emitHit(h);
    }
    if (this.timer <= 0) this._endMove(m.recoverMs);
  }

  _endMove(recoverMs) {
    this.charge = null;
    this.timer = recoverMs;
    this._set(DuganState.RECOVER);
  }

  _chargeStep(dtMs, dt) {
    const m = this.move, c = this.charge;
    this.timer -= dtMs;
    const step = m.chargeSpeed * dt * c.dir;
    this.x += step; this.vx = m.chargeSpeed * c.dir; c.travelled += Math.abs(step);
    c.repeatMs -= dtMs;
    if (!c.landed && c.repeatMs <= 0) { c.repeatMs = CHARGE_REPEAT_MS; this._emitHit(m.hits[0]); }
    const r = this.getXRange ? this.getXRange() : null;
    const wall = r && (c.dir > 0 ? this.x >= r.max - WALL_INSET : this.x <= r.min + WALL_INSET);
    if (wall) {                                   // he crashed into the arena wall: a long, open recovery
      if (r) this.x = Math.min(r.max - WALL_INSET, Math.max(r.min + WALL_INSET, this.x));
      this.crashed = true; this.crashSeq++;
      this._endMove(m.wallRecoverMs);
    } else if (c.landed || c.travelled >= m.chargeMaxPx || this.timer <= 0) this._endMove(m.recoverMs);
  }

  /** combat applied one of his attacks to Zed (EnemyManager calls this from damage-applied). */
  onHitLanded() { if (this.charge) this.charge.landed = true; }

  _approach(dt, t) {
    const d = this.data;
    const dx = t.x - this.x, dy = t.y - this.y;
    const dist = Math.hypot(dx, dy) || 0.0001;
    this.circling = false;
    if (this.cooldownMs <= 0) {
      const mv = pickDuganMove({
        dist, dy, lift: t.lift || 0, meleeMs: this.meleeMs, ragePending: this.ragePending,
        chargeReady: this.chargeCdMs <= 0, lastId: this.lastMoveId,
      }, this.rng, d);
      if (mv) {
        const closeMove = mv.id !== 'charge';
        // Close moves need him lined up in depth; the charge is picked along his own lane.
        if (closeMove && Math.abs(dy) > d.laneTolerance) { this._move(0, Math.sign(dy), d.moveSpeed, dt); return; }
        if (this.slots.tryAcquire(this.id)) { this._beginTelegraph(mv); return; }
        this.circling = true;                      // no slot free: hold his ground (flagged so the failsafe does not read it as stuck)
        return;
      }
    }
    if (dist <= d.attackRange * 0.9 && Math.abs(dy) <= d.laneTolerance) return; // in reach, waiting out the cooldown: planted
    this._move(dx / dist, dy / dist, d.moveSpeed, dt);
  }

  _move(ux, uy, speed, dt) {
    this.vx = ux * speed; this.vy = uy * speed;
    this.x += this.vx * dt; this.y += this.vy * dt;
  }

  /**
   * React to damage combat applied. Ordinary hits never stun him (boss hitstun immunity) and push him only a little;
   * a parry stun does stun him and cancels the move in progress.
   * @param {{hitstun?:number, knockback?:number, parry?:boolean, hpAfter?:number}} h
   */
  takeHit({ hitstun = 0, knockback = 0, parry = false, hpAfter = null } = {}) {
    if (!this.alive) return;
    if (hpAfter !== null && hpAfter !== undefined) this.hp = hpAfter;
    if (!parry) { this.kx = knockback * this.data.knockbackScale; return; }
    this.charge = null; this.hitFired = true;
    this.kx = 0;
    this.timer = Math.max(hitstun, this.data.parryStunMs);
    this.hitstunMs = this.timer;
    this.hitSeq++;
    this._set(DuganState.HITSTUN);
  }

  die() {
    if (!this.alive) return;
    this.kx = 0; this.charge = null;
    this._set(DuganState.DEAD);
    if (this.hooks.onDeath) this.hooks.onDeath();
  }

  teleport(x, y) { this.x = x; this.y = y; this.kx = 0; }
}
