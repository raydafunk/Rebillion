// "Raptor" AI: Level 5 mini-boss. Pure state machine, no Phaser. Same public shape as KaneBoss / RoyceBoss / GlitchBoss so EnemyManager,
// ArenaFailsafe, EnemyHitFx and the scene's cue ring treat him like any other enemy.
// States: idle -> approach -> telegraph -> attack -> recover -> approach; hitstun (parry only); dead.
// Moves (raptorData.js): Dive Kick, 4-Hit Punch, Falcon Drop, 6-Hit Charge (telegraph stance, then a run-in inside the attack state, then six standing punches).
// `running` is true only during the rush's run-in; it is cleared by a parry, death, the end of the run and any state change. There is no standalone run.
// He is fast and often airborne: `lift` (px off the floor) is a plain field; while lift >= AIR_DODGE_LIFT ground-only attacks miss him.
// Renderer fields: lift, marker {kind,x,y,radius,grow,locked}, offscreen.
// BLOCK (RAPTOR_BLOCK): reaction guard, see onPlayerAttack; guard === 'negate' makes the resolver deal 0 to every hit while it is up.
// He takes an attacker slot before every move, ignores ordinary hitstun, and goes FRENZIED at half health.
import { RAPTOR, RAPTOR_BLOCK, RAPTOR_MOVES, RAPTOR_ID, RAPTOR_PHASE2_AT, RAPTOR_AIR_LIFT, pickRaptorMove } from './raptorData.js';
import { AttackSlots } from './AttackSlots.js';
import { PARRY_CUE_LEAD_MS } from './gruntData.js';

export const RaptorState = {
  IDLE: 'idle', APPROACH: 'approach', TELEGRAPH: 'telegraph',
  ATTACK: 'attack', RECOVER: 'recover', HITSTUN: 'hitstun', BLOCK: 'block', DEAD: 'dead',
};

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (t) => Math.max(0, Math.min(1, t));
const OFFSCREEN_LIFT = 360;

export class RaptorBoss {
  /**
   * @param {object} o
   * @param {string} o.id @param {number} o.x @param {number} o.y
   * @param {AttackSlots} [o.slots] shared attacker cap
   * @param {object} [o.data] stats table (defaults to RAPTOR)
   * @param {object} [o.hooks] { onHitRequest(info), onStateChange(next, prev), onDeath() }
   * @param {() => {min:number,max:number}} [o.getXRange] fighting range: he stays inside it
   * @param {() => number} [o.rng]
   */
  constructor({ id, x = 0, y = 0, slots, data = RAPTOR, hooks = {}, maxHp = data.maxHp, getXRange = null, rng = Math.random }) {
    this.id = id; this.x = x; this.y = y;
    this.data = data;
    this.slots = slots || new AttackSlots(2);
    this.hooks = hooks; this.getXRange = getXRange; this.rng = rng;
    this.maxHp = maxHp; this.hp = maxHp;
    this.isBoss = false;            // that flag means Dugan's art and voice
    this.miniBoss = true;
    this.skin = RAPTOR_ID;
    this.visualScale = data.visualScale;
    this.facing = -1;
    this.vx = 0; this.vy = 0; this.kx = 0;
    this.running = false;           // true only while the 6-Hit Charge runs in; the run always ends in the six punches (or a parry cancels both)
    this.lift = 0;                  // px off the floor (renderer draws the sprite at y - lift and a shadow at y)
    this.state = RaptorState.IDLE;
    this.timer = data.spawnIdleMs;
    this.move = null;
    this.variant = { id: 'idle', kind: 'strike', hits: [{ atMs: 0 }], markIndex: 0, attackMs: 0 };
    this.lastMoveId = null;
    this.telegraphTotalMs = 0;
    this.hitFired = false; this.hitIndex = 0; this.attackCounter = 0;
    this.hitstunMs = 0; this.hitSeq = 0;
    this.circling = false; this.strafeDir = 1;
    this.cooldownMs = data.moveCooldownMs;
    this.cd = { dive: data.diveFirstMs, punch: data.punchFirstMs, falcon: data.falconFirstMs, rush: data.rushFirstMs };
    this.blockCdMs = RAPTOR_BLOCK.firstMs;   // BLOCK cooldown (counted from the start of a block)
    this.blockSeq = 0;              // bumps at every block so the renderer restarts the clip
    this.guardHitSeq = 0;           // bumps when a blocked hit is absorbed (spark cue)
    this.lastReactId = null;        // attackId of Zed's swing already considered
    this.moveSeq = 0;               // bumps at every wind-up so the renderer restarts the move's clip
    this.impactSeq = 0;             // bumps at every landing / slam so FX fire once
    this.impact = null;             // { x, y, kind } of the latest landing
    this.marker = null;             // ground marker: { kind: 'dive'|'falcon', x, y, radius, grow 0..1, locked }
    this.phase2 = false; this.phase2Seq = 0;
    this.target = null;
    this.mv = {};                   // per-move scratch (origins, locked points)
  }

  get alive() { return this.state !== RaptorState.DEAD; }
  get telegraphing() { return this.state === RaptorState.TELEGRAPH; }
  get telegraphProgress() { return this.telegraphing ? 1 - this.timer / this.telegraphTotalMs : 0; }
  get enraged() { return this.phase2; }
  /** What combat's hit resolver reads: 'negate' while his arms are up (every hit does 0 damage, no knockback, no stun, no guard break). */
  get guard() { return this.state === RaptorState.BLOCK ? 'negate' : null; }
  get blocking() { return this.state === RaptorState.BLOCK; }
  get airborne() { return this.lift >= RAPTOR_AIR_LIFT; }
  get offscreen() { return this.lift >= OFFSCREEN_LIFT; }
  /** The parry ring follows the 4-Hit Punch and the 6-Hit Charge; Dive Kick and Falcon Drop have their own ground cues. */
  get cueClockMs() {
    if (!this.move) return null;
    const id = this.move.id;
    if (id !== 'punch' && id !== 'rush') return null;
    if (this.state === RaptorState.TELEGRAPH) return Math.min(this.telegraphTotalMs, this.telegraphTotalMs - this.timer);
    if (this.state === RaptorState.ATTACK) {
      if (id === 'punch') return this.telegraphTotalMs + (this.variant.attackMs - this.timer);
      const run = this.move.cueRunMs;   // rush: the ring's clock spends cueRunMs on the run-in (stretched over the real run), then follows the punches
      return this.telegraphTotalMs + (this.running ? run * clamp01(this.mv.runP || 0) : run + (this.variant.attackMs - this.timer));
    }
    return null;
  }
  get parryMarkMs() { return this.telegraphTotalMs + (this.move && this.move.id === 'rush' ? this.move.cueRunMs : 0) + this.variant.hits[this.variant.markIndex].atMs - PARRY_CUE_LEAD_MS; }
  get speed() { return this.data.moveSpeed * (this.phase2 ? this.data.p2.speedMult : 1); }

  _set(next) {
    const prev = this.state;
    if (prev === next) return;
    this.state = next;
    if (next !== RaptorState.ATTACK) this.running = false;   // the run-in only exists inside the rush's attack state
    if (next !== RaptorState.TELEGRAPH && next !== RaptorState.ATTACK) this.slots.release(this.id);
    if (this.hooks.onStateChange) this.hooks.onStateChange(next, prev);
  }

  hurtbox() {
    const h = this.data.hurtbox;
    const x = this.facing >= 0 ? this.x + h.x : this.x - h.x - h.w;
    return { x, y: this.y + h.y, w: h.w, h: h.h };
  }
  attackHitbox() {
    const m = this.move || RAPTOR_MOVES.punch;
    let h = m.hitbox;
    if (m.id === 'falcon' && this.phase2) h = m.hitboxP2;
    const o = (m.id === 'dive' || m.id === 'falcon') && this.mv.mark ? this.mv.mark : this;
    const x = this.facing >= 0 ? o.x + h.x : o.x - h.x - h.w;
    return { x, y: o.y + h.y, w: h.w, h: h.h };
  }

  /**
   * Zed's melee hit-request (EnemyManager forwards the player's HIT_REQUESTs). Raises the block when he is free (idle / approach, grounded, not in the
   * intro hold), off cooldown, and the swing started within reactRangePx. Never on rage moves or riposte requests.
   */
  onPlayerAttack(req) {
    if (!this.alive || !req || req.attackId === this.lastReactId || req.rage || req.riposte) return;
    const b = RAPTOR_BLOCK;
    if (this.state !== RaptorState.IDLE && this.state !== RaptorState.APPROACH) return;
    if (this.timer === Infinity || this.blockCdMs > 0 || this.airborne || this.running) return;
    const o = req.origin || { x: this.x, y: this.y };
    if (Math.hypot(o.x - this.x, o.y - this.y) > b.reactRangePx) return;
    this.lastReactId = req.attackId;
    this._beginBlock();
  }

  _beginBlock() {
    const b = RAPTOR_BLOCK;
    this.timer = b.holdMs; this.blockCdMs = b.cooldownMs * (this.phase2 ? this.data.p2.cooldownMult : 1);
    this.blockSeq++;
    this.move = null; this.marker = null; this.circling = false; this.kx = 0; this.lift = 0;
    this._set(RaptorState.BLOCK);
  }

  _range() { return this.getXRange ? this.getXRange() : { min: -1e9, max: 1e9 }; }
  _clampX(x, pad = 40) { const r = this._range(); return Math.min(r.max - pad, Math.max(r.min + pad, x)); }

  _hits(m) { return m.id === 'punch' && this.phase2 ? m.hitsP2 : m.hits; }

  _beginTelegraph(move) {
    const d = this.data, cm = this.phase2 ? d.p2.cooldownMult : 1;
    const t = this.target || { x: this.x + this.facing * 200, y: this.y };
    this.move = move;
    const hits = this._hits(move);
    this.variant = { id: move.id, kind: move.kind, hits, markIndex: move.id === 'punch' ? hits.length - 1 : move.markIndex, attackMs: move.attackMs };
    this.telegraphTotalMs = move.telegraphMs;
    this.timer = move.telegraphMs;
    this.lastMoveId = move.id;
    this.moveSeq++;
    this.cd[move.id] = d[`${move.id}CooldownMs`] * cm;
    this.mv = { ox: this.x, oy: this.y };
    this.marker = null;
    if (move.id === 'dive') {
      const mx = this._clampX(t.x, 30);
      this.mv.mark = { x: mx, y: t.y };
      this.marker = { kind: 'dive', x: mx, y: t.y, radius: move.markerRadius, grow: 0, locked: true };
    } else if (move.id === 'falcon') {
      this.mv.mark = { x: this._clampX(t.x, 30), y: t.y };
      this.marker = { kind: 'falcon', x: this.mv.mark.x, y: t.y, radius: move.markerRadius, grow: 0, locked: false };
    }
    this._set(RaptorState.TELEGRAPH);
  }

  _beginAttack() {
    const m = this.move;
    this.timer = m.attackMs; this.hitFired = false; this.hitIndex = 0;
    this.attackCounter++;               // one attackId per move
    this.mv.ax = this.x; this.mv.ay = this.y; this.mv.alift = this.lift;
    if (m.id === 'falcon') {
      this.marker.locked = true;
      this.x = this.mv.mark.x; this.y = this.mv.mark.y; this.mv.ax = this.x; this.mv.ay = this.y;
    }
    if (m.id === 'rush') {
      // Lock the stop point and start running. If he is already at the stop point there is no run (he never "runs in place").
      this.mv.stopX = this._rushStop(this.target); this.mv.runMs = 0; this.mv.runP = 0;
      const dist = Math.abs(this.mv.stopX - this.x);
      this.mv.runPlanMs = Math.max(1, Math.min(m.runMaxMs, dist * 1000 / this._runSpeed()));
      this.running = dist > 4;
    }
    this._set(RaptorState.ATTACK);
  }

  _runSpeed() { return this.move.runSpeed * (this.phase2 ? this.data.p2.rushSpeedMult : 1); }
  /** x where the run ends: stopPx short of Zed on his side, inside the fighting range. */
  _rushStop(t) {
    const m = this.move, tx = t ? t.x : this.x + this.facing * 200;
    const side = tx >= this.x ? -1 : 1;           // stop on the near side of Zed
    return this._clampX(tx + side * m.stopPx);
  }

  _emitHit(h, box, origin, facing, extra = '') {
    if (!this.hooks.onHitRequest) return;
    this.hooks.onHitRequest({
      attackerId: this.id, attackId: `${this.id}:${this.attackCounter}:${h.atMs}:${origin.x | 0}${extra}`, team: this.data.team,
      hitbox: { ...box }, origin: { x: origin.x, y: origin.y }, lane: origin.y, facing,
      damage: h.damage, knockback: h.knockback, hitstun: h.hitstun, pierceInvuln: !!h.pierceInvuln,
    });
  }

  /** @param {{x:number,y:number,lift?:number}|null} target */
  update(dtMs, target) {
    const d = this.data, dt = dtMs / 1000;
    this.vx = 0; this.vy = 0;
    if (this.state === RaptorState.DEAD) return;

    if (this.kx !== 0) {
      this.x += this.kx * dt;
      const dec = d.knockbackDecay * dt;
      this.kx = Math.abs(this.kx) <= dec ? 0 : this.kx - Math.sign(this.kx) * dec;
    }
    this.cooldownMs = Math.max(0, this.cooldownMs - dtMs);
    this.blockCdMs = Math.max(0, this.blockCdMs - dtMs);
    for (const k of Object.keys(this.cd)) this.cd[k] = Math.max(0, this.cd[k] - dtMs);
    this.target = target || null;

    if (target && (this.state === RaptorState.IDLE || this.state === RaptorState.APPROACH || this.state === RaptorState.TELEGRAPH || this.state === RaptorState.RECOVER || this.state === RaptorState.BLOCK)) {
      this.facing = target.x >= this.x ? 1 : -1;
    }

    switch (this.state) {
      case RaptorState.IDLE:
        this.timer -= dtMs;
        if (this.timer <= 0 && target) this._set(RaptorState.APPROACH);
        break;
      case RaptorState.APPROACH:
        if (target) this._approach(dt, target);
        break;
      case RaptorState.TELEGRAPH:
        this.timer -= dtMs;
        this._telegraphStep(1 - Math.max(0, this.timer) / this.telegraphTotalMs, target);
        if (this.timer <= 0) this._beginAttack();
        break;
      case RaptorState.ATTACK:
        this._attack(dtMs);
        break;
      case RaptorState.RECOVER:
        this.timer -= dtMs;
        if (this.timer <= 0) { this.cooldownMs = this.phase2 ? d.p2.moveCooldownMs : d.moveCooldownMs; this._set(RaptorState.APPROACH); }
        break;
      case RaptorState.BLOCK:   // stands still behind the guard, then drops it into a short recovery (the punish window)
        this.timer -= dtMs;
        if (this.timer <= 0) { this.timer = RAPTOR_BLOCK.recoverMs; this._set(RaptorState.RECOVER); }
        break;
      case RaptorState.HITSTUN:
        this.timer -= dtMs;
        if (this.timer <= 0) { this.cooldownMs = d.moveCooldownMs; this._set(RaptorState.APPROACH); }
        break;
    }
  }

  /** Wind-up motion and cues; p = 0..1 through the telegraph. */
  _telegraphStep(p, t) {
    const m = this.move, v = this.mv;
    if (m.id === 'dive') {
      this.lift = m.jumpLift * Math.sin(p * Math.PI / 2);
      this.x = this._clampX(lerp(v.ox, v.mark.x, 0.25 * p));
      this.marker.grow = p;
    } else if (m.id === 'punch' || m.id === 'rush') {
      this.lift = 0;   // plants his feet (the rush crouches here, then runs in the attack state)
    } else if (m.id === 'falcon') {
      this.lift = m.peakLift * p * p;
      if (t && p < m.trackUntil) {
        this.mv.mark = { x: this._clampX(t.x, 30), y: t.y };
        this.marker.x = this.mv.mark.x; this.marker.y = t.y;
      } else this.marker.locked = true;
      this.marker.grow = p;
    }
  }

  _attack(dtMs) {
    const m = this.move, v = this.mv;
    if (m.id === 'rush' && this.running) { this._runStep(dtMs); return; }   // run-in: no punches, the punch clock has not started
    this.timer -= dtMs;
    const el = m.attackMs - this.timer;
    this._attackStep(el, dtMs);
    const hits = this._hits(m);
    while (!this.hitFired && this.hitIndex < hits.length && el >= hits[this.hitIndex].atMs) {
      const h = hits[this.hitIndex++];
      if (this.hitIndex >= hits.length) this.hitFired = true;
      this._fire(m, h);
    }
    if (this.timer <= 0) { this.marker = null; this._endMove(m.recoverMs); }
    void v;
  }

  /** The rush's run-in: toward the (briefly tracked) stop point at runSpeed, lane-aligned with Zed; ends on arrival or at runMaxMs, then the punches start. */
  _runStep(dtMs) {
    const m = this.move, v = this.mv, dt = dtMs / 1000, t = this.target;
    v.runMs += dtMs;
    if (t && v.runMs < v.runPlanMs * m.trackUntil && (t.lift || 0) < RAPTOR_AIR_LIFT) v.stopX = this._rushStop(t);   // after that the point is locked: a Zed who jumps or dashes away makes him whiff
    const sp = this._runSpeed(), dx = v.stopX - this.x, step = sp * dt;
    this.facing = dx > 0 ? 1 : dx < 0 ? -1 : this.facing;
    const dir = Math.sign(dx);
    if (Math.abs(dx) <= step) { this.x = v.stopX; this.vx = dx / Math.max(dt, 1e-6); } else { this.x += dir * step; this.vx = dir * sp; }
    if (t) {   // slide into Zed's lane while running (never faster than the run itself)
      const dy = t.y - this.y, sy = Math.min(Math.abs(dy), sp * 0.5 * dt);
      this.y += Math.sign(dy) * sy; this.vy = Math.sign(dy) * sp * 0.5 * (sy > 0 ? 1 : 0);
    }
    v.runP = Math.min(1, v.runMs / v.runPlanMs);
    this.lift = 0;
    if (this.x === v.stopX || v.runMs >= m.runMaxMs) {
      this.running = false; v.runP = 1; this.vx = 0; this.vy = 0;
      if (t) this.facing = t.x >= this.x ? 1 : -1;   // squares up to Zed for the punches
      this.timer = m.attackMs;
    }
  }

  /** Scripted motion during the strike, derived from the elapsed time so it is deterministic. */
  _attackStep(el, dtMs) {
    const m = this.move, v = this.mv;
    if (m.id === 'dive') {
      const q = clamp01(el / m.flightMs);
      this.x = lerp(v.ax, v.mark.x, q); this.y = lerp(v.ay, v.mark.y, q);
      this.lift = lerp(v.alift, 0, q * q);
    } else if (m.id === 'punch' || m.id === 'rush') {
      this.lift = 0;   // stands still: no lift, no drift
    } else if (m.id === 'falcon') {
      const q = clamp01(el / m.fallMs);
      this.lift = m.peakLift * (1 - q * q);
      this.x = v.mark.x; this.y = v.mark.y;
    }
  }

  _fire(m, h) {
    const v = this.mv;
    if (m.id === 'dive') {
      if (h.echo && !this.phase2) return;
      const box = h.echo ? m.hitboxEcho : m.hitbox;
      this._emitHit(h, box, v.mark, this.facing);
      this.impactSeq++; this.impact = { x: v.mark.x, y: v.mark.y, kind: h.echo ? 'echo' : 'dive' };
      if (!h.echo) this.marker = null;
    } else if (m.id === 'falcon') {
      this._emitHit(h, this.phase2 ? m.hitboxP2 : m.hitbox, v.mark, this.facing);
      this.impactSeq++; this.impact = { x: v.mark.x, y: v.mark.y, kind: 'falcon' };
      this.marker = null; this.lift = 0;
    } else {
      this._emitHit(h, m.hitbox, this, this.facing);
    }
  }

  _endMove(recoverMs) {
    this.lift = 0;
    this.timer = recoverMs;
    this._set(RaptorState.RECOVER);
  }

  _ready() {
    const c = this.cd;
    return { dive: c.dive <= 0, punch: c.punch <= 0, falcon: c.falcon <= 0, rush: c.rush <= 0 };
  }

  _approach(dt, t) {
    const d = this.data;
    const dx = t.x - this.x, dy = t.y - this.y;
    const dist = Math.hypot(dx, dy) || 0.0001;
    this.circling = false; this.lift = 0;
    if (this.cooldownMs <= 0) {
      const mv = pickRaptorMove({ dist, dy, lift: t.lift || 0, ready: this._ready(), lastId: this.lastMoveId }, this.rng, d);
      if (mv) {
        if (this.slots.tryAcquire(this.id)) { this._beginTelegraph(mv); return; }
        this.circling = true;            // no slot free: hold his ground (flagged so the failsafe does not read it as stuck)
        return;
      }
    }
    const want = this.cd.punch <= 0 ? d.punchClosePx : d.nearPx;   // flurry ready: close to punching range
    if (dist > want) { this._move(dx / dist, dy / dist, this.speed, dt); return; }
    this.circling = true;
    // Too close for any move (Dive Kick and Falcon Drop have a minimum range): back off along the floor until a move fits.
    // Without this he sat on top of Zed and drifted down the lanes forever.
    if (Math.abs(dx) < d.backOffPx) {
      const away = dx > 0 ? -1 : 1;
      const r = this._range(), room = away < 0 ? this.x - (r.min + 60) : (r.max - 60) - this.x;
      if (room > 10) { this._move(away, 0, this.speed, dt); return; }
    }
    // in his band: line up with Zed's lane, then stand and wait for the next opening (no endless strafing)
    const laneY = Math.min(d.strafeLaneMax, Math.max(d.strafeLaneMin, t.y));
    const off = laneY - this.y;
    if (Math.abs(off) > 24) this._move(0, Math.sign(off), d.circleSpeed * (this.phase2 ? d.p2.speedMult : 1), dt);
  }

  _move(ux, uy, speed, dt) {
    this.vx = ux * speed; this.vy = uy * speed;
    this.x += this.vx * dt; this.y += this.vy * dt;
  }

  /**
   * React to damage combat applied. Ordinary hits never stun him and nudge him only between moves; a parry stun does stun him, cancels the
   * move and drops him to the floor. Half health starts the frenzy.
   */
  takeHit({ hitstun = 0, knockback = 0, parry = false, hpAfter = null, blocked = false } = {}) {
    if (!this.alive) return;
    if (blocked) { this.guardHitSeq++; return; }   // absorbed by the guard: 0 damage, nothing else changes
    if (hpAfter !== null && hpAfter !== undefined) {
      this.hp = hpAfter;
      if (!this.phase2 && this.hp / this.maxHp <= RAPTOR_PHASE2_AT) { this.phase2 = true; this.phase2Seq++; }
    }
    if (!parry) {
      if (this.state !== RaptorState.ATTACK && this.state !== RaptorState.TELEGRAPH && this.state !== RaptorState.BLOCK) this.kx = knockback * this.data.knockbackScale;
      return;
    }
    this.hitFired = true; this.kx = 0; this.lift = 0; this.running = false; this.vx = 0; this.vy = 0;
    this.marker = null;
    this.timer = Math.max(hitstun, this.data.parryStunMs);
    this.hitstunMs = this.timer;
    this.hitSeq++;
    this._set(RaptorState.HITSTUN);
  }

  die() {
    if (!this.alive) return;
    this.kx = 0; this.lift = 0; this.marker = null; this.running = false;
    this._set(RaptorState.DEAD);
    if (this.hooks.onDeath) this.hooks.onDeath();
  }

  /** Story-card intro: stop where he is and stand in his idle pose until releaseIdle(). */
  holdIdle() {
    if (!this.alive) return;
    this.vx = 0; this.vy = 0; this.kx = 0; this.lift = 0;
    this.timer = Infinity;
    this._set(RaptorState.IDLE);
  }

  /** End the intro hold: he starts his approach on the next update. */
  releaseIdle() {
    if (this.state === RaptorState.IDLE && this.timer === Infinity) this.timer = 0;
  }

  teleport(x, y) { this.x = x; this.y = y; this.kx = 0; this.lift = 0; }
}
