import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { EnemyManager } from './EnemyManager.js';
import { EVENTS } from '../shared/events.js';
import { PARRY } from '../player/moves.js';
import { PLAYER_ID } from '../shared/combatData.js';

test('a parry is a weapon: the parried enemy is stunned AND takes a riposte hit request from the player', () => {
  const ev = new EventEmitter(); const reqs = [];
  ev.on(EVENTS.HIT_REQUEST, (r) => reqs.push(r));
  const m = new EnemyManager({ events: ev });
  m.spawn({ id: 'a', x: 500, y: 300 });
  ev.emit(EVENTS.PARRY_STUN, { attackerId: 'a', hitstun: 900, riposte: PARRY.riposteDamage });
  assert.equal(m.get('a').state, 'hitstun');
  const r = reqs.find((q) => q.riposte);
  assert.ok(r, 'riposte hit request emitted');
  assert.equal(r.attackerId, PLAYER_ID); assert.equal(r.team, 'player'); assert.equal(r.damage, PARRY.riposteDamage);
  assert.equal(r.knockback, 0); assert.equal(r.lane, 300);
  // box covers the stunned enemy's position so combat can land it
  assert.ok(r.origin.x + r.hitbox.x <= 500 && r.origin.x + r.hitbox.x + r.hitbox.w >= 500);
});
test('no riposte when the event carries none (old callers)', () => {
  const ev = new EventEmitter(); const reqs = [];
  ev.on(EVENTS.HIT_REQUEST, (r) => reqs.push(r));
  const m = new EnemyManager({ events: ev }); m.spawn({ id: 'a', x: 500, y: 300 });
  ev.emit(EVENTS.PARRY_STUN, { attackerId: 'a', hitstun: 900 });
  assert.equal(reqs.filter((q) => q.riposte).length, 0);
});
