// "Crusher" Kane AI: Level 3 mini-boss. Pure state machine, no Phaser. Same public shape as RoyceBoss / BrickDugan / RustGrunt so
// EnemyManager, ArenaFailsafe, EnemyHitFx and the scene's cue ring treat him like any other enemy.
// States: idle -> approach -> telegraph -> attack -> recover -> approach; hitstun (parry only); dead. He has no block.
// Moves (kaneData.js): Hammer Slam, Hook Chain Grab, Furnace Kick, Steam Vent Burst, Crushing Uppercut.
// He takes an attacker slot before every move, ignores ordinary hitstun (no juggle loops) and barely moves when hit.
// Steam patches outlive the Steam Vent Burst (they are floor hazards).
import { KANE, KANE_MOVES, KANE_ID, pickKaneMove } from './kaneData.js';
import { AttackSlots } from './AttackSlots.js';
import { PARRY_CUE_LEAD_MS } from './gruntData.js';

export const KaneState = {
  IDLE: 'idle', APPROACH: 'approach', TELEGRAPH: 'telegraph',
  ATTACK: 'attack', RECOVER: 'recover', HITSTUN: 'hitstun', DEAD: 'dead',
};

const MELEE_FORGET_PX = 1.6;     // leaves melee when farther than attackRange * this
const FOLLOW_UP_COOLDOWN_MS = 250; // after a hook drags Zed in, he swings again almost at once (still a full 850 ms wind-up)

export class KaneBoss {
  /**
   * @param {object} o
   * @param {string} o.id @param {number} o.x @param {number} o.y
   * @param {AttackSlots} [o.slots] shared attacker cap
   * @param {object} [o.data] stats table (defaults to KANE)
   * @param {object} [o.hooks] { onHitRequest(info), onStateChange(next, prev), onDeath() }
   * @param {() => {min:number,max:number}} [o.getXRange] fighting range: steam patches stay inside it
   * @param {() => number} [o.rng]
   */
  constructor({ id, x = 0, y = 0, slots, data = KANE, hooks = {}, maxHp = data.maxHp, getXRange = null, rng = Math.random }) {
    this.id = id; this.x = x; this.y = y;
    this.data = data;
    this.slots = slots || new AttackSlots(2);
    this.hooks = hooks; this.getXRange = getXRange; this.rng = rng;
    this.maxHp = maxHp; this.hp = maxHp;
    this.isBoss = false;            // that flag means Dugan's art and voice
    this.miniBoss = true;
    this.skin = KANE_ID;
    this.visualScale = data.visualScale;
    this.facing = -1;
    this.vx = 0; this.vy = 0; this.kx = 0;
    this.state = KaneState.IDLE;
    this.timer = data.spawnIdleMs;
    this.move = null;               // the KANE_MOVES entry in progress
    this.variant = { id: 'idle', kind: 'strike', hits: [{ atMs: 0 }], markIndex: 0, attackMs: 0 };
    this.lastMoveId = null;
    this.telegraphTotalMs = 0;
    this.hitFired = false; this.hitIndex = 0; this.attackCounter = 0;
    this.hitstunMs = 0; this.hitSeq = 0;
    this.circling = false;
    this.cooldownMs = data.moveCooldownMs;
    this.cd = { hook: data.hookFirstMs, kick: data.kickFirstMs, vent: data.ventFirstMs, uppercut: data.uppercutFirstMs };
    this.meleeMs = 0;
    this.hookLanded = false;        // the hook pulled Zed in: shorter recovery
    this.followUp = false;          // ... and the next decision is the Hammer Slam
    this.moveSeq = 0;               // bumps at every wind-up so the renderer restarts the move's clip
    this.patches = [];              // Steam Vent patches: { id, x, y, w, d, state: 'warn'|'live', lifeLeft, tickLeft, n }
    this.patchSeq = 0;              // bumps when a patch is laid out
    this.ventSeq = 0;               // bumps at the burst so the renderer fires the steam puff once
    this.hammerSeq = 0;             // bumps at the hammer impact so the renderer fires the shake / ring once
    this.hookSeq = 0;               // bumps when the hook fires
    this.target = null;
  }

  get alive() { return this.state !== KaneState.DEAD; }
  get telegraphing() { return this.state === KaneState.TELEGRAPH; }
  get telegraphProgress() { return this.telegraphing ? 1 - this.timer / this.telegraphTotalMs : 0; }
  get cueClockMs() {
    if (this.state === KaneState.TELEGRAPH) return this.telegraphTotalMs - this.timer;
    if (this.state === KaneState.ATTACK) return this.telegraphTotalMs + (this.variant.attackMs - this.timer);
    return null;
  }
  get parryMarkMs() { return this.telegraphTotalMs + this.variant.hits[this.variant.markIndex].atMs - PARRY_CUE_LEAD_MS; }

  _set(next) {
    const prev = this.state;
    if (prev === next) return;
    this.state = next;
    if (next !== KaneState.TELEGRAPH && next !== KaneState.ATTACK) this.slots.release(this.id);
    if (this.hooks.onStateChange) this.hooks.onStateChange(next, prev);
  }

  hurtbox() {
    const h = this.data.hurtbox;
    const x = this.facing >= 0 ? this.x + h.x : this.x - h.x - h.w;
    return { x, y: this.y + h.y, w: h.w, h: h.h };
  }
  attackHitbox() {
    const h = (this.move || KANE_MOVES.hammer).hitbox;
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
    this.hookLanded = false; this.followUp = false;
    const d = this.data;
    if (move.id === 'hook') this.cd.hook = d.hookCooldownMs;
    if (move.id === 'kick') this.cd.kick = d.kickCooldownMs;
    if (move.id === 'uppercut') this.cd.uppercut = d.uppercutCooldownMs;
    if (move.id === 'vent') { this.cd.vent = d.ventCooldownMs; this._layPatch(move.patch); }
    this._set(KaneState.TELEGRAPH);
  }

  /** Steam Vent Burst: mark the patch now (red cone during the wind-up); it goes live when the burst fires. */
  _layPatch(cfg) {
    const r = this.getXRange ? this.getXRange() : null;
    let x = this.x + this.facing * cfg.offsetX;
    if (r) x = Math.min(r.max - cfg.widthPx / 2, Math.max(r.min + cfg.widthPx / 2, x));
    this.patchSeq++;
    this.patches.push({ id: `${this.patchSeq}`, x, y: this.y, w: cfg.widthPx, d: cfg.depthPx, state: 'warn', lifeLeft: cfg.lifeMs, tickLeft: 0, n: 0 });
  }

  _beginAttack() {
    const m = this.move;
    this.timer = m.attackMs; this.hitFired = false; this.hitIndex = 0;
    this.attackCounter++;               // one attackId per move
    if (m.id === 'vent') for (const p of this.patches) if (p.state === 'warn') { p.state = 'live'; p.tickLeft = m.patch.tickMs; }
    this._set(KaneState.ATTACK);
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
    if (this.state === KaneState.DEAD) return;

    if (this.kx !== 0) {
      this.x += this.kx * dt;
      const dec = d.knockbackDecay * dt;
      this.kx = Math.abs(this.kx) <= dec ? 0 : this.kx - Math.sign(this.kx) * dec;
    }
    this.cooldownMs = Math.max(0, this.cooldownMs - dtMs);
    for (const k of Object.keys(this.cd)) this.cd[k] = Math.max(0, this.cd[k] - dtMs);
    this.target = target || null;
    if (target) this._trackMelee(dtMs, target);
    this._patchStep(dtMs);

    if (target && (this.state === KaneState.IDLE || this.state === KaneState.APPROACH || this.state === KaneState.TELEGRAPH || this.state === KaneState.RECOVER)) {
      this.facing = target.x >= this.x ? 1 : -1;
    }

    switch (this.state) {
      case KaneState.IDLE:
        this.timer -= dtMs;
        if (this.timer <= 0 && target) this._set(KaneState.APPROACH);
        break;
      case KaneState.APPROACH:
        if (target) this._approach(dt, target);
        break;
      case KaneState.TELEGRAPH:
        this.timer -= dtMs;
        if (this.timer <= 0) this._beginAttack();
        break;
      case KaneState.ATTACK:
        this._attack(dtMs);
        break;
      case KaneState.RECOVER:
        this.timer -= dtMs;
        if (this.timer <= 0) { this.cooldownMs = this.followUp ? FOLLOW_UP_COOLDOWN_MS : d.moveCooldownMs; this._set(KaneState.APPROACH); }
        break;
      case KaneState.HITSTUN:
        this.timer -= dtMs;
        if (this.timer <= 0) { this.cooldownMs = d.moveCooldownMs; this._set(KaneState.APPROACH); }
        break;
    }
  }

  _trackMelee(dtMs, t) {
    const dist = Math.hypot(t.x - this.x, t.y - this.y);
    if (dist <= this.data.attackRange) this.meleeMs += dtMs;
    else if (dist > this.data.attackRange * MELEE_FORGET_PX) this.meleeMs = 0;
  }

  /** Live patches scald whoever stands in them every tickMs, in every state (they are on the floor, not in his hands); a jump clears them. */
  _patchStep(dtMs) {
    if (!this.patches.length) return;
    const cfg = KANE_MOVES.vent.patch;
    for (const p of this.patches) {
      if (p.state !== 'live') continue;
      p.lifeLeft -= dtMs; p.tickLeft -= dtMs;
      if (p.lifeLeft > 0 && p.tickLeft <= 0) { p.tickLeft = cfg.tickMs; this._emitPatch(p, cfg); }
    }
    this.patches = this.patches.filter((p) => p.state === 'warn' || p.lifeLeft > 0);
  }

  _emitPatch(p, cfg) {
    if (!this.hooks.onHitRequest) return;
    this.hooks.onHitRequest({
      attackerId: this.id, attackId: `${this.id}:patch${p.id}:${p.n++}`, team: this.data.team,
      hitbox: { x: -p.w / 2, y: -80, w: p.w, h: 80 }, origin: { x: p.x, y: p.y }, lane: p.y, facing: 1,
      damage: cfg.damage, knockback: cfg.knockback, hitstun: cfg.hitstun, pierceInvuln: false, unblockable: true, unparryable: true,
    });
  }

  _attack(dtMs) {
    const m = this.move;
    this.timer -= dtMs;
    const elapsed = m.attackMs - this.timer;
    while (!this.hitFired && this.hitIndex < m.hits.length && elapsed >= m.hits[this.hitIndex].atMs) {
      const h = m.hits[this.hitIndex++];
      if (this.hitIndex >= m.hits.length) this.hitFired = true;
      if (m.id === 'hammer') this.hammerSeq++;
      if (m.id === 'vent') this.ventSeq++;
      if (m.id === 'hook') this.hookSeq++;
      this._emitHit(h);
    }
    if (this.timer <= 0) this._endMove(m.id === 'hook' && this.hookLanded ? m.landedRecoverMs : m.recoverMs);
  }

  /** combat applied one of his attacks to Zed (EnemyManager calls this from damage-applied): a landed hook drags him in and sets up a Hammer Slam. */
  onHitLanded() {
    if (this.move && this.move.id === 'hook' && (this.state === KaneState.ATTACK || this.state === KaneState.RECOVER)) { this.hookLanded = true; this.followUp = true; }
  }

  _endMove(recoverMs) {
    this.timer = recoverMs;
    this._set(KaneState.RECOVER);
  }

  _ready() { return { hook: this.cd.hook <= 0, kick: this.cd.kick <= 0, vent: this.cd.vent <= 0, uppercut: this.cd.uppercut <= 0 }; }

  _approach(dt, t) {
    const d = this.data;
    const dx = t.x - this.x, dy = t.y - this.y;
    const dist = Math.hypot(dx, dy) || 0.0001;
    this.circling = false;
    if (this.cooldownMs <= 0) {
      const mv = this.followUp && dist <= d.attackRange * 1.6 ? KANE_MOVES.hammer
        : pickKaneMove({ dist, dy, lift: t.lift || 0, meleeMs: this.meleeMs, ready: this._ready(), lastId: this.lastMoveId }, this.rng, d);
      if (mv) {
        if (mv.id !== 'hook' && Math.abs(dy) > d.laneTolerance) { this._move(0, Math.sign(dy), d.moveSpeed, dt); return; }   // line up in depth first
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
   * React to damage combat applied. Ordinary hits never stun him and push him only a little; a parry stun does stun him and cancels the move
   * in progress (a patch still marked but not yet live is cancelled with it; a live patch stays).
   */
  takeHit({ hitstun = 0, knockback = 0, parry = false, hpAfter = null } = {}) {
    if (!this.alive) return;
    if (hpAfter !== null && hpAfter !== undefined) this.hp = hpAfter;
    if (!parry) { this.kx = knockback * this.data.knockbackScale; return; }
    this.hitFired = true; this.kx = 0; this.followUp = false;
    this.patches = this.patches.filter((p) => p.state === 'live');
    this.timer = Math.max(hitstun, this.data.parryStunMs);
    this.hitstunMs = this.timer;
    this.hitSeq++;
    this._set(KaneState.HITSTUN);
  }

  die() {
    if (!this.alive) return;
    this.kx = 0; this.patches = [];
    this._set(KaneState.DEAD);
    if (this.hooks.onDeath) this.hooks.onDeath();
  }

  /** Story-card intro: stop where he is and stand in his idle pose until releaseIdle(). */
  holdIdle() {
    if (!this.alive) return;
    this.vx = 0; this.vy = 0; this.kx = 0;
    this.timer = Infinity;
    this._set(KaneState.IDLE);
  }

  /** End the intro hold: he starts his approach on the next update. */
  releaseIdle() {
    if (this.state === KaneState.IDLE && this.timer === Infinity) this.timer = 0;
  }

  teleport(x, y) { this.x = x; this.y = y; this.kx = 0; }
}
