import assert from 'node:assert/strict';
import fs from 'node:fs';
import { kaneAssets, kaneAnimDefs, kanePose, kaneAnimKey, kaneRotationKey, kaneFitScale, KANE_SLAM_MS } from './kaneSprites.js';
import { KANE_ID, KANE_SKIN, KANE_MOVES } from './kaneData.js';

assert.equal(KANE_SKIN, KANE_ID, 'Kane wears his own art, not the Breaker skin');
const missing = kaneAssets().filter((a) => !fs.existsSync(a.path));
assert.deepEqual(missing, [], 'all Crusher Kane art paths resolve');
assert.equal(kaneAnimDefs().length, 4 + 4 + 2 + 2 + 2 + 2 + 2 + 2, 'idle(4) walk(4) slam(2) hit(2) death(2) hook(2) kick(2) vent(2)');
assert.equal(KANE_SLAM_MS, 850 + 340);

const base = { facing: 1, vx: 0, vy: 0 };
assert.equal(kanePose({ ...base, state: 'idle' }).anim, kaneAnimKey('idle', 'east'));
assert.equal(kanePose({ ...base, state: 'idle', facing: -1 }).anim, kaneAnimKey('idle', 'west'));
assert.equal(kanePose({ ...base, state: 'approach', vx: -50 }).anim, kaneAnimKey('walk', 'west'));
assert.equal(kanePose({ ...base, state: 'approach', vy: -50 }).anim, kaneAnimKey('walk', 'north'));
assert.ok(kanePose({ ...base, state: 'approach', vx: 50, vy: 50 }).anim.includes('.walk.'), 'diagonal walk falls back to an existing clip');
assert.ok(kaneAnimDefs().some((d) => d.key === kanePose({ ...base, state: 'approach', vx: 50, vy: 50 }).anim));
for (const s of ['telegraph', 'attack']) {
  const p = kanePose({ ...base, state: s, move: KANE_MOVES.hammer, moveSeq: 3 });
  assert.ok(p.move && p.clip === 'slam' && p.totalMs === KANE_SLAM_MS && p.seq === 'mv3', `${s}: one hammer slam clip across wind-up + strike`);
}
for (const [id, clip] of [['hammer', 'slam'], ['hook', 'hook'], ['kick', 'kick'], ['vent', 'vent'], ['uppercut', 'slam']]) {
  const m = KANE_MOVES[id], p = kanePose({ ...base, state: 'telegraph', move: m, moveSeq: 1 });
  assert.equal(p.clip, clip, `${id} plays the ${clip} clip`);
  assert.equal(p.totalMs, m.telegraphMs + m.attackMs);
  assert.ok(kaneAnimDefs().some((d) => d.key === p.anim), `${id}: the clip is registered`);
}
assert.ok(kanePose({ ...base, state: 'hitstun' }).hit);
assert.ok(kanePose({ ...base, state: 'dead' }).death);
assert.equal(kanePose({ ...base, state: 'recover' }).anim, kaneAnimKey('idle', 'east'));
assert.equal(kanePose({ ...base, state: 'idle' }).rotation, kaneRotationKey('east'));
assert.ok(kaneFitScale('slam', KANE_SLAM_MS) > 0);
console.log('kaneSprites ok');
