// "Subject 88" AI: Level 6 mini-boss. Pure state machine, no Phaser. Same public shape as KaneBoss / RoyceBoss / GlitchBoss so EnemyManager,
// ArenaFailsafe, EnemyHitFx and the scene's cue ring treat him like any other enemy.
// States: idle -> approach -> telegraph -> attack -> recover -> approach; hitstun (parry only); dead.
// Moves (subject88Data.js): Toxic Breath, Acid Spit, Frenzied Charge (once flared), Corrosion Slam, Chemical Explosion (health thresholds).
// He is the area-denial bruiser: he never backs off, he walks Zed down, takes an attacker slot before every move, ignores ordinary hitstun
// (no juggle loops) and barely moves when hit. Breath, spit and slam leave HAZARDS on the ground (this.hazards) that tick damage through
// onHitRequest and slowly fade; the scene only renders them. No gore: he is a person in distress.
// Renderer-facing plain fields: hazards[], spitMark, chargeLane, explosion, phase2/flared, stopped, moveSeq, wallSeq, explosionSeq, spitSeq, gasSeq.
import { SUBJECT88, SUBJECT88_MOVES, SUBJECT88_ID, SUBJECT88_FLARE_AT, SUBJECT88_EXPLODE_AT, pickSubject88Move } from './subject88Data.js';
import { AttackSlots } from './AttackSlots.js';
import { PARRY_CUE_LEAD_MS } from './gruntData.js';

export const Subject88State = {
  IDLE: 'idle', APPROACH: 'approach', TELEGRAPH: 'telegraph',
  ATTACK: 'attack', RECOVER: 'recover', HITSTUN: 'hitstun', DEAD: 'dead',
};

const PARRY_MOVES = new Set(['breath', 'slam', 'charge']);   // melee-style: the parry ring follows these
const DEAD_FADE_MS = 700;                                     // hazards left behind by a dead boss vanish quickly and stop hurting

export class Subject88Boss {
  /**
   * @param {object} o
   * @param {string} o.id @param {number} o.x @param {number} o.y
   * @param {AttackSlots} [o.slots] shared attacker cap
   * @param {object} [o.data] stats table (defaults to SUBJECT88)
   * @param {object} [o.hooks] { onHitRequest(info), onStateChange(next, prev), onDeath() }
   * @param {() => {min:number,max:number}} [o.getXRange] fighting range: the charge stops at its edges
   * @param {() => number} [o.rng]
   */
  constructor({ id, x = 0, y = 0, slots, data = SUBJECT88, hooks = {}, maxHp = data.maxHp, getXRange = null, rng = Math.random }) {
    this.id = id; this.x = x; this.y = y;
    this.data = data;
    this.slots = slots || new AttackSlots(2);
    this.hooks = hooks; this.getXRange = getXRange; this.rng = rng;
    this.maxHp = maxHp; this.hp = maxHp;
    this.isBoss = false;            // that flag means Dugan's art and voice
    this.miniBoss = true;
    this.skin = SUBJECT88_ID;
    this.visualScale = data.visualScale;
    this.facing = -1;
    this.vx = 0; this.vy = 0; this.kx = 0;
    this.state = Subject88State.IDLE;
    this.timer = data.spawnIdleMs;
    this.move = null;               // the SUBJECT88_MOVES entry in progress
    this.variant = { id: 'idle', kind: 'strike', hits: [{ atMs: 0 }], markIndex: 0, attackMs: 0 };
    this.lastMoveId = null;
    this.telegraphTotalMs = 0;
    this.hitFired = false; this.hitIndex = 0; this.attackCounter = 0;
    this.hitstunMs = 0; this.hitSeq = 0;
    this.circling = false;
    this.cooldownMs = data.moveCooldownMs;
    this.cd = { breath: data.breathFirstMs, spit: data.spitFirstMs, charge: data.chargeFirstMs, slam: data.slamFirstMs, explosion: data.explosionFirstMs };
    this.moveSeq = 0;               // bumps at every wind-up so the renderer restarts the move's clip
    // hazards: { id, kind: 'gas'|'puddle', x, y, r, box:{x,y,w,h} (world rect that hurts), facing, life, maxLife, alpha, tickMs, tickLeft, ticks, damage, hitstun }
    this.hazards = [];
    this.hazardSeq = 0;
    this.gasSeq = 0; this.puddleSeq = 0;   // bump when a cloud / puddle is laid so the renderer can pop the effect once
    this.spitSeq = 0; this.explosionSeq = 0; this.wallSeq = 0;
    this.spitMark = null;           // { x, y, r }: the green circle on the ground, from wind-up until the glob lands
    this.chargeLane = null;         // { x0, x1, y, h, dir }: the red lane strip, wind-up and run
    this.explosion = null;          // { x, y, r, maxR, state: 'warn'|'burst' }: ring warning grows, then bursts
    this.phase2 = false;            // flared: veins brighten, faster, Frenzied Charge unlocked
    this.thresholdsLeft = [...SUBJECT88_EXPLODE_AT];
    this.forceExplosion = false;
    this.chargeDir = 1; this.chargeLeftMs = 0; this.wallHit = false;
    this.target = null;
  }

  get alive() { return this.state !== Subject88State.DEAD; }
  get telegraphing() { return this.state === Subject88State.TELEGRAPH; }
  get telegraphProgress() { return this.telegraphing ? 1 - this.timer / this.telegraphTotalMs : 0; }
  get enraged() { return this.phase2; }
  get flared() { return this.phase2; }
  /** True only around Chemical Explosion: the one time he stops advancing (he is rooted through wind-up, burst and recovery). */
  get stopped() {
    return !!this.move && this.move.id === 'explosion'
      && (this.state === Subject88State.TELEGRAPH || this.state === Subject88State.ATTACK || this.state === Subject88State.RECOVER);
  }
  /** The parry ring follows his melee-style moves; spit and explosion have their own ground cues. */
  get cueClockMs() {
    if (!this.move || !PARRY_MOVES.has(this.move.id)) return null;
    if (this.state === Subject88State.TELEGRAPH) return this.telegraphTotalMs - this.timer;
    if (this.state === Subject88State.ATTACK) return this.telegraphTotalMs + (this.variant.attackMs - this.timer);
    return null;
  }
  get parryMarkMs() { return this.telegraphTotalMs + this.variant.hits[this.variant.markIndex].atMs - PARRY_CUE_LEAD_MS; }
  get speed() { return this.data.moveSpeed * (this.phase2 ? this.data.p2.speedMult : 1); }

  _set(next) {
    const prev = this.state;
    if (prev === next) return;
    this.state = next;
    if (next !== Subject88State.TELEGRAPH && next !== Subject88State.ATTACK) {
      this.slots.release(this.id);
      this.explosion = null; this.chargeLane = null; this.spitMark = null; this.chargeLeftMs = 0;
    }
    if (this.hooks.onStateChange) this.hooks.onStateChange(next, prev);
  }

  hurtbox() {
    const h = this.data.hurtbox;
    const x = this.facing >= 0 ? this.x + h.x : this.x - h.x - h.w;
    return { x, y: this.y + h.y, w: h.w, h: h.h };
  }
  attackHitbox() {
    const h = (this.move || SUBJECT88_MOVES.slam).hitbox;
    const x = this.facing >= 0 ? this.x + h.x : this.x - h.x - h.w;
    return { x, y: this.y + h.y, w: h.w, h: h.h };
  }

  _range() { return this.getXRange ? this.getXRange() : { min: -1e9, max: 1e9 }; }
  _clampX(x, inset = 60) { const r = this._range(); return Math.min(r.max - inset, Math.max(r.min + inset, x)); }

  _beginTelegraph(move) {
    this.move = move;
    this.variant = { id: move.id, kind: move.kind, hits: move.hits, markIndex: move.markIndex, attackMs: move.attackMs };
    this.telegraphTotalMs = move.telegraphMs;
    this.timer = move.telegraphMs;
    this.lastMoveId = move.id;
    this.moveSeq++;
    const d = this.data, cm = this.phase2 ? d.p2.cooldownMult : 1;
    if (move.id === 'breath') this.cd.breath = d.breathCooldownMs * cm;
    if (move.id === 'spit') this.cd.spit = d.spitCooldownMs * cm;
    if (move.id === 'charge') this.cd.charge = d.chargeCooldownMs * cm;
    if (move.id === 'slam') this.cd.slam = d.slamCooldownMs * cm;
    if (move.id === 'explosion') {
      this.cd.explosion = d.explosionCooldownMs; this.forceExplosion = false;
      this.explosion = { x: this.x, y: this.y, r: 0, maxR: move.ring.radius, state: 'warn' };
    }
    if (move.id === 'spit') {
      const t = this.target || { x: this.x + this.facing * 300, y: this.y };
      this.spitMark = { x: this._clampX(t.x, 30), y: t.y, r: move.puddle.radius };
    }
    if (move.id === 'charge') this._laneUpdate();
    this._set(Subject88State.TELEGRAPH);
  }

  /** Red lane strip: from him to the arena edge he is facing. */
  _laneUpdate() {
    const r = this._range(), dir = this.state === Subject88State.ATTACK ? this.chargeDir : this.facing;
    const edge = dir >= 0 ? r.max - this.data.edgeInsetPx : r.min + this.data.edgeInsetPx;
    this.chargeLane = { x0: this.x, x1: edge, y: this.y, h: SUBJECT88_MOVES.charge.charge.laneHalfH * 2, dir };
  }

  _beginAttack() {
    const m = this.move;
    this.timer = m.attackMs; this.hitFired = false; this.hitIndex = 0;
    this.attackCounter++;               // one attackId per move
    if (m.id === 'charge') { this.chargeDir = this.facing; this.chargeLeftMs = m.charge.moveMs; this.wallHit = false; }
    if (m.id === 'explosion' && this.explosion) this.explosion.r = this.explosion.maxR;
    this._set(Subject88State.ATTACK);
  }

  _emitHit(h, box, origin, facing) {
    if (!this.hooks.onHitRequest) return;
    this.hooks.onHitRequest({
      attackerId: this.id, attackId: `${this.id}:${this.attackCounter}:${h.atMs}:${origin.x | 0}`, team: this.data.team,
      hitbox: { ...box }, origin: { x: origin.x, y: origin.y }, lane: origin.y, facing,
      damage: h.damage, knockback: h.knockback, hitstun: h.hitstun, pierceInvuln: !!h.pierceInvuln,
    });
  }

  _spawnHazard(o) {
    const id = ++this.hazardSeq;
    this.hazards.push({
      id, kind: o.kind, x: o.x, y: o.y, r: o.r || 0, box: o.box, facing: o.facing || 1,
      life: o.lifeMs, maxLife: o.lifeMs, alpha: 1, tickMs: o.tickMs, tickLeft: 0, ticks: 0, damage: o.damage, hitstun: o.hitstun || 0,
    });
    if (o.kind === 'gas') this.gasSeq++; else this.puddleSeq++;
  }

  _puddleBox(x, y, r) { return { x: x - r, y: y - 92, w: r * 2, h: 92 }; }

  /** Hazards age on their own clock (they outlive the move, the hitstun and the boss). They tick damage only while he lives. */
  _hazardStep(dtMs) {
    if (!this.hazards.length) return;
    const live = this.alive;
    for (const hz of this.hazards) {
      hz.life -= dtMs;
      hz.alpha = Math.max(0, Math.min(1, hz.life / hz.maxLife));
      if (!live || hz.life <= 0) continue;
      hz.tickLeft -= dtMs;
      while (hz.tickLeft <= 0) {
        hz.tickLeft += hz.tickMs; hz.ticks++;
        if (this.hooks.onHitRequest) {
          this.hooks.onHitRequest({
            attackerId: this.id, attackId: `${this.id}:hz${hz.id}:${hz.ticks}`, team: this.data.team,
            hitbox: { ...hz.box }, origin: { x: hz.x, y: hz.y }, lane: hz.y, facing: hz.facing,
            damage: hz.damage, knockback: 0, hitstun: hz.hitstun, pierceInvuln: false, hazard: hz.kind,
          });
        }
      }
    }
    this.hazards = this.hazards.filter((hz) => hz.life > 0);
  }

  /** @param {{x:number,y:number,lift?:number}|null} target */
  update(dtMs, target) {
    const d = this.data, dt = dtMs / 1000;
    this.vx = 0; this.vy = 0;
    this._hazardStep(dtMs);
    if (this.state === Subject88State.DEAD) return;

    if (this.kx !== 0) {
      this.x += this.kx * dt;
      const dec = d.knockbackDecay * dt;
      this.kx = Math.abs(this.kx) <= dec ? 0 : this.kx - Math.sign(this.kx) * dec;
    }
    this.cooldownMs = Math.max(0, this.cooldownMs - dtMs);
    for (const k of Object.keys(this.cd)) this.cd[k] = Math.max(0, this.cd[k] - dtMs);
    this.target = target || null;

    if (target && (this.state === Subject88State.IDLE || this.state === Subject88State.APPROACH || this.state === Subject88State.TELEGRAPH || this.state === Subject88State.RECOVER)) {
      // Rooted for Chemical Explosion; every other move keeps him turned toward Zed through the wind-up.
      this.facing = target.x >= this.x ? 1 : -1;
    }

    switch (this.state) {
      case Subject88State.IDLE:
        this.timer -= dtMs;
        if (this.timer <= 0 && target) this._set(Subject88State.APPROACH);
        break;
      case Subject88State.APPROACH:
        if (target) this._approach(dt, target);
        break;
      case Subject88State.TELEGRAPH:
        this.timer -= dtMs;
        if (this.explosion) this.explosion.r = this.explosion.maxR * this.telegraphProgress;
        if (this.move.id === 'charge') this._laneUpdate();
        if (this.timer <= 0) this._beginAttack();
        break;
      case Subject88State.ATTACK:
        this._attack(dtMs, dt);
        break;
      case Subject88State.RECOVER:
        this.timer -= dtMs;
        if (this.timer <= 0) { this.cooldownMs = this.phase2 ? d.p2.moveCooldownMs : d.moveCooldownMs; this._set(Subject88State.APPROACH); }
        break;
      case Subject88State.HITSTUN:
        this.timer -= dtMs;
        if (this.timer <= 0) { this.cooldownMs = d.moveCooldownMs; this._set(Subject88State.APPROACH); }
        break;
    }
  }

  _attack(dtMs, dt) {
    const m = this.move;
    this.timer -= dtMs;
    const elapsed = m.attackMs - this.timer;
    if (m.id === 'charge' && this.chargeLeftMs > 0 && !this.wallHit) this._chargeStep(dtMs, dt);
    while (!this.hitFired && this.hitIndex < m.hits.length && elapsed >= m.hits[this.hitIndex].atMs) {
      const h = m.hits[this.hitIndex++];
      if (this.hitIndex >= m.hits.length) this.hitFired = true;
      this._fire(m, h);
    }
    if (this.wallHit) this.timer = Math.min(this.timer, 0);
    if (this.timer <= 0) this._endMove(m.recoverMs + (this.wallHit ? m.charge.wallStunMs : 0));
  }

  /** Frenzied Charge: a straight run along his lane. The arena edge stops him dead and leaves him open. */
  _chargeStep(dtMs, dt) {
    const c = SUBJECT88_MOVES.charge.charge;
    this.chargeLeftMs -= dtMs;
    const r = this._range(), inset = this.data.edgeInsetPx;
    const nx = this.x + this.chargeDir * c.speed * dt;
    const cx = Math.min(r.max - inset, Math.max(r.min + inset, nx));
    this.vx = this.chargeDir * c.speed;
    this.x = cx;
    if (cx !== nx) { this.wallHit = true; this.wallSeq++; this.vx = 0; this.hitFired = true; }
    if (this.chargeLane) this.chargeLane.x0 = this.x;
  }

  _fire(m, h) {
    if (h.spawn === 'gas') {
      this._emitHit(h, m.hitbox, this, this.facing);
      const b = this.attackHitbox();
      this._spawnHazard({ kind: 'gas', x: this.x, y: this.y, box: b, facing: this.facing, lifeMs: m.gas.lifeMs, tickMs: m.gas.tickMs, damage: m.gas.damage, hitstun: m.gas.hitstun });
    } else if (h.spawn === 'spit') {
      this.spitSeq++;
      const p = m.puddle, mk = this.spitMark || { x: this.x + this.facing * 300, y: this.y, r: p.radius };
      const box = this._puddleBox(mk.x, mk.y, p.radius);
      this._emitHit({ ...h, damage: p.landDamage, knockback: p.landKnockback, hitstun: p.landHitstun }, box, { x: mk.x, y: mk.y }, this.facing);
      this._spawnHazard({ kind: 'puddle', x: mk.x, y: mk.y, r: p.radius, box, facing: this.facing, lifeMs: p.lifeMs, tickMs: p.tickMs, damage: p.damage, hitstun: p.hitstun });
      this.spitMark = null;
    } else if (h.spawn === 'slamPuddle') {
      this._emitHit(h, m.hitbox, this, this.facing);
      const p = m.puddle, px = this._clampX(this.x + this.facing * p.offsetX, 20);
      this._spawnHazard({ kind: 'puddle', x: px, y: this.y, r: p.radius, box: this._puddleBox(px, this.y, p.radius), facing: this.facing, lifeMs: p.lifeMs, tickMs: p.tickMs, damage: p.damage, hitstun: p.hitstun });
    } else if (h.ring) {
      const R = m.ring, t = this.target;
      const box = { x: this.x - R.radius, y: this.y - 92, w: R.radius * 2, h: 92 + R.halfH };
      this.explosionSeq++;
      if (this.explosion) { this.explosion.state = 'burst'; this.explosion.r = this.explosion.maxR; }
      this._emitHit(h, box, this, t ? (t.x >= this.x ? 1 : -1) : this.facing);   // knocks Zed away from the tanks
    } else {
      this._emitHit(h, m.hitbox, this, this.facing === 0 ? 1 : (m.id === 'charge' ? this.chargeDir : this.facing));
    }
  }

  _endMove(recoverMs) {
    this.timer = recoverMs;
    this._set(Subject88State.RECOVER);
  }

  _ready() {
    const c = this.cd;
    return { breath: c.breath <= 0, spit: c.spit <= 0, charge: c.charge <= 0, slam: c.slam <= 0, explosion: c.explosion <= 0 };
  }

  _approach(dt, t) {
    const d = this.data;
    const dx = t.x - this.x, dy = t.y - this.y;
    const dist = Math.hypot(dx, dy) || 0.0001;
    this.circling = false;
    if (this.cooldownMs <= 0) {
      const mv = pickSubject88Move({ dist, dy, ready: this._ready(), lastId: this.lastMoveId, forceExplosion: this.forceExplosion, flared: this.phase2 }, this.rng, d);
      if (mv) {
        if (this.slots.tryAcquire(this.id)) { this._beginTelegraph(mv); return; }
        this.circling = true;                      // no slot free: hold his ground (flagged so the failsafe does not read it as stuck)
        return;
      }
    }
    // area-denial bruiser: he never backs off, he keeps walking Zed down
    if (Math.abs(dx) > d.stopPx || Math.abs(dy) > d.laneTolerance * 0.6) {
      const inLaneX = Math.abs(dx) <= d.stopPx;
      if (inLaneX) this._move(0, Math.sign(dy), d.circleSpeed * (this.phase2 ? d.p2.speedMult : 1), dt);
      else this._move(dx / dist, dy / dist, this.speed, dt);
    } else this.circling = true;
  }

  _move(ux, uy, speed, dt) {
    this.vx = ux * speed; this.vy = uy * speed;
    this.x += this.vx * dt; this.y += this.vy * dt;
  }

  /**
   * React to damage combat applied. Ordinary hits never stun him and push him only a little; a parry stun does stun him and cancels the move
   * in progress. Below the flare share he flares; each explosion threshold queues a Chemical Explosion.
   */
  takeHit({ hitstun = 0, knockback = 0, parry = false, hpAfter = null } = {}) {
    if (!this.alive) return;
    if (hpAfter !== null && hpAfter !== undefined) {
      this.hp = hpAfter;
      const share = this.hp / this.maxHp;
      if (!this.phase2 && share <= SUBJECT88_FLARE_AT) this.phase2 = true;
      while (this.thresholdsLeft.length && share <= this.thresholdsLeft[0]) { this.thresholdsLeft.shift(); this.forceExplosion = true; this.cd.explosion = 0; }
    }
    if (!parry) { this.kx = knockback * this.data.knockbackScale; return; }
    this.hitFired = true; this.kx = 0;
    this.timer = Math.max(hitstun, this.data.parryStunMs);
    this.hitstunMs = this.timer;
    this.hitSeq++;
    this._set(Subject88State.HITSTUN);
  }

  die() {
    if (!this.alive) return;
    this.kx = 0;
    for (const hz of this.hazards) hz.life = Math.min(hz.life, DEAD_FADE_MS);
    this._set(Subject88State.DEAD);
    if (this.hooks.onDeath) this.hooks.onDeath();
  }

  /** Story-card intro: stop where he is and stand in his idle pose until releaseIdle(). */
  holdIdle() {
    if (!this.alive) return;
    this.vx = 0; this.vy = 0; this.kx = 0;
    this.timer = Infinity;
    this._set(Subject88State.IDLE);
  }

  /** End the intro hold: he starts his approach on the next update. */
  releaseIdle() {
    if (this.state === Subject88State.IDLE && this.timer === Infinity) this.timer = 0;
  }

  teleport(x, y) { this.x = x; this.y = y; this.kx = 0; }
}
