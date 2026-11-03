// Owns all live grunts and wires each one to the event contract. No Phaser.
// Rendering reads `manager.enemies` (id, x, y, facing, state, telegraphing...) each frame.
import { EVENTS } from '../shared/events.js';
import { RustGrunt } from './RustGrunt.js';
import { BrickDugan } from './BrickDugan.js';
import { DUGAN, DUGAN_ID } from './duganData.js';
import { RoyceBoss } from './RoyceBoss.js';
import { ROYCE, ROYCE_ID } from './royceData.js';
import { KANE, KANE_ID, KANE_SKIN } from './kaneData.js';
import { AttackSlots } from './AttackSlots.js';
import { GRUNT, ATTACKER_CAP, pickAttackVariant } from './gruntData.js';
import { KINDS } from './enemyKinds.js';

export const DEATH_LINGER_MS = 600; // corpse stays this long, then entity-unregistered

export class EnemyManager {
  constructor({ events, data = GRUNT, attackerCap = ATTACKER_CAP, onRemoved = null, mixUp = true, rng = Math.random, getXRange = null }) {
    this.events = events; this.data = data;
    this.rng = rng; this.getXRange = getXRange; // getXRange: () => {min,max}, the fighting range (a Dugan charge crashes into its edge)
    // Parry mix-up: each attack picks a pattern (never the same twice in a row). mixUp:false = always the plain 1-2-3.
    this.pickVariant = mixUp && data.variants ? (g) => pickAttackVariant(rng, g.lastVariantId, data.variants) : null;
    this.slots = new AttackSlots(attackerCap);
    this.enemies = new Map(); // id -> { grunt, deathTimer }
    this.onRemoved = onRemoved; // (id) => void, lets the view destroy its sprite
    this._onDamage = (p) => {
      const e = this.enemies.get(p.targetId);
      if (e && e.grunt.alive) e.grunt.takeHit({ hitstun: p.hitstun, knockback: p.knockback, hpAfter: p.hpAfter });
      const a = this.enemies.get(p.attackerId);
      if (a && a.grunt.onHitLanded && p.landed !== false && p.amount > 0) a.grunt.onHitLanded(); // a charge ends on contact
    };
    this._onParryStun = ({ attackerId, hitstun }) => {
      const e = this.enemies.get(attackerId);
      if (e && e.grunt.alive) e.grunt.takeHit({ hitstun, knockback: 0, parry: true });
    };
    this._onDied = (p) => {
      if (!p || p.team !== 'rust') return;
      const e = this.enemies.get(p.id);
      if (e && e.grunt.alive) { e.grunt.die(); e.deathTimer = DEATH_LINGER_MS; }
    };
    this._onHitRequest = (req) => {   // Zed starts a swing: a Dugan may raise a block (see BrickDugan.onPlayerAttack)
      if (!req || req.team === 'rust') return;
      for (const e of this.enemies.values()) if (e.grunt.onPlayerAttack) e.grunt.onPlayerAttack(req);
    };
    this._onRetry = () => this.destroyAll();
    events.on(EVENTS.DAMAGE_APPLIED, this._onDamage);
    events.on(EVENTS.PARRY_STUN, this._onParryStun);
    events.on(EVENTS.ENTITY_DIED, this._onDied);
    this._onGrabBroken = ({ attackerId }) => { const e = this.enemies.get(attackerId); if (e && e.grunt.grabBroken) e.grunt.grabBroken(); };
    events.on(EVENTS.GRAB_BROKEN, this._onGrabBroken);
    events.on(EVENTS.RETRY, this._onRetry);
    events.on(EVENTS.HIT_REQUEST, this._onHitRequest);
  }

  /** spawn spec from WaveSpawner: {id, x, y, enemy?, skin?, hpMult?}. enemy 'rust-brick-dugan' spawns the Level 1 mini-boss. */
  spawn({ id, x, y, enemy = null, skin = null, hpMult = 1, speedMult = 1 }) {
    if (this.enemies.has(id)) return this.enemies.get(id).grunt;
    if (enemy === DUGAN_ID) return this._spawnDugan({ id, x, y, hpMult });
    if (enemy === ROYCE_ID) return this._spawnRoyce({ id, x, y, hpMult, speedMult });
    if (enemy === KANE_ID) return this._spawnKane({ id, x, y, hpMult, speedMult });
    const tint = KINDS[skin]?.tint;
    const data = speedMult === 1 && !tint ? this.data
      : { ...this.data, moveSpeed: Math.round(this.data.moveSpeed * speedMult), circleSpeed: Math.round(this.data.circleSpeed * speedMult), ...(tint ? { tint } : {}) }; // wave speed boost / kind tint
    const grunt = new RustGrunt({
      id, x, y, slots: this.slots, data, maxHp: Math.round(this.data.maxHp * hpMult),
      hooks: { onHitRequest: (req) => this.events.emit(EVENTS.HIT_REQUEST, req) },
      pickVariant: this.pickVariant,
    });
    grunt.skin = skin; // visual variant (e.g. 'rust-breaker'); gameplay is still the grunt's
    this.enemies.set(id, { grunt, deathTimer: 0 });
    this.events.emit(EVENTS.ENTITY_REGISTERED, {
      id, team: this.data.team, maxHp: grunt.maxHp,
      hurtbox: { ...this.data.hurtbox },
      getState: () => ({ x: grunt.x, y: grunt.y, lane: grunt.y, facing: grunt.facing }),
    });
    return grunt;
  }

  /** Level 2 mini-boss: RoyceBoss (five canon moves + block), registered as a boss so the health bar and victory card pick him up. */
  _spawnRoyce({ id, x, y, hpMult, speedMult = 1 }) {
    const data = speedMult === 1 ? ROYCE : { ...ROYCE, moveSpeed: Math.round(ROYCE.moveSpeed * speedMult), circleSpeed: Math.round(ROYCE.circleSpeed * speedMult) };
    const boss = new RoyceBoss({
      id, x, y, slots: this.slots, data, maxHp: Math.round(ROYCE.maxHp * hpMult), getXRange: this.getXRange, rng: this.rng,
      hooks: { onHitRequest: (req) => this.events.emit(EVENTS.HIT_REQUEST, req) },
    });
    this.enemies.set(id, { grunt: boss, deathTimer: 0 });
    this.events.emit(EVENTS.ENTITY_REGISTERED, {
      id, team: ROYCE.team, boss: true, bossProfile: ROYCE_ID, maxHp: boss.maxHp,
      hurtbox: { ...ROYCE.hurtbox },
      getState: () => ({ x: boss.x, y: boss.y, lane: boss.y, facing: boss.facing, guard: boss.guard }),
    });
    return boss;
  }

  /** Level 3 mini-boss "Crusher" Kane: STAND-IN (a heavy grunt on the Breaker skin, one slow swing) registered as a boss so the bar, victory card and mercy drop work. */
  _spawnKane({ id, x, y, hpMult, speedMult = 1 }) {
    const data = speedMult === 1 ? KANE : { ...KANE, moveSpeed: Math.round(KANE.moveSpeed * speedMult), circleSpeed: Math.round(KANE.circleSpeed * speedMult) };
    const boss = new RustGrunt({
      id, x, y, slots: this.slots, data, maxHp: Math.round(KANE.maxHp * hpMult),
      hooks: { onHitRequest: (req) => this.events.emit(EVENTS.HIT_REQUEST, req) },
      pickVariant: null,
    });
    boss.skin = KANE_SKIN; boss.miniBoss = true;
    this.enemies.set(id, { grunt: boss, deathTimer: 0 });
    this.events.emit(EVENTS.ENTITY_REGISTERED, {
      id, team: KANE.team, boss: true, bossProfile: KANE_ID, maxHp: boss.maxHp,
      hurtbox: { ...KANE.hurtbox },
      getState: () => ({ x: boss.x, y: boss.y, lane: boss.y, facing: boss.facing }),
    });
    return boss;
  }

  _spawnDugan({ id, x, y, hpMult }) {
    const boss = new BrickDugan({
      id, x, y, slots: this.slots, data: DUGAN, maxHp: Math.round(DUGAN.maxHp * hpMult),
      getXRange: this.getXRange, rng: this.rng,
      hooks: {
        onHitRequest: (req) => this.events.emit(EVENTS.HIT_REQUEST, req),
        onGrab: (req) => this._grab(req),
        onGrabSlam: (p) => this.events.emit(EVENTS.GRAB_SLAM, p),
        onGrabRelease: (p) => this.events.emit(EVENTS.GRAB_RELEASE, p),
      },
    });
    this.enemies.set(id, { grunt: boss, deathTimer: 0 });
    this.events.emit(EVENTS.ENTITY_REGISTERED, {
      id, team: DUGAN.team, boss: true, bossProfile: DUGAN_ID, maxHp: boss.maxHp,
      hurtbox: { ...DUGAN.hurtbox },
      getState: () => ({ x: boss.x, y: boss.y, lane: boss.y, facing: boss.facing, guard: boss.guard }),
    });
    return boss;
  }

  /** Zed answers GRAB synchronously with GRAB_RESULT; false (a whiff) if nobody answers or he cannot be grabbed now. */
  _grab(req) {
    let accepted = false;
    const on = (r) => { if (r && r.attackerId === req.attackerId) accepted = !!r.accepted; };
    this.events.on(EVENTS.GRAB_RESULT, on);
    this.events.emit(EVENTS.GRAB, req);
    this.events.off(EVENTS.GRAB_RESULT, on);
    return accepted;
  }

  get(id) { return this.enemies.get(id)?.grunt; }
  list() { return [...this.enemies.values()].map((e) => e.grunt); }
  get liveCount() { return this.list().filter((g) => g.alive).length; }

  /** Remove one enemy now (emits entity-unregistered). Used by failsafe and corpse cleanup. */
  destroy(id) {
    const e = this.enemies.get(id);
    if (!e) return;
    this.slots.release(id);
    this.enemies.delete(id);
    this.events.emit(EVENTS.ENTITY_UNREGISTERED, { id });
    if (this.onRemoved) this.onRemoved(id);
  }

  destroyAll() { for (const id of [...this.enemies.keys()]) this.destroy(id); }

  /** target: {x,y} of the player (or null). frozen: optional Set of enemy ids skipped this frame (hit-stop). */
  update(dtMs, target, frozen = null) {
    for (const [id, e] of [...this.enemies]) {
      if (frozen && frozen.has(id)) continue;
      e.grunt.update(dtMs, target);
      if (!e.grunt.alive) {
        e.deathTimer -= dtMs;
        if (e.deathTimer <= 0) this.destroy(id);
      }
    }
  }

  dispose() {
    this.events.off(EVENTS.DAMAGE_APPLIED, this._onDamage);
    this.events.off(EVENTS.PARRY_STUN, this._onParryStun);
    this.events.off(EVENTS.ENTITY_DIED, this._onDied);
    this.events.off(EVENTS.GRAB_BROKEN, this._onGrabBroken);
    this.events.off(EVENTS.RETRY, this._onRetry);
    this.events.off(EVENTS.HIT_REQUEST, this._onHitRequest);
    this.destroyAll();
  }
}
