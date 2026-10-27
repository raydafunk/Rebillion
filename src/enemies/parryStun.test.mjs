import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { EnemyManager } from './EnemyManager.js';
import { EVENTS } from '../shared/events.js';

test('parry-stun stuns only the parried grunt in place, no knockback', () => {
  const ev = new EventEmitter();
  const m = new EnemyManager({ events: ev });
  m.spawn({ id: 'a', x: 500, y: 300 });
  m.spawn({ id: 'b', x: 520, y: 300 });
  ev.emit(EVENTS.PARRY_STUN, { attackerId: 'a', hitstun: 900 });
  assert.equal(m.get('a').state, 'hitstun');
  assert.equal(m.get('a').kx, 0);
  assert.notEqual(m.get('b').state, 'hitstun');
  m.update(500, { x: 400, y: 300 });
  assert.equal(m.get('a').state, 'hitstun'); // still stunned mid-window
  assert.equal(m.get('a').x, 500);           // and has not moved
  m.update(500, { x: 400, y: 300 });
  assert.notEqual(m.get('a').state, 'hitstun');
});
