// "Brick" Dugan AI: Level 1 mini-boss. Pure state machine, no Phaser. Same public shape as RustGrunt so EnemyManager,
// ArenaFailsafe, EnemyHitFx and the scene's cue ring treat him like any other enemy.
// States: idle -> approach -> telegraph -> attack -> recover -> approach; hitstun (parry / guard break / grab break only); block (see DUGAN_BLOCK); dead.
// He takes an attacker slot before every move, ignores ordinary hitstun (no juggle loops) and barely moves when hit.
import { DUGAN, DUGAN_BLOCK, DUGAN_MOVES, DUGAN_RAGE_THRESHOLD, DUGAN_ENRAGED, pickDuganMove } from './duganData.js';
import { AttackSlots } from './AttackSlots.js';
import { PARRY_CUE_LEAD_MS } from './gruntData.js';

export const DuganState = {
  IDLE: 'idle', APPROACH: 'approach', TELEGRAPH: 'telegraph',
  ATTACK: 'attack', RECOVER: 'recover', HITSTUN: 'hitstun', BLOCK: 'block', DEAD: 'dead',
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
    this.stompCdMs = data.stompFirstMs;
    this.wave = null;               // Mega Stomp shockwave in flight: { r, since, ox, oy }
    this.stompSeq = 0;              // bumps at the slam so the renderer fires the impact effects once
    this.meleeMs = 0;
    this.ragePending = false; this.rageUsed = false;
    this.enraged = false; this.rageCdMs = 0;   // enraged: the rage phase (stays on); rageCdMs: time to the next Rage Punch
    this.charge = null;             // { travelled, repeatMs, dir, landed, crashed }
    this.crashed = false;           // last move ended in a wall crash (the scene can shake the camera)
    this.crashSeq = 0;
    this.moveSeq = 0;               // bumps at every wind-up so the renderer restarts the move's clip
    this.telegraphDir = 0;          // for the scene's red lane strip during a charge wind-up
    this.grab = null;               // Grab and Wall Slam in progress: { phase: 'reach'|'hold'|'slam'|'whiff', holdLeft, lingerLeft }
    this.grabSeq = 0;               // bumps when a grab connects
    this.target = null;             // last known target, for the reach check
    this.blockCdMs = 0;             // BLOCK cooldown (counted from the start of a block)
    this.blockSeq = 0;              // bumps at every block so the renderer restarts the clip
    this.lastReactId = null;        // attackId of Zed's swing already rolled for (a swing re-sends its request every active frame)
  }

  /** What combat's hit resolver reads: 'block' while his arms are up (damage and knockback x0.25, no hitstun; unblockable hits ignore it). */
  get guard() { return this.state === DuganState.BLOCK ? 'block' : null; }

  /**
   * Zed's melee hit-request (EnemyManager forwards the player's HIT_REQUESTs). Starts a block with a chance when he is free to (idle,
   * approaching or recovering; never telegraphing, attacking, held-grab, charging, stomping or in hitstun), is off cooldown, and the swing
   * started in reach. GUARD BREAK: a heavy hit (damage >= guardBreakDamage, Zed's K) drops an active block and staggers him. The resolver
   * may already have applied that heavy at block strength (listener order), so it is the follow-up that lands in full.
   */
  onPlayerAttack(req) {
    if (!this.alive || !req || req.attackId === this.lastReactId) return;
    const b = DUGAN_BLOCK;
    if (this.state === DuganState.BLOCK) {
      if ((req.damage || 0) >= b.guardBreakDamage) {
        this.lastReactId = req.attackId;
        this.timer = b.guardBreakStunMs; this.hitstunMs = this.timer; this.hitSeq++;
        this._set(DuganState.HITSTUN);
      }
      return;
    }
    const free = this.state === DuganState.IDLE || this.state === DuganState.APPROACH || this.state === DuganState.RECOVER;
    if (!free || this.blockCdMs > 0 || this.grab || this.charge || this.wave) return;
    const o = req.origin || { x: this.x, y: this.y };
    if (Math.hypot(o.x - this.x, o.y - this.y) > b.reactRangePx) return;
    this.lastReactId = req.attackId;
    if (this.rng() >= (this.enraged ? b.blockChanceEnraged : b.blockChance)) return;
    this.timer = b.blockMs; this.blockCdMs = b.blockCooldownMs; this.blockSeq++;
    this.circling = false;
    this._set(DuganState.BLOCK);
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
    if (move.id === 'rage') { this.ragePending = false; this.rageCdMs = DUGAN_ENRAGED.ragePunchEveryMs; }
    if (move.id === 'charge') { this.chargeCdMs = this.data.chargeCooldownMs * this._k('chargeCooldownMult'); this.telegraphDir = this.facing; }
    if (move.id === 'stomp') this.stompCdMs = this.data.stompCooldownMs * this._k('stompCooldownMult');
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
      damage: Math.round(h.damage * this._k('damageMult')), knockback: h.knockback, hitstun: h.hitstun, pierceInvuln: !!h.pierceInvuln,
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
    this.stompCdMs = Math.max(0, this.stompCdMs - dtMs);
    this.blockCdMs = Math.max(0, this.blockCdMs - dtMs);
    this.target = target || null;
    if (target) this._trackMelee(dtMs, target);
    if (!this.rageUsed && this.hp <= this.maxHp * DUGAN_RAGE_THRESHOLD) { this.rageUsed = true; this.ragePending = true; this.enraged = true; this.rageCdMs = DUGAN_ENRAGED.ragePunchEveryMs; }
    if (this.enraged && !this.ragePending) { this.rageCdMs -= dtMs; if (this.rageCdMs <= 0) this.ragePending = true; } // the Rage Punch keeps coming back

    if (target && (this.state === DuganState.IDLE || this.state === DuganState.APPROACH || this.state === DuganState.TELEGRAPH
        || this.state === DuganState.RECOVER || this.state === DuganState.BLOCK)) {
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
        if (this.timer <= 0) { this.cooldownMs = d.moveCooldownMs * this._k('moveCooldownMult'); this._set(DuganState.APPROACH); }
        break;
      case DuganState.BLOCK:
        this.timer -= dtMs;
        if (this.timer <= 0) this._set(DuganState.APPROACH);
        break;
      case DuganState.HITSTUN:
        this.timer -= dtMs;
        if (this.timer <= 0) { this.cooldownMs = d.moveCooldownMs * this._k('moveCooldownMult'); this._set(DuganState.APPROACH); }
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
    if (this.grab && this.grab.params && this.grab.phase !== 'reach' && !m.grab) { this._holdStep(dtMs); return; }
    if (this.charge) { this._chargeStep(dtMs, dt); return; }
    if (m.grab) { this._grabStep(dtMs); return; }
    if (m.wave) { this._waveStep(dtMs); return; }
    this.timer -= dtMs;
    const elapsed = m.attackMs - this.timer;
    while (!this.hitFired && this.hitIndex < m.hits.length && elapsed >= m.hits[this.hitIndex].atMs) {
      const h = m.hits[this.hitIndex++];
      if (this.hitIndex >= m.hits.length) this.hitFired = true;
      this._emitHit(h);
    }
    if (this.timer <= 0) this._endMove(m.recoverMs);
  }

  /** Mega Stomp: slam at wave.startAt, then a hit-request front (both sides, whole lane) every tickMs while it travels out. */
  _waveStep(dtMs) {
    const m = this.move, w = m.wave;
    this.timer -= dtMs;
    const elapsed = m.attackMs - this.timer;
    if (elapsed >= w.startAt) {
      if (!this.wave) { this.wave = { r: 0, since: 0, ox: this.x, oy: this.y }; this.stompSeq++; this._emitWave(0); }
      const wv = this.wave;
      wv.r = Math.min(w.reachPx, (w.speed * (elapsed - w.startAt)) / 1000);
      wv.since += dtMs;
      if (wv.since >= w.tickMs && wv.r < w.reachPx + w.thickness / 2) { wv.since = 0; this._emitWave(wv.r); }
    }
    if (this.timer <= 0) this._endMove(m.recoverMs);
  }

  /**
   * Grab and Wall Slam: at reachAt he checks his short reach. In reach and Zed answers accepted: hold (Zed is pinned to his hand via
   * the anchor), then at holdMs the slam. Out of reach, or Zed can't be grabbed (downed, invulnerable, dead): he whiffs and the
   * rest of the move plays out into the long recovery.
   */
  _grabStep(dtMs) {
    const m = this.move, g = m.grab;
    if (!this.grab) this.grab = { phase: 'reach', holdLeft: 0, lingerLeft: 0, params: g };
    const gs = this.grab;
    if (gs.phase === 'hold' || gs.phase === 'slam') { this._holdStep(dtMs); return; }
    this.timer -= dtMs;
    const elapsed = m.attackMs - this.timer;
    if (gs.phase === 'reach' && elapsed >= g.reachAt) {
      this.hitFired = true;
      if (this._grabInReach() && this._tryGrab(g)) { gs.phase = 'hold'; gs.holdLeft = g.holdMs; this.grabSeq++; return; }
      gs.phase = 'whiff';
    }
    if (this.timer <= 0) this._endMove(m.recoverMs);
  }

  /** Hold, then the slam, then he stays planted a moment (shared by Grab and Wall Slam and by a charge that catches Zed). */
  _holdStep(dtMs) {
    const gs = this.grab, g = gs.params;
    if (gs.phase === 'hold') {
      gs.holdLeft -= dtMs;
      if (gs.holdLeft <= 0) {
        gs.phase = 'slam'; gs.lingerLeft = g.slamLingerMs;
        if (this.hooks.onGrabSlam) this.hooks.onGrabSlam({ attackerId: this.id });
      }
      return;
    }
    gs.lingerLeft -= dtMs;
    if (gs.lingerLeft <= 0) this._endMove(this.move.recoverMs);
  }

  _grabInReach() {
    const t = this.target, g = this.move.grab;
    if (!t) return false;
    if ((t.lift || 0) >= this.data.stompAirLift) return false; // jump over it: the grab can't reach a airborne Zed
    const hb = this.attackHitbox();
    return t.x >= hb.x - g.reachSlackPx && t.x <= hb.x + hb.w + g.reachSlackPx && Math.abs(t.y - this.y) <= this.data.laneTolerance;
  }

  _tryGrab(g = this.move.grab) {
    if (!this.hooks.onGrab) return false;
    const r = this.getXRange ? this.getXRange() : null;
    const slamDir = r ? (this.x - r.min <= r.max - this.x ? -1 : 1) : this.facing;   // throw Zed at the nearer wall
    return !!this.hooks.onGrab({
      attackerId: this.id, targetId: 'player', holdMs: g.holdMs, slamDamage: g.slamDamage, slamKnockback: g.slamKnockback, slamDir,
      anchor: () => ({ x: this.x, y: this.y, facing: this.facing }),
    });
  }

  _dropGrab(reason) {
    const held = this.grab && this.grab.phase === 'hold';
    this.grab = null;
    if (held && this.hooks.onGrabRelease) this.hooks.onGrabRelease({ attackerId: this.id, reason });
  }

  /** Zed button-mashed out of the hold: he is stunned for a moment (free punish). */
  grabBroken() {
    if (!this.alive || !this.grab || this.grab.phase !== 'hold') return;
    const stun = this.grab.params.breakStunMs;
    this.grab = null; this.charge = null; this.wave = null; this.hitFired = true; this.kx = 0;
    this.timer = stun;
    this.hitstunMs = this.timer;
    this.hitSeq++;
    this._set(DuganState.HITSTUN);
  }

  _emitWave(r) {
    if (!this.hooks.onHitRequest) return;
    const w = this.move.wave, wv = this.wave;
    for (const facing of [1, -1]) {
      this.hooks.onHitRequest({
        attackerId: this.id, attackId: `${this.id}:${this.attackCounter}:wave`, team: this.data.team,
        // Tall box: it must overlap a target at ANY depth (lane: null skips the depth check, the rect test still looks at y).
        hitbox: { x: r - w.thickness / 2, y: -260, w: w.thickness, h: 520 }, origin: { x: wv.ox, y: wv.oy }, lane: null, facing,
        damage: w.damage, knockback: w.knockback, hitstun: w.hitstun, pierceInvuln: false, unblockable: !!w.unblockable, unparryable: !!w.unblockable,
      });
    }
  }

  /** Rage-phase multiplier for `key` (1 until he is enraged). */
  _k(key) { return this.enraged ? DUGAN_ENRAGED[key] : 1; }

  _endMove(recoverMs, punish = false) { // punish: the wall-crash window keeps its full length
    this.charge = null; this.wave = null; this.grab = null;
    this.timer = punish ? recoverMs : recoverMs * this._k('recoverMult');
    this._set(DuganState.RECOVER);
  }

  _chargeStep(dtMs, dt) {
    const m = this.move, c = this.charge;
    this.timer -= dtMs;
    const step = m.chargeSpeed * dt * c.dir;
    this.x += step; this.vx = m.chargeSpeed * c.dir; c.travelled += Math.abs(step);
    c.repeatMs -= dtMs;
    if (m.catchGrab) {
      if (this._chargeCatches()) {                // he runs into Zed: grab, hold, slam instead of a plain hit
        this.charge = null; this.hitFired = true;
        this.grab = { phase: 'hold', holdLeft: m.catchGrab.holdMs, lingerLeft: 0, params: m.catchGrab };
        this.grabSeq++;
        return;
      }
    } else if (!c.landed && c.repeatMs <= 0) { c.repeatMs = CHARGE_REPEAT_MS; this._emitHit(m.hits[0]); }
    const r = this.getXRange ? this.getXRange() : null;
    const wall = r && (c.dir > 0 ? this.x >= r.max - WALL_INSET : this.x <= r.min + WALL_INSET);
    if (wall) {                                   // he crashed into the arena wall: a long, open recovery
      if (r) this.x = Math.min(r.max - WALL_INSET, Math.max(r.min + WALL_INSET, this.x));
      this.crashed = true; this.crashSeq++;
      this._endMove(m.wallRecoverMs, true);
    } else if (c.landed || c.travelled >= m.chargeMaxPx || this.timer <= 0) this._endMove(m.recoverMs);
  }

  /** A charge catches Zed when he is inside the charge box, in the lane and on the floor (a jump clears it), and Zed accepts the grab. */
  _chargeCatches() {
    const t = this.target, m = this.move;
    if (!t || (t.lift || 0) >= m.catchGrab.catchLiftPx) return false;
    const hb = this.attackHitbox();
    if (t.x < hb.x || t.x > hb.x + hb.w || Math.abs(t.y - this.y) > this.data.laneTolerance) return false;
    return this._tryGrab(m.catchGrab);
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
        chargeReady: this.chargeCdMs <= 0, stompReady: this.stompCdMs <= 0, lastId: this.lastMoveId,
      }, this.rng, this.enraged ? { ...d, grabAfterMeleeMs: d.grabAfterMeleeMs * DUGAN_ENRAGED.grabAfterMeleeMult } : d);
      if (mv) {
        const closeMove = mv.id !== 'charge' && mv.id !== 'stomp'; // the stomp wave covers the whole lane, so depth does not matter
        // Close moves need him lined up in depth; the charge is picked along his own lane.
        if (closeMove && Math.abs(dy) > d.laneTolerance) { this._move(0, Math.sign(dy), d.moveSpeed * this._k('moveSpeedMult'), dt); return; }
        if (this.slots.tryAcquire(this.id)) { this._beginTelegraph(mv); return; }
        this.circling = true;                      // no slot free: hold his ground (flagged so the failsafe does not read it as stuck)
        return;
      }
    }
    if (dist <= d.attackRange * 0.9 && Math.abs(dy) <= d.laneTolerance) return; // in reach, waiting out the cooldown: planted
    this._move(dx / dist, dy / dist, d.moveSpeed * this._k('moveSpeedMult'), dt);
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
    if (!parry) { this.kx = this.state === DuganState.BLOCK ? 0 : knockback * this.data.knockbackScale; return; } // blocking: planted, no pushback
    this._dropGrab('stunned');
    this.charge = null; this.wave = null; this.hitFired = true;
    this.kx = 0;
    this.timer = Math.max(hitstun, this.data.parryStunMs);
    this.hitstunMs = this.timer;
    this.hitSeq++;
    this._set(DuganState.HITSTUN);
  }

  die() {
    if (!this.alive) return;
    this._dropGrab('died');
    this.kx = 0; this.charge = null; this.wave = null;
    this._set(DuganState.DEAD);
    if (this.hooks.onDeath) this.hooks.onDeath();
  }

  teleport(x, y) { this.x = x; this.y = y; this.kx = 0; }
}
