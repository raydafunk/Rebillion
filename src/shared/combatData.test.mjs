import test from 'node:test';
import assert from 'node:assert/strict';
import { PLAYER_MOVE_COMBAT, GRUNT_ATTACK_COMBAT } from './combatData.js';

const KEYS = ['damage', 'knockback', 'hitstun'];
test('every player move and grunt attack defines damage, knockback, hitstun, hitbox', () => {
  for (const t of [PLAYER_MOVE_COMBAT, GRUNT_ATTACK_COMBAT]) {
    for (const [id, m] of Object.entries(t)) {
      for (const k of KEYS) assert.ok(m[k] > 0, `${id}.${k}`);
      for (const k of ['x', 'y', 'w', 'h']) assert.equal(typeof m.hitbox[k], 'number', `${id}.hitbox.${k}`);
    }
  }
  assert.deepEqual(Object.keys(PLAYER_MOVE_COMBAT), ['light1', 'light2', 'light3', 'heavy1']);
});
