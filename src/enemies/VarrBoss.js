// Overseer Halden Varr AI: Level 8 final boss. Pure state machine, no Phaser. Same public shape as GlitchBoss / KaneBoss so EnemyManager,
// ArenaFailsafe, EnemyHitFx and the scene's cue ring treat him like any other enemy.
//
// States: idle -> approach -> telegraph -> attack -> recover -> approach; hitstun (parry or broken shield); transform (phase change); dead.
// Phase 1 "Authority": Authority Strike, Command Shield (negates blows from the front, flank it or break it), Command Override (summons crew),
//   Adaptive Counter (stance read off Zed's play: anti-air / anti-rush / anti-combo).
// At 30 % HP (the level of damage is floored there, see `hpFloor`) he cannot be hurt: TRANSFORM. Halfway through it his HP is RESTORED
//   (hooks.onRestoreHp), then phase 2 "Rust Protocol" starts with its own move set: Hybrid Assault (slam, taser, combo, control pulse),
//   Drone Command and Rust Collapse. Collapse makes him RELENTLESS: faster, tiny recoveries, and the arena walls electrify (hooks.onWalls).
import { VARR, VARR_MOVES, VARR_ID, VARR_PHASE2_AT, VARR_P2_RESTORE, VARR_COLLAPSE_AT, VARR_SUMMON_KINDS, pickVarrMove, counterStance } from './varrData.js';
import { AttackSlots } from './AttackSlots.js';
import { PARRY_CUE_LEAD_MS } from './gruntData.js';

export const VarrState = {
  IDLE: 'idle', APPROACH: 'approach', TELEGRAPH: 'telegraph', ATTACK: 'attack', RECOVER: 'recover',
  HITSTUN: 'hitstun', TRANSFORM: 'transform', DEAD: 'dead',
};

const ACTIVE = new Set([VarrState.IDLE, VarrState.APPROACH, VarrState.TELEGRAPH, VarrState.RECOVER]);

export class VarrBoss {
  /**
   * @param {object} o
   * @param {string} o.id @param {number} o.x @param {number} o.y
   * @param {AttackSlots} [o.slots] shared attacker cap
   * @param {object} [o.data] stats table (defaults to VARR)
   * @param {object} [o.hooks] { onHitRequest(info), onProjectileRequest(spec), onSummon({kind}), onRestoreHp(share), onPhaseChange(phase),
   *   onWalls(on), onStateChange(next, prev), onDeath() }
   * @param {() => {min:number,max:number}} [o.getXRange] fighting range (walls)
   * @param {() => number} [o.rng]
   */
  constructor({ id, x = 0, y = 0, slots, data = VARR, hooks = {}, maxHp = data.maxHp, getXRange = null, rng = Math.random }) {
    this.id = id; this.x = x; this.y = y;
    this.data = data;
    this.slots = slots || new AttackSlots(2);
    this.hooks = hooks; this.getXRange = getXRange; this.rng = rng;
    this.maxHp = maxHp; this.hp = maxHp;
    this.isBoss = false;
    this.miniBoss = true;
    this.skin = VARR_ID;
    this.visualScale = data.visualScale;
    this.facing = -1;
    this.vx = 0; this.vy = 0; this.kx = 0;
    this.state = VarrState.IDLE;
    this.timer = data.spawnIdleMs;
    this.move = null;
    this.variant = { id: 'idle', kind: 'strike', hits: [{ atMs: 0 }], markIndex: 0, attackMs: 0 };
    this.lastMoveId = null;
    this.telegraphTotalMs = 0;
    this.hitFired = false; this.hitIndex = 0; this.attackCounter = 0;
    this.hitstunMs = 0; this.hitSeq = 0;
    this.cooldownMs = data.moveCooldownMs;
    this.cd = {
      strike: 0, shield: data.shieldFirstMs, override: data.overrideFirstMs,
      slam: 0, taser: 0, combo: 0, control: 0, drones: 0, collapse: 0,
    };
    this.moveSeq = 0;               // bumps at every wind-up so the renderer restarts the move's clip
    this.phase = 1;                 // 1 Authority, 2 Rust Protocol
    this.relentless = false;        // after Rust Collapse
    this.wallsLive = false;         // arena walls electrified
    this.collapseDone = false;
    this.shieldHp = 0;              // > 0 while the Command Shield is up
    this.shieldSeq = 0; this.shieldBreakSeq = 0; this.collapseSeq = 0; this.transformSeq = 0; this.summonSeq = 0; this.droneSeq = 0; this.tasersSeq = 0;
    this.summoned = new Set();      // ids of crew he called (EnemyManager reports them gone via crewGone)
    this.stance = null; this.stanceLeftMs = 0; this.stanceSeq = 0;   // stanceSeq bumps when a new stance is taken (renderer plays the Adaptive Counter clip)
    this._cw = { jumps: [], rushes: [], hits: [] };   // Adaptive Counter evidence: timestamps (ms of boss time)
    this._clock = 0; this._lastLift = 0; this._lastDist = null;
    this._transformT = 0; this._restored = false;
    this._wallZapMs = 0;
    this._laid = false;
    this.droneLanes = [];            // lanes of the beat that fired last (renderer flashes them)
    this.target = null;
    this.circling = false;
  }

  get alive() { return this.state !== VarrState.DEAD; }
  get telegraphing() { return this.state === VarrState.TELEGRAPH; }
  get telegraphProgress() { return this.telegraphing ? 1 - this.timer / this.telegraphTotalMs : 0; }
  get enraged() { return this.phase === 2; }
  /** True while the Command Shield is raised: the hit resolver negates blows from the front. */
  get shieldUp() { return this.shieldHp > 0 && this.state === VarrState.ATTACK && this.move?.id === 'shield'; }
  /** Cannot be hurt at all (the phase change). */
  get invulnerable() { return this.state === VarrState.TRANSFORM; }
  /** Phase 1 damage stops here, so no single blow can skip the phase change. null once he is in phase 2. */
  get hpFloor() { return this.phase === 1 ? Math.ceil(this.maxHp * VARR_PHASE2_AT) : null; }
  get cueClockMs() {
    if (!this.move || !(this.move.kind === 'strike' || this.move.kind === 'finisher')) return null;
    if (this.state === VarrState.TELEGRAPH) return this.telegraphTotalMs - this.timer;
    if (this.state === VarrState.ATTACK) return this.telegraphTotalMs + (this.variant.attackMs - this.timer);
    return null;
  }
  get parryMarkMs() { return this.telegraphTotalMs + this.variant.hits[this.variant.markIndex].atMs - PARRY_CUE_LEAD_MS; }
  get speed() {
    const d = this.data;
    return d.moveSpeed * (this.relentless ? d.relentless.speedMult : this.phase === 2 ? d.p2.speedMult : 1);
  }
  get recoverMult() { return this.relentless ? this.data.relentless.recoverMult : this.phase === 2 ? this.data.p2.recoverMult : 1; }
  get moveCooldown() { return this.relentless ? this.data.relentless.moveCooldownMs : this.phase === 2 ? this.data.p2.moveCooldownMs : this.data.moveCooldownMs; }

  _set(next) {
    const prev = this.state;
    if (prev === next) return;
    this.state = next;
    if (next !== VarrState.TELEGRAPH && next !== VarrState.ATTACK) this.slots.release(this.id);
    if (this.hooks.onStateChange) this.hooks.onStateChange(next, prev);
  }

  hurtbox() {
    const h = this.data.hurtbox;
    const x = this.facing >= 0 ? this.x + h.x : this.x - h.x - h.w;
    return { x, y: this.y + h.y, w: h.w, h: h.h };
  }
  attackHitbox() {
    const m = this.move || VARR_MOVES.strike;
    const h = m.hitbox;
    const reach = m.id === 'strike' && this.stance === 'anti-air' ? this.data.stanceStrikeReachMult : 1;
    const w = h.w * reach;
    const x = this.facing >= 0 ? this.x + h.x : this.x - h.x - w;
    return { x, y: this.y + h.y, w, h: h.h };
  }
  _range() { return this.getXRange ? this.getXRange() : { min: -1e9, max: 1e9 }; }

  _ready() {
    const r = {};
    for (const k of Object.keys(this.cd)) r[k] = this.cd[k] <= 0;
    // phase gating: phase-1 moves are gone in phase 2 and vice versa
    for (const m of Object.values(VARR_MOVES)) if (m.phase !== this.phase) r[m.id] = false;
    return r;
  }

  _beginTelegraph(move) {
    const d = this.data;
    this.move = move;
    this.variant = { id: move.id, kind: move.kind, hits: move.hits.length ? move.hits : [{ atMs: 0 }], markIndex: move.markIndex, attackMs: move.attackMs };
    let tele = move.telegraphMs;
    if (move.id === 'strike' && (this.stance === 'anti-rush' || this.stance === 'anti-air')) tele = Math.round(tele * d.stanceStrikeTelegraphMult);
    this.telegraphTotalMs = tele;
    this.timer = tele;
    this.lastMoveId = move.id;
    this.moveSeq++;
    const cm = this.relentless ? d.relentless.cooldownMult : 1;
    const p2 = d.p2;
    const cds = {
      shield: d.shieldCooldownMs, override: d.overrideCooldownMs, strike: 0,
      slam: p2.slamCooldownMs, taser: p2.taserCooldownMs, combo: p2.comboCooldownMs, control: p2.controlCooldownMs, drones: p2.dronesCooldownMs,
    };
    if (move.id in cds) this.cd[move.id] = cds[move.id] * cm;
    if (move.id === 'collapse') { this.cd.collapse = 1e9; this.collapseSeq++; }
    this._set(VarrState.TELEGRAPH);
  }

  _beginAttack() {
    const m = this.move, d = this.data;
    this.timer = m.attackMs; this.hitFired = false; this.hitIndex = 0;
    this.attackCounter++;
    if (m.id === 'shield') {
      this.shieldHp = Math.round(m.shieldHp * (this.stance === 'anti-combo' ? d.stanceShieldHpMult : 1));
      this.shieldSeq++;
    }
    this._set(VarrState.ATTACK);
  }

  _emitHit(h, box, origin, facing, { aoe = false } = {}) {
    if (!this.hooks.onHitRequest) return;
    this.hooks.onHitRequest({
      attackerId: this.id, attackId: `${this.id}:${this.attackCounter}:${h.atMs}:${origin.x | 0}`, team: this.data.team,
      hitbox: { ...box }, origin: { x: origin.x, y: origin.y }, lane: aoe ? null : origin.y, facing,
      damage: h.damage, knockback: h.knockback, hitstun: h.hitstun, pierceInvuln: !!h.pierceInvuln,
    });
  }

  _shoot(shot, laneY, x = this.x + this.facing * (shot.muzzle ? shot.muzzle.x : 40)) {
    if (!this.hooks.onProjectileRequest) return;
    this.hooks.onProjectileRequest({
      ownerId: this.id, x, y: laneY, lane: laneY, facing: this.facing,
      spec: { speed: shot.speed, maxDist: shot.maxDist, hitbox: shot.hitbox, muzzle: shot.muzzle, damage: shot.damage, knockback: shot.knockback, hitstun: shot.hitstun },
      damage: shot.damage, knockback: shot.knockback, hitstun: shot.hitstun,
    });
  }

  /** @param {{x:number,y:number,lift?:number}|null} target */
  update(dtMs, target) {
    const d = this.data, dt = dtMs / 1000;
    this.vx = 0; this.vy = 0;
    if (this.state === VarrState.DEAD) return;
    this._clock += dtMs;

    if (this.kx !== 0) {
      this.x += this.kx * dt;
      const dec = d.knockbackDecay * dt;
      this.kx = Math.abs(this.kx) <= dec ? 0 : this.kx - Math.sign(this.kx) * dec;
    }
    this.cooldownMs = Math.max(0, this.cooldownMs - dtMs);
    for (const k of Object.keys(this.cd)) this.cd[k] = Math.max(0, this.cd[k] - dtMs);
    this.target = target || null;
    this._watchZed(dtMs, target);
    this._wallStep(dtMs);

    if (target && ACTIVE.has(this.state)) this.facing = target.x >= this.x ? 1 : -1;

    switch (this.state) {
      case VarrState.IDLE:
        this.timer -= dtMs;
        if (this.timer <= 0 && target) this._set(VarrState.APPROACH);
        break;
      case VarrState.APPROACH:
        if (target) this._approach(dt, target);
        break;
      case VarrState.TELEGRAPH:
        this.timer -= dtMs;
        if (this.timer <= 0) this._beginAttack();
        break;
      case VarrState.ATTACK:
        this._attack(dtMs);
        break;
      case VarrState.RECOVER:
        this.timer -= dtMs;
        if (this.timer <= 0) { this.cooldownMs = this.moveCooldown; this._set(VarrState.APPROACH); }
        break;
      case VarrState.HITSTUN:
        this.timer -= dtMs;
        if (this.timer <= 0) { this.cooldownMs = this.moveCooldown; this._set(VarrState.APPROACH); }
        break;
      case VarrState.TRANSFORM:
        this._transformStep(dtMs);
        break;
    }
  }

  // ---- Adaptive Counter: watch how Zed plays, pick a stance ----
  _watchZed(dtMs, target) {
    const c = this.data.counter, now = this._clock;
    if (this.stanceLeftMs > 0) { this.stanceLeftMs -= dtMs; if (this.stanceLeftMs <= 0) this.stance = null; }
    if (!target || this.phase !== 1) { this._lastDist = null; return; }
    const lift = target.lift || 0;
    if (lift > 0 && this._lastLift <= 0) this._cw.jumps.push(now);
    this._lastLift = lift;
    const dist = Math.abs(target.x - this.x);
    if (this._lastDist !== null && dtMs > 0 && dist > 200) {
      const closing = (this._lastDist - dist) / (dtMs / 1000);
      if (closing >= c.rushSpeed && !(this._rushing)) { this._cw.rushes.push(now); this._rushing = true; }
      if (closing < c.rushSpeed * 0.5) this._rushing = false;
    }
    this._lastDist = dist;
    for (const k of ['jumps', 'rushes', 'hits']) this._cw[k] = this._cw[k].filter((t) => now - t <= c.windowMs);
    const s = counterStance({ jumps: this._cw.jumps.length, rushes: this._cw.rushes.length, comboHits: this._chain() });
    if (s && s !== this.stance) { this.stance = s; this.stanceLeftMs = c.stanceMs; this.stanceSeq++; this._cw = { jumps: [], rushes: [], hits: [] }; this._rushing = false; }
  }
  /** Longest run of Zed's hits on him where each came within comboGapMs of the last. */
  _chain() {
    const h = this._cw.hits, gap = this.data.counter.comboGapMs;
    let best = 0, run = 0;
    for (let i = 0; i < h.length; i++) { run = i > 0 && h[i] - h[i - 1] <= gap ? run + 1 : 1; if (run > best) best = run; }
    return best;
  }

  // ---- walls (after Rust Collapse) ----
  _wallStep(dtMs) {
    if (!this.wallsLive) return;
    this._wallZapMs = Math.max(0, this._wallZapMs - dtMs);
    const t = this.target, r = this._range();
    if (!t || this._wallZapMs > 0 || !this.hooks.onHitRequest) return;
    const edge = this.data.relentless.wallEdgePx;
    if (t.x > r.min + edge && t.x < r.max - edge) return;
    const rl = this.data.relentless;
    this._wallZapMs = rl.wallZapMs;
    this.attackCounter++;
    this.hooks.onHitRequest({
      attackerId: this.id, attackId: `${this.id}:wall:${this.attackCounter}`, team: this.data.team,
      hitbox: { x: -34, y: -92, w: 68, h: 92 }, origin: { x: t.x, y: t.y }, lane: t.y, facing: 1,
      damage: rl.wallZapDamage, knockback: 160 * (t.x < (r.min + r.max) / 2 ? 1 : -1), hitstun: rl.wallZapHitstun, pierceInvuln: false,
    });
  }

  _attack(dtMs) {
    const m = this.move;
    this.timer -= dtMs;
    const elapsed = m.attackMs - this.timer;
    while (!this.hitFired && this.hitIndex < m.hits.length && elapsed >= m.hits[this.hitIndex].atMs) {
      const h = m.hits[this.hitIndex++];
      if (this.hitIndex >= m.hits.length) this.hitFired = true;
      this._fire(m, h);
    }
    if (this.timer <= 0) {
      if (m.id === 'collapse') this._startRelentless();
      this.shieldHp = 0;
      this.timer = Math.round(m.recoverMs * this.recoverMult);
      this._set(VarrState.RECOVER);
    }
  }

  _fire(m, h) {
    if (h.summon) { this._summon(); return; }
    if (h.shot === 'taser') { this.tasersSeq++; this._shoot(m.shot, this.y); return; }
    if (h.shot === 'drone') {
      this.droneSeq++;
      this.droneLanes = this._droneLanes(h.n);
      for (const ly of this.droneLanes) this._shoot(m.shot, ly, this.x);
      return;
    }
    if (h.aoe) { this._emitHit(h, m.hitbox, this, this.facing, { aoe: true }); return; }
    if (m.kind === 'guard') return;
    const reach = m.id === 'strike' && this.stance === 'anti-air' ? this.data.stanceStrikeReachMult : 1;   // anti-air stance: longer reach
    this._emitHit(h, { ...m.hitbox, w: m.hitbox.w * reach }, this, this.facing);
  }

  /** Lane depths (y) the drone beat `n` fires along: the pattern's offsets around Zed's depth, kept inside the arena floor. */
  _droneLanes(n) {
    const m = VARR_MOVES.drones, t = this.target || { y: this.y };
    return m.patterns[n % m.patterns.length].map((o) => Math.min(700, Math.max(440, t.y + o)));
  }
  /** While Drone Command winds up / fires: the beat about to fire and its lanes (for the renderer's laser warning lines). null otherwise. */
  get droneTelegraph() {
    if (!this.alive || this.move?.id !== 'drones') return null;
    if (this.state === VarrState.TELEGRAPH) return { beat: 0, lanes: this._droneLanes(0) };
    if (this.state === VarrState.ATTACK && this.hitIndex < this.move.hits.length) return { beat: this.hitIndex, lanes: this._droneLanes(this.hitIndex) };
    return null;
  }

  /** Command Override: call one crew member; capped at the move's maxAlive. */
  _summon() {
    const alive = this.summoned.size;
    if (alive >= VARR_MOVES.override.maxAlive || !this.hooks.onSummon) return;
    const kind = VARR_SUMMON_KINDS[Math.min(VARR_SUMMON_KINDS.length - 1, Math.floor(this.rng() * VARR_SUMMON_KINDS.length))];
    this.summonSeq++;
    this.hooks.onSummon({ kind, seq: this.summonSeq });
  }
  /** EnemyManager tells him a summoned unit exists / is gone so the cap holds. */
  crewAdded(id) { this.summoned.add(id); }
  crewGone(id) { this.summoned.delete(id); }

  _startRelentless() {
    this.relentless = true; this.collapseDone = true; this.wallsLive = true; this._wallZapMs = 600;
    if (this.hooks.onWalls) this.hooks.onWalls(true);
  }

  _approach(dt, t) {
    const d = this.data;
    const dx = t.x - this.x, dy = t.y - this.y;
    const dist = Math.abs(dx);
    this.circling = false;
    if (this.cooldownMs <= 0) {
      const p2share = this.phase === 2 ? this.hp / this.maxHp : 1;
      const mv = pickVarrMove({
        phase: this.phase, dist: Math.hypot(dx, dy), dy, lift: t.lift || 0, ready: this._ready(), lastId: this.lastMoveId, stance: this.stance,
        collapseDue: this.phase === 2 && !this.collapseDone && p2share <= VARR_COLLAPSE_AT, summonsAlive: this.summoned.size,
      }, this.rng, d);
      if (mv) {
        const meleeLane = (mv.kind === 'strike' || mv.kind === 'finisher') && mv.maxRange <= 340;
        if (meleeLane && Math.abs(dy) > d.laneTolerance) { this._move(0, Math.sign(dy), d.circleSpeed * (this.speed / d.moveSpeed), dt); return; }
        if (this.slots.tryAcquire(this.id)) { this._beginTelegraph(mv); return; }
        this.circling = true;
        return;
      }
    }
    // walk in; line up in depth when close
    if (dist > d.keepNearPx) { this._move(Math.sign(dx), Math.abs(dy) > d.laneTolerance ? Math.sign(dy) * 0.5 : 0, this.speed, dt); return; }
    if (Math.abs(dy) > d.laneTolerance * 0.6) this._move(0, Math.sign(dy), d.circleSpeed, dt);
    else this.circling = true;
  }

  _move(ux, uy, speed, dt) {
    this.vx = ux * speed; this.vy = uy * speed;
    this.x += this.vx * dt; this.y += this.vy * dt;
  }

  // ---- phase change ----
  _beginTransform() {
    this.hp = this.hpFloor;                 // exactly on the floor
    this.kx = 0; this.shieldHp = 0; this.move = null; this.hitFired = true;
    this.timer = this.data.transformMs; this._transformT = 0; this._restored = false;
    this.transformSeq++;
    this._set(VarrState.TRANSFORM);
  }
  _transformStep(dtMs) {
    this._transformT += dtMs;
    if (!this._restored && this._transformT >= this.data.restoreAtMs) {
      this._restored = true;
      this.hp = Math.max(this.hp, Math.ceil(this.maxHp * VARR_P2_RESTORE));
      if (this.hooks.onRestoreHp) this.hooks.onRestoreHp(VARR_P2_RESTORE);
    }
    this.timer -= dtMs;
    if (this.timer <= 0) {
      this.phase = 2; this.stance = null; this.stanceLeftMs = 0;
      const p2 = this.data.p2;
      this.cd = { strike: 0, shield: 1e9, override: 1e9, slam: p2.slamFirstMs, taser: p2.taserFirstMs, combo: p2.comboFirstMs, control: p2.controlFirstMs, drones: p2.dronesFirstMs, collapse: 0 };
      this.cooldownMs = 600; this.lastMoveId = null;
      if (this.hooks.onPhaseChange) this.hooks.onPhaseChange(2);
      this._set(VarrState.APPROACH);
    }
  }

  /**
   * React to damage combat applied. `shield: true` = the Command Shield absorbed a frontal blow (`shieldDmg` of it): enough of them break it.
   * Ordinary hits never stun him; a parry does. Reaching the phase-1 floor starts the transformation.
   */
  takeHit({ hitstun = 0, knockback = 0, parry = false, hpAfter = null, shield = false, shieldDmg = 0 } = {}) {
    if (!this.alive || this.state === VarrState.TRANSFORM) return;
    if (shield) {
      this._cw.hits.push(this._clock);
      this.shieldHp -= Math.max(1, shieldDmg);
      if (this.shieldHp <= 0) {                       // shield broken: he is staggered
        this.shieldHp = 0; this.shieldBreakSeq++;
        this.hitFired = true; this.kx = 0;
        this.timer = this.move?.brokenStunMs ?? 1500; this.hitstunMs = this.timer; this.hitSeq++;
        this._set(VarrState.HITSTUN);
      }
      return;
    }
    if (hpAfter !== null && hpAfter !== undefined) {
      if (hpAfter < this.hp) this._cw.hits.push(this._clock);
      this.hp = hpAfter;
      if (this.phase === 1 && this.hp <= this.hpFloor) { this._beginTransform(); return; }
    }
    if (!parry) { this.kx = knockback * this.data.knockbackScale; return; }
    this.hitFired = true; this.kx = 0; this.shieldHp = 0;
    this.timer = Math.max(hitstun, this.data.parryStunMs);
    this.hitstunMs = this.timer;
    this.hitSeq++;
    this._set(VarrState.HITSTUN);
  }

  die() {
    if (!this.alive) return;
    this.kx = 0; this.shieldHp = 0;
    if (this.wallsLive) { this.wallsLive = false; if (this.hooks.onWalls) this.hooks.onWalls(false); }
    this._set(VarrState.DEAD);
    if (this.hooks.onDeath) this.hooks.onDeath();
  }

  /** Story-card intro: stop where he is and stand in his idle pose until releaseIdle(). */
  holdIdle() {
    if (!this.alive) return;
    this.vx = 0; this.vy = 0; this.kx = 0;
    this.timer = Infinity;
    this._set(VarrState.IDLE);
  }

  /** End the intro hold: he starts his approach on the next update. */
  releaseIdle() {
    if (this.state === VarrState.IDLE && this.timer === Infinity) this.timer = 0;
  }

  teleport(x, y) { this.x = x; this.y = y; this.kx = 0; }
}
