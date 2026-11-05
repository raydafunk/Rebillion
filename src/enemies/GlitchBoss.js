// "Glitch" AI: Level 4 mini-boss. Pure state machine, no Phaser. Same public shape as KaneBoss / RoyceBoss so EnemyManager,
// ArenaFailsafe, EnemyHitFx and the scene's cue ring treat him like any other enemy.
// States: idle -> approach -> telegraph -> attack -> recover -> approach; hitstun (parry only); dead.
// Moves (glitchData.js): Shock Disk Throw, Drone Barrage, Hologram Duplicate, Data Spike, Emergency Teleport.
// He is the evasive one: he keeps his distance (backs off when Zed closes in), takes an attacker slot before every move, ignores ordinary hitstun
// (no juggle loops) and barely moves when hit. At half health he OVERCLOCKS: faster, shorter cooldowns, bigger volleys, two decoys, a double spike.
// Emergency Teleport fires when Zed gets close and at each health threshold (50 %, 25 %); he is helpless for a moment on arrival.
import { GLITCH, GLITCH_MOVES, GLITCH_ID, GLITCH_PHASE2_AT, GLITCH_TELEPORT_AT, pickGlitchMove } from './glitchData.js';
import { AttackSlots } from './AttackSlots.js';
import { PARRY_CUE_LEAD_MS } from './gruntData.js';

export const GlitchState = {
  IDLE: 'idle', APPROACH: 'approach', TELEGRAPH: 'telegraph',
  ATTACK: 'attack', RECOVER: 'recover', HITSTUN: 'hitstun', DEAD: 'dead',
};

const MELEE_FORGET_PX = 1.6;
const EDGE_INSET = 90;           // keeps clear of the fighting range's edge when backing away

export class GlitchBoss {
  /**
   * @param {object} o
   * @param {string} o.id @param {number} o.x @param {number} o.y
   * @param {AttackSlots} [o.slots] shared attacker cap
   * @param {object} [o.data] stats table (defaults to GLITCH)
   * @param {object} [o.hooks] { onHitRequest(info), onProjectileRequest(spec), onStateChange(next, prev), onDeath() }
   * @param {() => {min:number,max:number}} [o.getXRange] fighting range: teleports and decoys stay inside it
   * @param {() => number} [o.rng]
   */
  constructor({ id, x = 0, y = 0, slots, data = GLITCH, hooks = {}, maxHp = data.maxHp, getXRange = null, rng = Math.random }) {
    this.id = id; this.x = x; this.y = y;
    this.data = data;
    this.slots = slots || new AttackSlots(2);
    this.hooks = hooks; this.getXRange = getXRange; this.rng = rng;
    this.maxHp = maxHp; this.hp = maxHp;
    this.isBoss = false;            // that flag means Dugan's art and voice
    this.miniBoss = true;
    this.skin = GLITCH_ID;
    this.visualScale = data.visualScale;
    this.facing = -1;
    this.vx = 0; this.vy = 0; this.kx = 0;
    this.state = GlitchState.IDLE;
    this.timer = data.spawnIdleMs;
    this.move = null;               // the GLITCH_MOVES entry in progress
    this.variant = { id: 'idle', kind: 'strike', hits: [{ atMs: 0 }], markIndex: 0, attackMs: 0 };
    this.lastMoveId = null;
    this.telegraphTotalMs = 0;
    this.hitFired = false; this.hitIndex = 0; this.attackCounter = 0;
    this.hitstunMs = 0; this.hitSeq = 0;
    this.circling = false;
    this.cooldownMs = data.moveCooldownMs;
    this.cd = { disk: data.diskFirstMs, drones: data.dronesFirstMs, decoy: data.decoyFirstMs, spike: data.spikeFirstMs, teleport: data.teleportFirstMs };
    this.moveSeq = 0;               // bumps at every wind-up so the renderer restarts the move's clip
    this.decoys = [];               // Hologram Duplicates: { id, x, y, facing, state: 'warn'|'live'|'done', lifeLeft }
    this.decoySeq = 0;
    this.teleportSeq = 0;           // bumps at the blink so the renderer fires the flash once
    this.teleportFrom = { x, y };
    this.diskSeq = 0; this.droneSeq = 0; this.spikeSeq = 0;
    this.phase2 = false;
    this.thresholdsLeft = [...GLITCH_TELEPORT_AT];
    this.forceTeleport = false;
    this.telegraphDir = 1;
    this.target = null;
    this.burstLeft = 0; this.burstMs = 0;     // phase 2: a second disk follows the first
  }

  get alive() { return this.state !== GlitchState.DEAD; }
  get telegraphing() { return this.state === GlitchState.TELEGRAPH; }
  get telegraphProgress() { return this.telegraphing ? 1 - this.timer / this.telegraphTotalMs : 0; }
  get enraged() { return this.phase2; }
  /** The parry ring only follows the melee-style Data Spike; shots, decoy and teleport have their own readable cues. */
  get cueClockMs() {
    if (!this.move || this.move.id !== 'spike') return null;
    if (this.state === GlitchState.TELEGRAPH) return this.telegraphTotalMs - this.timer;
    if (this.state === GlitchState.ATTACK) return this.telegraphTotalMs + (this.variant.attackMs - this.timer);
    return null;
  }
  get parryMarkMs() { return this.telegraphTotalMs + this.variant.hits[this.variant.markIndex].atMs - PARRY_CUE_LEAD_MS; }
  /** Speed now: overclock boosts it. */
  get speed() { return this.data.moveSpeed * (this.phase2 ? this.data.p2.speedMult : 1); }

  _set(next) {
    const prev = this.state;
    if (prev === next) return;
    this.state = next;
    if (next !== GlitchState.TELEGRAPH && next !== GlitchState.ATTACK) this.slots.release(this.id);
    if (this.hooks.onStateChange) this.hooks.onStateChange(next, prev);
  }

  hurtbox() {
    const h = this.data.hurtbox;
    const x = this.facing >= 0 ? this.x + h.x : this.x - h.x - h.w;
    return { x, y: this.y + h.y, w: h.w, h: h.h };
  }
  attackHitbox() {
    const h = (this.move || GLITCH_MOVES.spike).hitbox;
    const x = this.facing >= 0 ? this.x + h.x : this.x - h.x - h.w;
    return { x, y: this.y + h.y, w: h.w, h: h.h };
  }

  _range() { return this.getXRange ? this.getXRange() : { min: -1e9, max: 1e9 }; }

  _beginTelegraph(move) {
    this.move = move;
    this.variant = { id: move.id, kind: move.kind, hits: move.hits, markIndex: move.markIndex, attackMs: move.attackMs };
    this.telegraphTotalMs = move.telegraphMs;
    this.timer = move.telegraphMs;
    this.lastMoveId = move.id;
    this.moveSeq++;
    const d = this.data, cm = this.phase2 ? d.p2.cooldownMult : 1;
    if (move.id === 'disk') this.cd.disk = d.diskCooldownMs * cm;
    if (move.id === 'drones') this.cd.drones = d.dronesCooldownMs * cm;
    if (move.id === 'spike') this.cd.spike = d.spikeCooldownMs * cm;
    if (move.id === 'teleport') { this.cd.teleport = d.teleportCooldownMs * cm; this.forceTeleport = false; }
    if (move.id === 'decoy') { this.cd.decoy = d.decoyCooldownMs * cm; this._layDecoys(move.decoy); }
    this._set(GlitchState.TELEGRAPH);
  }

  /** Hologram Duplicate: shimmer the decoys in beside Zed now (they flicker through the wind-up and punch during the strike). */
  _layDecoys(cfg) {
    const t = this.target || { x: this.x + this.facing * 200, y: this.y };
    const r = this._range();
    const n = this.phase2 ? this.data.p2.decoys : 1;
    const sides = n === 1 ? [t.x >= this.x ? 1 : -1] : [-1, 1];   // one decoy on the side Glitch is on; two flank Zed
    this.decoys = sides.map((s) => {
      const x = Math.min(r.max - 60, Math.max(r.min + 60, t.x + s * cfg.offsetX));
      this.decoySeq++;
      return { id: `${this.decoySeq}`, x, y: t.y, facing: x >= t.x ? -1 : 1, state: 'warn', lifeLeft: cfg.lifeMs };
    });
  }

  _beginAttack() {
    const m = this.move;
    this.timer = m.attackMs; this.hitFired = false; this.hitIndex = 0;
    this.attackCounter++;               // one attackId per move
    for (const dc of this.decoys) if (dc.state === 'warn') dc.state = 'live';
    if (m.id === 'spike') this.spikeSeq++;
    this._set(GlitchState.ATTACK);
  }

  _emitHit(h, box, origin, facing) {
    if (!this.hooks.onHitRequest) return;
    this.hooks.onHitRequest({
      attackerId: this.id, attackId: `${this.id}:${this.attackCounter}:${h.atMs}:${origin.x | 0}`, team: this.data.team,
      hitbox: { ...box }, origin: { x: origin.x, y: origin.y }, lane: origin.y, facing,
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
    if (this.state === GlitchState.DEAD) return;

    if (this.kx !== 0) {
      this.x += this.kx * dt;
      const dec = d.knockbackDecay * dt;
      this.kx = Math.abs(this.kx) <= dec ? 0 : this.kx - Math.sign(this.kx) * dec;
    }
    this.cooldownMs = Math.max(0, this.cooldownMs - dtMs);
    for (const k of Object.keys(this.cd)) this.cd[k] = Math.max(0, this.cd[k] - dtMs);
    this.target = target || null;
    this._decoyStep(dtMs);
    this._burstStep(dtMs);

    if (target && (this.state === GlitchState.IDLE || this.state === GlitchState.APPROACH || this.state === GlitchState.TELEGRAPH || this.state === GlitchState.RECOVER)) {
      this.facing = target.x >= this.x ? 1 : -1;
    }

    switch (this.state) {
      case GlitchState.IDLE:
        this.timer -= dtMs;
        if (this.timer <= 0 && target) this._set(GlitchState.APPROACH);
        break;
      case GlitchState.APPROACH:
        if (target) this._approach(dt, target);
        break;
      case GlitchState.TELEGRAPH:
        this.timer -= dtMs;
        if (this.timer <= 0) this._beginAttack();
        break;
      case GlitchState.ATTACK:
        this._attack(dtMs);
        break;
      case GlitchState.RECOVER:
        this.timer -= dtMs;
        if (this.timer <= 0) { this.cooldownMs = this.phase2 ? d.p2.moveCooldownMs : d.moveCooldownMs; this._set(GlitchState.APPROACH); }
        break;
      case GlitchState.HITSTUN:
        this.timer -= dtMs;
        if (this.timer <= 0) { this.cooldownMs = d.moveCooldownMs; this._set(GlitchState.APPROACH); }
        break;
    }
  }

  /** Decoys expire on their own clock; a live one punches at the move's hit time (see _attack), so here they only age out. */
  _decoyStep(dtMs) {
    if (!this.decoys.length) return;
    for (const dc of this.decoys) if (dc.state !== 'warn') dc.lifeLeft -= dtMs;
    this.decoys = this.decoys.filter((dc) => dc.state === 'warn' || dc.lifeLeft > 0);
  }

  /** Phase 2 Shock Disk Throw: the second disk leaves a beat after the first. */
  _burstStep(dtMs) {
    if (this.burstLeft <= 0 || !this.alive) return;
    this.burstMs -= dtMs;
    if (this.burstMs <= 0) {
      this.burstLeft--; this.burstMs = this.data.p2.diskBurstGapMs;
      this.diskSeq++;
      this._shoot(GLITCH_MOVES.disk.shot, this.y);
    }
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
    if (this.timer <= 0) this._endMove(m.id === 'teleport' ? (this.phase2 ? m.recoverMsP2 : m.recoverMs) : m.recoverMs);
  }

  _fire(m, h) {
    if (h.shot === 'disk') {
      this.diskSeq++;
      this._shoot(m.shot, this.y);
      if (this.phase2) { this.burstLeft = this.data.p2.diskBurst - 1; this.burstMs = this.data.p2.diskBurstGapMs; }
    } else if (h.shot === 'drone') {
      this.droneSeq++;
      const t = this.target || { y: this.y };
      const offs = this.phase2 ? m.laneOffsetsP2 : m.laneOffsets;
      const lanes = this.phase2 ? [offs[h.n * 2], offs[h.n * 2 + 1]] : [offs[h.n]];   // phase 2 fires two per beat: five in all, plus one in the middle
      for (const o of lanes) if (o !== undefined) this._shoot(m.shot, Math.min(700, Math.max(440, t.y + o)), this.x);
      if (this.phase2 && h.n === 2) this._shoot(m.shot, t.y, this.x);
    } else if (h.from === 'decoy') {
      for (const dc of this.decoys) if (dc.state === 'live') this._emitHit(h, m.hitbox, dc, dc.facing);
    } else if (h.teleport) {
      this._blink();
    } else if (m.id === 'spike') {
      this._emitHit(h, m.hitbox, this, this.facing);
      if (this.phase2) this._emitHit({ ...h, atMs: h.atMs + 1, damage: Math.round(h.damage * 0.8) }, m.hitboxFar, this, this.facing);
    } else {
      this._emitHit(h, m.hitbox, this, this.facing);
    }
  }

  /** Emergency Teleport: vanish and reappear on the far side of the arena from Zed. */
  _blink() {
    const r = this._range(), t = this.target, inset = GLITCH_MOVES.teleport.edgeInsetPx;
    this.teleportFrom = { x: this.x, y: this.y };
    const toRight = t ? t.x < (r.min + r.max) / 2 : this.x < (r.min + r.max) / 2;
    this.x = toRight ? r.max - inset : r.min + inset;
    this.kx = 0; this.teleportSeq++;
    if (t) this.facing = t.x >= this.x ? 1 : -1;
  }

  _endMove(recoverMs) {
    this.timer = recoverMs;
    this._set(GlitchState.RECOVER);
  }

  _ready() {
    const c = this.cd;
    return { disk: c.disk <= 0, drones: c.drones <= 0, decoy: c.decoy <= 0, spike: c.spike <= 0, teleport: c.teleport <= 0 };
  }

  _approach(dt, t) {
    const d = this.data;
    const dx = t.x - this.x, dy = t.y - this.y;
    const dist = Math.hypot(dx, dy) || 0.0001;
    this.circling = false;
    if (this.cooldownMs <= 0) {
      const mv = pickGlitchMove({ dist, dy, lift: t.lift || 0, ready: this._ready(), lastId: this.lastMoveId, forceTeleport: this.forceTeleport }, this.rng, d);
      if (mv) {
        const laneMove = mv.id === 'disk' || mv.id === 'spike';
        if (laneMove && Math.abs(dy) > d.laneTolerance) { this._move(0, Math.sign(dy), d.circleSpeed * (this.phase2 ? d.p2.speedMult : 1), dt); return; }   // line up in depth first
        if (this.slots.tryAcquire(this.id)) { this._beginTelegraph(mv); return; }
        this.circling = true;                      // no slot free: hold his ground (flagged so the failsafe does not read it as stuck)
        return;
      }
    }
    const r = this._range();
    if (dist < d.keepAwayPx) {                     // he keeps his distance: back away from Zed, slide along the lane if pinned at the edge
      const away = dx >= 0 ? -1 : 1;
      const nx = this.x + away * this.speed * dt;
      if (nx > r.min + EDGE_INSET && nx < r.max - EDGE_INSET) this._move(away, 0, this.speed, dt);
      else { this.circling = true; this._move(0, Math.abs(dy) < 30 ? (this.y > 560 ? -1 : 1) : -Math.sign(dy), d.circleSpeed, dt); }
      return;
    }
    if (dist > d.keepNearPx) { this._move(dx / dist, dy / dist, this.speed, dt); return; }
    // in his preferred band: drift into Zed's lane so the disk and spike can line up
    if (Math.abs(dy) > d.laneTolerance * 0.6) this._move(0, Math.sign(dy), d.circleSpeed, dt);
    else this.circling = true;
  }

  _move(ux, uy, speed, dt) {
    this.vx = ux * speed; this.vy = uy * speed;
    this.x += this.vx * dt; this.y += this.vy * dt;
  }

  /**
   * React to damage combat applied. Ordinary hits never stun him and push him only a little; a parry stun does stun him and cancels the move
   * in progress. Crossing a health threshold queues an Emergency Teleport, and half health starts the overclock.
   */
  takeHit({ hitstun = 0, knockback = 0, parry = false, hpAfter = null } = {}) {
    if (!this.alive) return;
    if (hpAfter !== null && hpAfter !== undefined) {
      this.hp = hpAfter;
      const share = this.hp / this.maxHp;
      if (!this.phase2 && share <= GLITCH_PHASE2_AT) this.phase2 = true;
      while (this.thresholdsLeft.length && share <= this.thresholdsLeft[0]) { this.thresholdsLeft.shift(); this.forceTeleport = true; this.cd.teleport = 0; }
    }
    if (!parry) { this.kx = knockback * this.data.knockbackScale; return; }
    this.hitFired = true; this.kx = 0; this.burstLeft = 0;
    this.decoys = this.decoys.filter((dc) => dc.state === 'live');
    this.timer = Math.max(hitstun, this.data.parryStunMs);
    this.hitstunMs = this.timer;
    this.hitSeq++;
    this._set(GlitchState.HITSTUN);
  }

  die() {
    if (!this.alive) return;
    this.kx = 0; this.decoys = []; this.burstLeft = 0;
    this._set(GlitchState.DEAD);
    if (this.hooks.onDeath) this.hooks.onDeath();
  }

  teleport(x, y) { this.x = x; this.y = y; this.kx = 0; }
}
