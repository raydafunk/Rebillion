import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  subject88Assets, subject88AnimDefs, subject88Pose, subject88AnimKey, subject88RotationKey, subject88FitScale, subject88MoveMs, SUBJECT88_ANIMS,
} from './subject88Sprites.js';
import { SUBJECT88_MOVES } from './subject88Data.js';

const keys = new Set(subject88AnimDefs().map((d) => d.key));
const base = { facing: 1, vx: 0, vy: 0 };

test('every art path resolves on disk (folder name has a space)', () => {
  const missing = subject88Assets().filter((a) => !fs.existsSync(a.path));
  assert.deepEqual(missing, []);
  assert.ok(subject88Assets().every((a) => a.path.startsWith('assets/sprites/Subject 88/')));
});
test('frame counts match the export', () => {
  const n = Object.fromEntries(Object.entries(SUBJECT88_ANIMS).map(([k, a]) => [k, a.frames]));
  assert.deepEqual(n, { idle: 8, walk: 8, breath: 9, spit: 9, charge: 9, slam: 9, hit: 6, death: 7 });
});
test('every move has a registered, fitted clip', () => {
  for (const id of Object.keys(SUBJECT88_MOVES)) {
    const p = subject88Pose({ ...base, state: 'telegraph', move: SUBJECT88_MOVES[id], moveSeq: 2 });
    assert.ok(p.move && keys.has(p.anim) && p.totalMs === subject88MoveMs(SUBJECT88_MOVES[id]), id);
    assert.ok(subject88FitScale(p.clip, p.totalMs) > 0);
    const w = subject88Pose({ ...base, facing: -1, state: 'attack', move: SUBJECT88_MOVES[id], moveSeq: 2 });
    assert.ok(keys.has(w.anim), `${id} west`);
  }
  assert.equal(subject88Pose({ ...base, state: 'telegraph', move: SUBJECT88_MOVES.explosion, moveSeq: 1 }).clip, 'breath', 'explosion reuses the breath clip');
});
test('hit, death, idle, walk poses', () => {
  for (const f of [1, -1]) {
    for (const s of ['hitstun', 'dead', 'idle']) assert.ok(keys.has(subject88Pose({ ...base, facing: f, state: s }).anim), s);
  }
  assert.ok(subject88Pose({ ...base, state: 'hitstun' }).hit);
  assert.ok(subject88Pose({ ...base, state: 'dead' }).death);
  assert.equal(subject88Pose({ ...base, state: 'idle' }).anim, subject88AnimKey('idle', 'east'));
  assert.equal(subject88Pose({ ...base, state: 'idle' }).rotation, subject88RotationKey('east'));
  for (const [vx, vy] of [[50, 0], [-50, 0], [0, 50], [0, -50], [50, 50], [-50, -50]]) {
    assert.ok(keys.has(subject88Pose({ ...base, state: 'approach', vx, vy }).anim), `walk ${vx},${vy}`);
  }
});
