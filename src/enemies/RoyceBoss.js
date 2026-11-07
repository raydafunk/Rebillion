// "Railgun" Royce AI: Level 2 mini-boss. Pure state machine, no Phaser. Same public shape as RustGrunt / BrickDugan so EnemyManager,
// ArenaFailsafe, EnemyHitFx and the scene's cue ring treat him like any other enemy.
// States: idle -> approach -> telegraph -> attack -> recover -> approach; hitstun (parry / guard break only); block; dead.
// Moves (royceData.js): Baton Combo, Charging Dash, Shockwave Slam, Rail Trap, Taser Burst. He takes an attacker slot before every move,
// ignores ordinary hitstun (no juggle loops) and barely moves when hit. Rail Trap strips outlive the move (they are floor hazards).
import { ROYCE, ROYCE_BLOCK, ROYCE_MOVES, ROYCE_ID, pickRoyceMove } from './royceData.js';
import { AttackSlots } from './AttackSlots.js';
import { PARRY_CUE_LEAD_MS } from './gruntData.js';

export const RoyceState = {
  IDLE: 'idle', APPROACH: 'approach', TELEGRAPH: 'telegraph',
  ATTACK: 'attack', RECOVER: 'recover', HITSTUN: 'hitstun', BLOCK: 'block', DEAD: 'dead',
};

const DASH_REPEAT_MS = 50;       // a dash re-sends its hit-request this often until it connects (same attackId, so it lands once)
const WALL_INSET = 70;           // he crashes this far inside the edge of the fighting range
const MELEE_FORGET_PX = 1.6;     // leaves melee when farther than attackRange * this

export class RoyceBoss {
  /**
   * @param {object} o
   * @param {string} o.id @param {number} o.x @param {number} o.y
   * @param {AttackSlots} [o.slots] shared attacker cap
   * @param {object} [o.data] stats table (defaults to ROYCE)
   * @param {object} [o.hooks] { onHitRequest(info), onStateChange(next, prev), onDeath() }
   * @param {() => {min:number,max:number}} [o.getXRange] fighting range: a dash crashes into its edge, traps stay inside it
   * @param {() => number} [o.rng]
   */
  constructor({ id, x = 0, y = 0, slots, data = ROYCE, hooks = {}, maxHp = data.maxHp, getXRange = null, rng = Math.random }) {
    this.id = id; this.x = x; this.y = y;
    this.data = data;
    this.slots = slots || new AttackSlots(2);
    this.hooks = hooks; this.getXRange = getXRange; this.rng = rng;
    this.maxHp = maxHp; this.hp = maxHp;
    this.isBoss = false;            // that flag means Dugan's art and voice
    this.miniBoss = true;
    this.skin = ROYCE_ID;
    this.visualScale = data.visualScale;
    this.facing = -1;
    this.vx = 0; this.vy = 0; this.kx = 0;
    this.state = RoyceState.IDLE;
    this.timer = data.spawnIdleMs;
    this.move = null;               // the ROYCE_MOVES entry in progress
    this.variant = { id: 'idle', kind: 'strike', hits: [{ atMs: 0 }], markIndex: 0, attackMs: 0 };
    this.lastMoveId = null;
    this.telegraphTotalMs = 0;
    this.hitFired = false; this.hitIndex = 0; this.attackCounter = 0;
    this.hitstunMs = 0; this.hitSeq = 0;
    this.circling = false;
    this.cooldownMs = data.moveCooldownMs;
    this.cd = { dash: data.dashFirstMs, slam: 0, trap: data.trapFirstMs, taser: data.taserFirstMs };
    this.meleeMs = 0;
    this.charge = null;             // { travelled, repeatMs, dir, landed }
    this.crashed = false; this.crashSeq = 0;
    this.moveSeq = 0;               // bumps at every wind-up so the renderer restarts the move's clip
    this.telegraphDir = 0;          // for the scene's red lane strip during a dash wind-up
    this.traps = [];                // Rail Trap strips: { id, x, w, state: 'warn'|'live', lifeLeft, tickLeft, n }
    this.trapSeq = 0;               // bumps when strips are laid out
    this.slamSeq = 0;               // bumps at the slam so the renderer fires the impact once
    this.target = null;
    this.blockCdMs = 0; this.blockSeq = 0; this.lastReactId = null;
  }

  /** What combat's hit resolver reads: 'block' while his arms are up. */
  get guard() { return this.state === RoyceState.BLOCK ? 'block' : null; }

  /** Zed's melee hit-request: may raise a block (same rules as Dugan's, see ROYCE_BLOCK). A heavy hit breaks an active block. */
  onPlayerAttack(req) {
    if (!this.alive || !req || req.attackId === this.lastReactId) return;
    const b = ROYCE_BLOCK;
    if (this.state === RoyceState.BLOCK) {
      if ((req.damage || 0) >= b.guardBreakDamage) {
        this.lastReactId = req.attackId;
        this.timer = b.guardBreakStunMs; this.hitstunMs = this.timer; this.hitSeq++;
        this._set(RoyceState.HITSTUN);
      }
      return;
    }
    const free = this.state === RoyceState.IDLE || this.state === RoyceState.APPROACH || this.state === RoyceState.RECOVER;
    if (!free || this.blockCdMs > 0 || this.charge) return;
    const o = req.origin || { x: this.x, y: this.y };
    if (Math.hypot(o.x - this.x, o.y - this.y) > b.reactRangePx) return;
    this.lastReactId = req.attackId;
    if (this.rng() >= b.blockChance) return;
    this.timer = b.blockMs; this.blockCdMs = b.blockCooldownMs; this.blockSeq++;
    this.circling = false;
    this._set(RoyceState.BLOCK);
  }

  get alive() { return this.state !== RoyceState.DEAD; }
  get telegraphing() { return this.state === RoyceState.TELEGRAPH; }
  get telegraphProgress() { return this.telegraphing ? 1 - this.timer / this.telegraphTotalMs : 0; }
  get cueClockMs() {
    if (this.state === RoyceState.TELEGRAPH) return this.telegraphTotalMs - this.timer;
    if (this.state === RoyceState.ATTACK) return this.telegraphTotalMs + (this.variant.attackMs - this.timer);
    return null;
  }
  get parryMarkMs() { return this.telegraphTotalMs + this.variant.hits[this.variant.markIndex].atMs - PARRY_CUE_LEAD_MS; }
  /** True while the red lane strip should be drawn (Charging Dash wind-up). */
  get chargeWarning() { return this.state === RoyceState.TELEGRAPH && !!this.move && this.move.id === 'dash'; }

  _set(next) {
    const prev = this.state;
    if (prev === next) return;
    this.state = next;
    if (next !== RoyceState.TELEGRAPH && next !== RoyceState.ATTACK) this.slots.release(this.id);
    if (this.hooks.onStateChange) this.hooks.onStateChange(next, prev);
  }

  hurtbox() {
    const h = this.data.hurtbox;
    const x = this.facing >= 0 ? this.x + h.x : this.x - h.x - h.w;
    return { x, y: this.y + h.y, w: h.w, h: h.h };
  }
  attackHitbox() {
    const h = (this.move || ROYCE_MOVES.combo).hitbox;
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
    const d = this.data;
    if (move.id === 'dash') { this.cd.dash = d.dashCooldownMs; this.telegraphDir = this.facing; }
    if (move.id === 'slam') this.cd.slam = d.slamCooldownMs;
    if (move.id === 'taser') this.cd.taser = d.taserCooldownMs;
    if (move.id === 'trap') { this.cd.trap = d.trapCooldownMs; this._layTraps(move.trap); }
    this._set(RoyceState.TELEGRAPH);
  }

  /** Rail Trap: mark the strips now (cyan lines during the wind-up); they electrify when the wind-up ends. */
  _layTraps(cfg) {
    const t = this.target || { x: this.x + this.facing * 200, y: this.y };
    const r = this.getXRange ? this.getXRange() : null;
    this.trapSeq++;
    const fresh = cfg.offsets.map((off, i) => {
      let x = t.x + off;
      if (r) x = Math.min(r.max - cfg.widthPx, Math.max(r.min + cfg.widthPx, x));
      return { id: `${this.trapSeq}.${i}`, x, w: cfg.widthPx, state: 'warn', lifeLeft: cfg.lifeMs, tickLeft: 0, n: 0 };
    });
    this.traps.push(...fresh);
  }

  _beginAttack() {
    const m = this.move;
    this.timer = m.attackMs; this.hitFired = false; this.hitIndex = 0;
    this.attackCounter++;               // one attackId per move
    this.charge = m.id === 'dash' ? { travelled: 0, repeatMs: 0, dir: this.telegraphDir || this.facing, landed: false } : null;
    if (this.charge) this.facing = this.charge.dir;
    if (m.id === 'trap') for (const tr of this.traps) if (tr.state === 'warn') { tr.state = 'live'; tr.tickLeft = 0; }
    if (m.id === 'slam') this.slamSeq++;
    this._set(RoyceState.ATTACK);
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
    if (this.state === RoyceState.DEAD) return;

    if (this.kx !== 0) {
      this.x += this.kx * dt;
      const dec = d.knockbackDecay * dt;
      this.kx = Math.abs(this.kx) <= dec ? 0 : this.kx - Math.sign(this.kx) * dec;
    }
    this.cooldownMs = Math.max(0, this.cooldownMs - dtMs);
    for (const k of Object.keys(this.cd)) this.cd[k] = Math.max(0, this.cd[k] - dtMs);
    this.blockCdMs = Math.max(0, this.blockCdMs - dtMs);
    this.target = target || null;
    if (target) this._trackMelee(dtMs, target);
    this._trapStep(dtMs);

    if (target && (this.state === RoyceState.IDLE || this.state === RoyceState.APPROACH || this.state === RoyceState.TELEGRAPH
        || this.state === RoyceState.RECOVER || this.state === RoyceState.BLOCK)) {
      if (!(this.state === RoyceState.TELEGRAPH && this.move && this.move.id === 'dash')) this.facing = target.x >= this.x ? 1 : -1;
    }

    switch (this.state) {
      case RoyceState.IDLE:
        this.timer -= dtMs;
        if (this.timer <= 0 && target) this._set(RoyceState.APPROACH);
        break;
      case RoyceState.APPROACH:
        if (target) this._approach(dt, target);
        break;
      case RoyceState.TELEGRAPH:
        this.timer -= dtMs;
        if (this.timer <= 0) this._beginAttack();
        break;
      case RoyceState.ATTACK:
        this._attack(dtMs, dt);
        break;
      case RoyceState.RECOVER:
        this.timer -= dtMs;
        if (this.timer <= 0) { this.cooldownMs = d.moveCooldownMs; this._set(RoyceState.APPROACH); }
        break;
      case RoyceState.BLOCK:
        this.timer -= dtMs;
        if (this.timer <= 0) this._set(RoyceState.APPROACH);
        break;
      case RoyceState.HITSTUN:
        this.timer -= dtMs;
        if (this.timer <= 0) { this.cooldownMs = d.moveCooldownMs; this._set(RoyceState.APPROACH); }
        break;
    }
  }

  _trackMelee(dtMs, t) {
    const dist = Math.hypot(t.x - this.x, t.y - this.y);
    if (dist <= this.data.attackRange) this.meleeMs += dtMs;
    else if (dist > this.data.attackRange * MELEE_FORGET_PX) this.meleeMs = 0;
  }

  /** Live strips shock whoever stands in them every tickMs, in every state (they are on the floor, not in his hands); a jump clears them. */
  _trapStep(dtMs) {
    if (!this.traps.length) return;
    const cfg = ROYCE_MOVES.trap.trap;
    for (const tr of this.traps) {
      if (tr.state !== 'live') continue;
      tr.lifeLeft -= dtMs; tr.tickLeft -= dtMs;
      if (tr.lifeLeft > 0 && tr.tickLeft <= 0) { tr.tickLeft = cfg.tickMs; this._emitTrap(tr, cfg); }
    }
    this.traps = this.traps.filter((tr) => tr.state === 'warn' || tr.lifeLeft > 0);
  }

  _emitTrap(tr, cfg) {
    if (!this.hooks.onHitRequest) return;
    this.hooks.onHitRequest({
      attackerId: this.id, attackId: `${this.id}:trap${tr.id}:${tr.n++}`, team: this.data.team,
      // Tall box: the strip crosses every depth (lane: null skips the depth check); airborne targets are skipped by the resolver.
      hitbox: { x: -tr.w / 2, y: -260, w: tr.w, h: 520 }, origin: { x: tr.x, y: this.y }, lane: null, facing: 1,
      damage: cfg.damage, knockback: cfg.knockback, hitstun: cfg.hitstun, pierceInvuln: false, unblockable: true, unparryable: true,
    });
  }

  _attack(dtMs, dt) {
    const m = this.move;
    if (this.charge) { this._dashStep(dtMs, dt); return; }
    this.timer -= dtMs;
    const elapsed = m.attackMs - this.timer;
    while (!this.hitFired && this.hitIndex < m.hits.length && elapsed >= m.hits[this.hitIndex].atMs) {
      const h = m.hits[this.hitIndex++];
      if (this.hitIndex >= m.hits.length) this.hitFired = true;
      if (m.id !== 'trap') this._emitHit(h);   // the trap move itself deals no damage
    }
    if (this.timer <= 0) this._endMove(m.recoverMs);
  }

  _dashStep(dtMs, dt) {
    const m = this.move, c = this.charge;
    this.timer -= dtMs;
    const step = m.chargeSpeed * dt * c.dir;
    this.x += step; this.vx = m.chargeSpeed * c.dir; c.travelled += Math.abs(step);
    c.repeatMs -= dtMs;
    if (!c.landed && c.repeatMs <= 0) { c.repeatMs = DASH_REPEAT_MS; this._emitHit(m.hits[0]); }
    const r = this.getXRange ? this.getXRange() : null;
    const wall = r && (c.dir > 0 ? this.x >= r.max - WALL_INSET : this.x <= r.min + WALL_INSET);
    if (wall) {                                   // crashed into the arena wall: a long, open recovery
      this.x = Math.min(r.max - WALL_INSET, Math.max(r.min + WALL_INSET, this.x));
      this.crashed = true; this.crashSeq++;
      this._endMove(m.wallRecoverMs);
    } else if (c.landed || c.travelled >= m.chargeMaxPx || this.timer <= 0) this._endMove(m.recoverMs);
  }

  /** combat applied one of his attacks to Zed (EnemyManager calls this from damage-applied): a dash ends on contact. */
  onHitLanded() { if (this.charge) this.charge.landed = true; }

  _endMove(recoverMs) {
    this.charge = null;
    this.timer = recoverMs;
    this._set(RoyceState.RECOVER);
  }

  _ready() { return { dash: this.cd.dash <= 0, slam: this.cd.slam <= 0, trap: this.cd.trap <= 0, taser: this.cd.taser <= 0 }; }

  _approach(dt, t) {
    const d = this.data;
    const dx = t.x - this.x, dy = t.y - this.y;
    const dist = Math.hypot(dx, dy) || 0.0001;
    this.circling = false;
    if (this.cooldownMs <= 0) {
      const mv = pickRoyceMove({ dist, dy, lift: t.lift || 0, meleeMs: this.meleeMs, ready: this._ready(), lastId: this.lastMoveId }, this.rng, d);
      if (mv) {
        const closeMove = mv.id === 'combo' || mv.id === 'slam';   // ranged moves do not need depth lined up beyond their own lane checks
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
   * React to damage combat applied. Ordinary hits never stun him and push him only a little; a parry stun does stun him and cancels the move
   * in progress (strips still marked but not yet live are cancelled with it; live strips stay).
   */
  takeHit({ hitstun = 0, knockback = 0, parry = false, hpAfter = null } = {}) {
    if (!this.alive) return;
    if (hpAfter !== null && hpAfter !== undefined) this.hp = hpAfter;
    if (!parry) { this.kx = this.state === RoyceState.BLOCK ? 0 : knockback * this.data.knockbackScale; return; }
    this.charge = null; this.hitFired = true; this.kx = 0;
    this.traps = this.traps.filter((tr) => tr.state === 'live');
    this.timer = Math.max(hitstun, this.data.parryStunMs);
    this.hitstunMs = this.timer;
    this.hitSeq++;
    this._set(RoyceState.HITSTUN);
  }

  die() {
    if (!this.alive) return;
    this.kx = 0; this.charge = null; this.traps = [];
    this._set(RoyceState.DEAD);
    if (this.hooks.onDeath) this.hooks.onDeath();
  }

  /** Story-card intro: stop where he is and stand in his idle pose until releaseIdle(). */
  holdIdle() {
    if (!this.alive) return;
    this.vx = 0; this.vy = 0; this.kx = 0;
    this.timer = Infinity;
    this._set(RoyceState.IDLE);
  }

  /** End the intro hold: he starts his approach on the next update. */
  releaseIdle() {
    if (this.state === RoyceState.IDLE && this.timer === Infinity) this.timer = 0;
  }

  teleport(x, y) { this.x = x; this.y = y; this.kx = 0; }
}
