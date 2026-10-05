// Owns all live grunts and wires each one to the event contract. No Phaser.
// Rendering reads `manager.enemies` (id, x, y, facing, state, telegraphing...) each frame.
import { EVENTS } from '../shared/events.js';
import { RustGrunt } from './RustGrunt.js';
import { AttackSlots } from './AttackSlots.js';
import { GRUNT, ATTACKER_CAP } from './gruntData.js';

export const DEATH_LINGER_MS = 600; // corpse stays this long, then entity-unregistered

export class EnemyManager {
  constructor({ events, data = GRUNT, attackerCap = ATTACKER_CAP, onRemoved = null }) {
    this.events = events; this.data = data;
    this.slots = new AttackSlots(attackerCap);
    this.enemies = new Map(); // id -> { grunt, deathTimer }
    this.onRemoved = onRemoved; // (id) => void, lets the view destroy its sprite
    this._onDamage = (p) => {
      const e = this.enemies.get(p.targetId);
      if (e && e.grunt.alive) e.grunt.takeHit({ hitstun: p.hitstun, knockback: p.knockback });
    };
    this._onDied = (p) => {
      if (!p || p.team !== 'rust') return;
      const e = this.enemies.get(p.id);
      if (e && e.grunt.alive) { e.grunt.die(); e.deathTimer = DEATH_LINGER_MS; }
    };
    this._onRetry = () => this.destroyAll();
    events.on(EVENTS.DAMAGE_APPLIED, this._onDamage);
    events.on(EVENTS.ENTITY_DIED, this._onDied);
    events.on(EVENTS.RETRY, this._onRetry);
  }

  /** spawn spec from WaveSpawner: {id, x, y}. */
  spawn({ id, x, y }) {
    if (this.enemies.has(id)) return this.enemies.get(id).grunt;
    const grunt = new RustGrunt({
      id, x, y, slots: this.slots, data: this.data,
      hooks: { onHitRequest: (req) => this.events.emit(EVENTS.HIT_REQUEST, req) },
    });
    this.enemies.set(id, { grunt, deathTimer: 0 });
    this.events.emit(EVENTS.ENTITY_REGISTERED, {
      id, team: this.data.team, maxHp: this.data.maxHp,
      hurtbox: { ...this.data.hurtbox },
      getState: () => ({ x: grunt.x, y: grunt.y, facing: grunt.facing }),
    });
    return grunt;
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

  /** target: {x,y} of the player (or null). */
  update(dtMs, target) {
    for (const [id, e] of [...this.enemies]) {
      e.grunt.update(dtMs, target);
      if (!e.grunt.alive) {
        e.deathTimer -= dtMs;
        if (e.deathTimer <= 0) this.destroy(id);
      }
    }
  }

  dispose() {
    this.events.off(EVENTS.DAMAGE_APPLIED, this._onDamage);
    this.events.off(EVENTS.ENTITY_DIED, this._onDied);
    this.events.off(EVENTS.RETRY, this._onRetry);
    this.destroyAll();
  }
}
