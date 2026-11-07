import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { RAPTOR_MOVES } from './raptorData.js';
import { raptorAssets, raptorAnimDefs, raptorPose, raptorAnimKey, raptorRotationKey, raptorFitScale, raptorMoveMs } from './raptorSprites.js';

const keys = new Set(raptorAnimDefs().map((d) => d.key));
const base = { facing: 1, vx: 0, vy: 0 };

test('every Raptor art path resolves on disk', () => {
  assert.deepEqual(raptorAssets().filter((a) => !fs.existsSync(a.path)), []);
});
test('every move has a registered, fitted clip', () => {
  for (const id of Object.keys(RAPTOR_MOVES)) {
    const rush = id === 'rush';
    const p = raptorPose({ ...base, state: rush ? 'attack' : 'telegraph', running: false, move: RAPTOR_MOVES[id], moveSeq: 2, lift: rush ? 0 : 40 });
    assert.ok(p.move && keys.has(p.anim) && p.totalMs === raptorMoveMs(RAPTOR_MOVES[id]), id);
    assert.equal(p.lift, rush ? 0 : 40);
    assert.ok(raptorFitScale(p.clip, p.totalMs) > 0);
  }
});
test('hit, death, idle, walk poses', () => {
  const h = raptorPose({ ...base, state: 'hitstun' }); assert.ok(h.hit && keys.has(h.anim));
  const d = raptorPose({ ...base, state: 'dead', facing: -1 }); assert.ok(d.death && keys.has(d.anim));
  assert.equal(raptorPose({ ...base, state: 'idle' }).anim, raptorAnimKey('idle', 'east'));
  assert.equal(raptorPose({ ...base, state: 'idle' }).rotation, raptorRotationKey('east'));
  assert.equal(raptorPose({ ...base, state: 'approach', vx: -50, facing: 1 }).anim, raptorAnimKey('walk', 'east'));
  assert.ok(keys.has(raptorPose({ ...base, state: 'approach', vy: 50 }).anim));
  assert.ok(keys.has(raptorPose({ ...base, state: 'approach', vx: 50, vy: 50 }).anim));
});

test('after the Dive Kick he plays the landing clip (not a still), fitted to RAPTOR_LANDING_MS', async () => {
  const { raptorPose: pose, raptorAnimKey: key, RAPTOR_LANDING_MS: ms } = await import('./raptorSprites.js');
  const p = pose({ state: 'recover', facing: 1, move: { id: 'dive' }, moveSeq: 7, lift: 0 });
  assert.equal(p.anim, key('landing', 'east')); assert.equal(p.move, true); assert.equal(p.clip, 'landing'); assert.equal(p.totalMs, ms); assert.equal(p.seq, 'land7');
  assert.equal(pose({ state: 'recover', facing: -1, move: { id: 'punch' }, moveSeq: 7 }).clip, undefined, 'other moves keep idle recovery');
});

test('run clip is looped, registered, and only returned during the rush run phase', () => {
  const run = raptorAnimKey('run', 'east'), loop = raptorAnimDefs().find((d) => d.key === run);
  assert.ok(loop && loop.repeat === -1);
  assert.ok(raptorAssets().some((a) => a.path.includes('Running_state')) && raptorAssets().some((a) => a.path.includes('6_hit_punch')));
  const rush = RAPTOR_MOVES.rush;
  assert.equal(raptorPose({ ...base, state: 'attack', move: rush, running: true, moveSeq: 3 }).anim, run);
  assert.equal(raptorPose({ ...base, state: 'attack', move: rush, running: false, moveSeq: 3 }).clip, 'six');
  assert.notEqual(raptorPose({ ...base, state: 'telegraph', move: rush, running: false, moveSeq: 3 }).anim, run);
  for (const state of ['idle', 'approach', 'telegraph', 'attack', 'recover', 'hitstun', 'dead']) {
    for (const move of [null, ...Object.values(RAPTOR_MOVES).filter((m) => m.id !== 'rush')]) {
      for (const facing of [1, -1]) for (const [vx, vy] of [[0, 0], [90, 0], [0, 60], [-90, 40]]) {
        const p = raptorPose({ ...base, facing, vx, vy, state, move, moveSeq: 1, running: false });
        assert.ok(!p.anim.includes('.run.') && !p.run, 'no run pose: ' + state + ' ' + (move && move.id));
      }
    }
  }
  assert.ok(!raptorPose({ ...base, state: 'recover', move: rush, running: false }).anim.includes('.run.'));
});

test('block clip: registered east/west, 9 frames, once, fitted to the raise, then holds; clip key matches the floor-line regex', async () => {
  const { RAPTOR_BLOCK } = await import('./raptorData.js');
  const east = raptorAnimKey('block', 'east'), west = raptorAnimKey('block', 'west');
  assert.ok(keys.has(east) && keys.has(west));
  const def = raptorAnimDefs().find((d) => d.key === east); assert.equal(def.frames.length, 9); assert.equal(def.repeat, 0);
  assert.ok(/^rust\.raptor\.(?!death|rot)/.test(def.frames[0]), 'shares the idle floor line in ArenaScene._feetFrac');
  const p = raptorPose({ ...base, state: 'block', facing: -1, blockSeq: 3, move: null });
  assert.equal(p.anim, west); assert.equal(p.once, true); assert.equal(p.move, true); assert.equal(p.clip, 'block'); assert.equal(p.seq, 'blk3'); assert.equal(p.totalMs, RAPTOR_BLOCK.raiseMs); assert.equal(p.lift, 0);
  assert.ok(raptorFitScale('block', p.totalMs) > 0);
  assert.equal(raptorPose({ ...base, state: 'block', blockSeq: 4 }).seq, 'blk4', 'each block restarts the clip');
  assert.equal(raptorAssets().filter((a) => a.key.includes('.block.')).length, 18);
});
