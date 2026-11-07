import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  varrAssets, varrAnimDefs, varrPose, varrAnimKey, varrRotationKey, varrStillKey, varrFitScale, varrMoveMs, VARR_ANIMS, VARR_MOVE_CLIPS,
} from './varrSprites.js';
import { VARR_MOVES } from './varrData.js';

const keys = new Set(varrAnimDefs().map((d) => d.key));
const tex = new Set(varrAssets().map((a) => a.key));
const base = { facing: 1, vx: 0, vy: 0, phase: 1, stance: null, stanceSeq: 0, stanceLeftMs: 0 };
const P1 = ['idle', 'strike', 'shield', 'override', 'counter', 'laugh', 'death'];
const P2 = ['idle2', 'walk2', 'slam', 'taser', 'combo', 'drones', 'jump'];

test('every art path resolves on disk (folder name has a space)', () => {
  const missing = varrAssets().filter((a) => !fs.existsSync(a.path));
  assert.deepEqual(missing, []);
  assert.ok(varrAssets().every((a) => a.path.startsWith('assets/sprites/Halden Varr/')));
});

test('frame counts and phase split match the export', () => {
  const n = Object.fromEntries(Object.entries(VARR_ANIMS).map(([k, a]) => [k, a.frames]));
  assert.deepEqual(n, { idle: 8, strike: 9, shield: 9, override: 9, counter: 9, laugh: 9, death: 7, idle2: 8, walk2: 8, slam: 9, taser: 9, combo: 9, drones: 9, jump: 7 });
  assert.deepEqual(Object.keys(VARR_ANIMS).filter((k) => VARR_ANIMS[k].p === 1), P1);
  assert.deepEqual(Object.keys(VARR_ANIMS).filter((k) => VARR_ANIMS[k].p === 2), P2);
});

test('rotation-only folders (Walking, Control Pulse, Rust Collapse) load as stills', () => {
  for (const n of ['walk1', 'control', 'collapse']) for (const d of ['east', 'west']) assert.ok(tex.has(varrStillKey(n, d)), `${n} ${d}`);
});

test('phase 1 moves use the phase 1 clips, both facings', () => {
  for (const id of ['strike', 'shield', 'override']) {
    for (const [f, d] of [[1, 'east'], [-1, 'west']]) {
      const p = varrPose({ ...base, facing: f, state: 'telegraph', move: VARR_MOVES[id], moveSeq: 3 });
      assert.equal(p.anim, varrAnimKey(id, d));
      assert.ok(keys.has(p.anim));
      assert.equal(p.totalMs, varrMoveMs(VARR_MOVES[id]));
      assert.ok(varrFitScale(p.clip, p.totalMs) > 0);
    }
  }
});

test('phase 2: EVERY state switches to 2nd_Phase art', () => {
  const one = (o) => varrPose({ ...base, phase: 2, ...o });
  assert.equal(one({ state: 'idle' }).anim, varrAnimKey('idle2', 'east'));
  assert.equal(one({ state: 'approach' }).anim, varrAnimKey('idle2', 'east'), 'stationary approach = idle');
  assert.equal(one({ state: 'approach', vx: 60 }).anim, varrAnimKey('walk2', 'east'));
  assert.equal(one({ state: 'approach', vx: -60, facing: -1 }).anim, varrAnimKey('walk2', 'west'));
  assert.equal(one({ state: 'approach', vy: -60 }).anim, varrAnimKey('walk2', 'north'));
  assert.equal(one({ state: 'recover' }).anim, varrAnimKey('idle2', 'east'));
  assert.equal(one({ state: 'hitstun' }).still, varrStillKey('idle2', 'east'));
  for (const id of ['slam', 'taser', 'combo', 'drones']) {
    for (const st of ['telegraph', 'attack']) {
      const p = one({ state: st, move: VARR_MOVES[id], moveSeq: 5 });
      assert.equal(p.anim, varrAnimKey(id, 'east'), `${id} ${st}`);
      assert.ok(keys.has(p.anim));
      assert.equal(VARR_ANIMS[id].p, 2);
    }
  }
  for (const st of ['telegraph', 'attack']) assert.equal(one({ state: st, move: VARR_MOVES.control, moveSeq: 1 }).still, varrStillKey('control', 'east'));
  assert.equal(one({ state: 'telegraph', move: VARR_MOVES.collapse, moveSeq: 1 }).still, varrStillKey('collapse', 'east'));
  const leap = one({ state: 'attack', move: VARR_MOVES.collapse, moveSeq: 1 });
  assert.equal(leap.anim, varrAnimKey('jump', 'east'));
  assert.ok(keys.has(leap.anim));
  // no phase 1 art leaks into phase 2 (stance or not)
  const states = ['idle', 'approach', 'telegraph', 'attack', 'recover', 'hitstun'];
  for (const m of [null, ...Object.values(VARR_MOVES).filter((mv) => mv.phase === 2)]) {
    for (const st of states) for (const f of [1, -1]) {
      const p = one({ state: st, move: m, moveSeq: 2, facing: f, vx: 40, stance: 'anti-air', stanceSeq: 1, stanceLeftMs: 7000 });
      for (const k of [p.anim, p.still].filter(Boolean)) {
        assert.ok(!/\.(idle|strike|shield|override|counter|laugh)\.(east|west)/.test(k) && !/still\.(idle|walk1)\./.test(k), `${st}/${m?.id}: ${k}`);
      }
    }
  }
});

test('every phase 2 move is reachable as a distinct pose', () => {
  const poses = new Set();
  for (const m of Object.values(VARR_MOVES).filter((mv) => mv.phase === 2)) {
    for (const st of ['telegraph', 'attack']) {
      const p = varrPose({ ...base, phase: 2, state: st, move: m, moveSeq: 1 });
      poses.add(p.anim || p.still);
    }
  }
  assert.equal(poses.size, 7, 'slam, taser, combo, drones, control still, collapse still, jump leap');
  for (const id of Object.keys(VARR_MOVES)) assert.ok(id in VARR_MOVE_CLIPS, `${id} is mapped`);
});

test('Drone Command has east art only: west facing mirrors it', () => {
  const w = varrPose({ ...base, phase: 2, facing: -1, state: 'telegraph', move: VARR_MOVES.drones, moveSeq: 1 });
  assert.equal(w.anim, varrAnimKey('drones', 'east'));
  assert.equal(w.flipX, true);
  assert.equal(varrPose({ ...base, phase: 2, facing: 1, state: 'telegraph', move: VARR_MOVES.drones, moveSeq: 1 }).flipX, false);
});

test('transform laughs; death uses death_fall (east clip, mirrored for west) in both phases', () => {
  assert.equal(varrPose({ ...base, state: 'transform' }).anim, varrAnimKey('laugh', 'east'));
  assert.ok(keys.has(varrPose({ ...base, facing: -1, state: 'transform' }).anim));
  for (const phase of [1, 2]) {
    for (const f of [1, -1]) {
      const p = varrPose({ ...base, phase, facing: f, state: 'dead' });
      assert.equal(p.anim, varrAnimKey('death', 'east'));
      assert.equal(p.flipX, f < 0);
      assert.ok(p.death && keys.has(p.anim));
    }
  }
});

test('phase 1 idle / walk / hitstun / counter stance', () => {
  assert.equal(varrPose({ ...base, state: 'idle' }).anim, varrAnimKey('idle', 'east'));
  assert.equal(varrPose({ ...base, state: 'idle' }).rotation, varrStillKey('idle', 'east'));
  assert.equal(varrRotationKey('east'), varrStillKey('idle', 'east'));
  const w = varrPose({ ...base, state: 'approach', vx: 50 });
  assert.ok(w.walk && w.bob && tex.has(w.still), 'phase 1 walk = rotation + bob');
  assert.ok(varrPose({ ...base, state: 'hitstun' }).stagger);
  const c = varrPose({ ...base, state: 'approach', stance: 'anti-air', stanceSeq: 2, stanceLeftMs: 6900 });
  assert.equal(c.anim, varrAnimKey('counter', 'east'));
  assert.ok(keys.has(c.anim));
  assert.equal(varrPose({ ...base, state: 'approach', stance: 'anti-air', stanceSeq: 2, stanceLeftMs: 3000 }).anim, varrAnimKey('idle', 'east'), 'clip only plays at the start of a stance');
});
