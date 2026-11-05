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
  assert.deepEqual(Object.keys(PLAYER_MOVE_COMBAT), ['light1', 'light2', 'light3', 'airkick', 'heavy1']);
});

// airkick launches further than any other player move and gets its own hit-stop, shake and Options scaling
{
  const { PLAYER_MOVE_COMBAT: M } = await import('./combatData.js');
  const { MOVE_FEEDBACK, HIT_STOP_MS, shakeScale } = await import('./hitFeedback.js');
  const { hitStopMs } = await import('../combat/hitStop.js');
  for (const id of Object.keys(M)) if (id !== 'airkick') assert.ok(M.airkick.knockback > M[id].knockback, id);
  assert.ok(M.airkick.knockback >= 2 * M.light1.knockback);
  const fb = MOVE_FEEDBACK.airkick;
  assert.ok(hitStopMs(fb.hitStop) > hitStopMs('heavy') && hitStopMs(fb.hitStop) <= HIT_STOP_MS.max);
  assert.ok(fb.shake.intensity > 0.004 && fb.shake.ms > 140);
  // heavy combo: every hit out-shakes the finisher (140ms/0.004) and airkick; heavy3 is the biggest and longest
  const { heavy1, heavy2, heavy3, heavy4 } = MOVE_FEEDBACK;
  for (const h of [heavy1, heavy2, heavy3, heavy4]) assert.ok(h.shake.intensity > fb.shake.intensity && h.shake.ms > fb.shake.ms);
  assert.ok(heavy1.shake.intensity <= heavy2.shake.intensity && heavy2.shake.intensity <= heavy3.shake.intensity && heavy3.shake.intensity < heavy4.shake.intensity);
  assert.ok(hitStopMs(heavy4.hitStop) > hitStopMs(fb.hitStop) && hitStopMs(heavy4.hitStop) <= HIT_STOP_MS.max);
  assert.ok(heavy4.shake.ms > heavy3.shake.ms);
  assert.deepEqual([shakeScale('Off'), shakeScale('Light'), shakeScale('Full'), shakeScale(undefined)], [0, 0.5, 1, 1]);
}
