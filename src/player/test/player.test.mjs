// Run: node --test src/player/test/
import test from 'node:test';
import assert from 'node:assert/strict';
import { mapKeys, InputState } from '../input.js';
import { JumpController } from '../jump.js';
import { ZED_CONFIG } from '../config.js';
import { PlayerStateMachine } from '../stateMachine.js';
import { MOVES } from '../moves.js';

const NONE = { pressed: {}, held: {}, moveX: 0 };
const press = (k) => ({ pressed: { [k]: true }, held: { [k]: true }, moveX: 0 });

test('input maps keys and detects edges', () => {
  assert.equal(mapKeys(['KeyA']).left, true);
  assert.equal(mapKeys(['KeyJ']).light, true);
  const i = new InputState();
  i.poll(['KeyJ']); assert.equal(i.pressed.light, true);
  i.poll(['KeyJ']); assert.equal(i.pressed.light, false);
  i.poll([]); assert.equal(i.released.light, true);
  i.poll(['ArrowLeft', 'ArrowRight']); assert.equal(i.moveX, 0);
});

test('coyote and jump buffer', () => {
  const j = new JumpController(ZED_CONFIG);
  j.update({ grounded: true, jumpPressed: false }, 16);
  assert.equal(j.update({ grounded: false, jumpPressed: true }, 16), true); // coyote
  const k = new JumpController(ZED_CONFIG);
  assert.equal(k.update({ grounded: false, jumpPressed: true }, 16), false);
  assert.equal(k.update({ grounded: true, jumpPressed: false }, 16), true); // buffered
});

test('idle/run/jump/block transitions', () => {
  const m = new PlayerStateMachine();
  assert.equal(m.step(NONE), 'idle');
  assert.equal(m.step({ ...NONE, moveX: 1 }), 'run');
  assert.equal(m.step(NONE, { grounded: false }), 'jump');
  assert.equal(m.step({ pressed: {}, held: { block: true }, moveX: 0 }), 'block');
  assert.equal(m.step(NONE), 'idle');
});

test('light attack phases and return to idle', () => {
  const m = new PlayerStateMachine();
  const L = MOVES.light1;
  m.step(press('light'));
  assert.equal(m.state, 'attack'); assert.equal(m.moveId, 'light1');
  let n = 1;
  while (m.state === 'attack' && n < 100) { m.step(NONE); n++; }
  assert.equal(n, L.startup + L.active + L.recovery);
  assert.equal(m.state, 'idle');
});

test('3-hit combo with buffered presses; active fires once per move', () => {
  const fired = [];
  const m = new PlayerStateMachine({ onActiveStart: (id) => fired.push(id) });
  m.step(press('light'));
  for (let f = 0; f < 200 && m.moveId !== 'light3'; f++) {
    // press light whenever in cancel region
    const inWin = m.state === 'attack' && m.frame >= MOVES[m.moveId].cancelFrom - 2;
    m.step(inWin ? press('light') : NONE);
  }
  for (let f = 0; f < 100 && m.state === 'attack'; f++) m.step(NONE);
  assert.deepEqual(fired, ['light1', 'light2', 'light3']);
  assert.equal(m.state, 'idle');
});

test('cannot cancel before cancelFrom; early press is buffered into it', () => {
  const m = new PlayerStateMachine();
  m.step(press('light'));
  m.step(press('light')); // frame 1, well before cancelFrom=7, buffer 8 frames
  assert.equal(m.moveId, 'light1');
  for (let i = 0; i < 4; i++) m.step(NONE);
  assert.equal(m.moveId, 'light1');
  for (let i = 0; i < 4; i++) m.step(NONE);
  assert.equal(m.moveId, 'light2');
});

test('finisher cannot chain; heavy is not cancelable', () => {
  const m = new PlayerStateMachine();
  m.step(press('heavy'));
  for (let i = 0; i < 10; i++) m.step(press('light'));
  assert.equal(m.moveId, 'heavy1');
});

test('hitstun interrupts attack, lasts N frames, then idle', () => {
  const m = new PlayerStateMachine();
  m.step(press('light'));
  m.hit(5);
  assert.equal(m.state, 'hitstun');
  for (let i = 0; i < 4; i++) assert.equal(m.step(press('light')), 'hitstun');
  assert.notEqual(m.step(NONE), 'hitstun');
});

test('onActive fires every active frame with one swing id; new swing per move', () => {
  const log = [];
  const m = new PlayerStateMachine({ onActive: (id, mv, sw) => log.push([id, sw]) });
  m.step(press('light'));
  for (let i = 0; i < 40; i++) m.step(NONE);
  assert.equal(log.length, MOVES.light1.active);
  assert.ok(log.every((e) => e[1] === log[0][1]));
  m.step(press('light'));
  for (let i = 0; i < 10; i++) m.step(NONE);
  assert.notEqual(log[log.length - 1][1], log[0][1]);
});

test('block starts as parry window then plain block; dodge has i-frames then ends', () => {
  const m = new PlayerStateMachine();
  const B = { pressed: {}, held: { block: true }, moveX: 0 };
  m.step(B); assert.equal(m.guardType, 'parry');
  for (let i = 0; i < 10; i++) m.step(B);
  assert.equal(m.guardType, 'block');
  m.step(NONE);
  m.step({ pressed: { dodge: true }, held: {}, moveX: 0 });
  assert.equal(m.state, 'dodge'); assert.equal(m.guardType, 'dodge');
  for (let i = 0; i < 22; i++) m.step(NONE);
  assert.equal(m.state, 'dodge'); assert.equal(m.guardType, null);
  for (let i = 0; i < 20; i++) m.step(NONE);
  assert.equal(m.state, 'idle');
});

test('combo then hit-stun simulation', () => {
  const m = new PlayerStateMachine();
  m.step(press('light'));
  for (let i = 0; i < 9; i++) m.step(i === 6 ? press('light') : NONE);
  assert.equal(m.moveId, 'light2');
  m.hit(10);
  assert.equal(m.state, 'hitstun');
  for (let i = 0; i < 12; i++) m.step(NONE);
  assert.equal(m.state, 'idle');
});

import { zedPose, zedTextureKey, ZED_SPRITE } from '../zedVisual.js';
import { readFileSync, existsSync } from 'node:fs';

test('zed visual: pose is data-driven per state and sprites exist', () => {
  assert.equal(zedPose({ state: 'attack', phase: 'active', moveId: 'light1', t: 0 }).tint, 0xfff2b0);
  assert.equal(zedPose({ state: 'hitstun', t: 0 }).tintFill, 0xffffff);
  assert.equal(zedPose({ state: 'block', t: 0 }).tint, 0x88aaff);
  assert.equal(zedPose({ state: 'idle', t: 0 }).alpha, 1);
  // idle breathes gently: height only, never squashes below 1, max ~1%, feet stay on the ground
  let maxSy = 1;
  for (let t = 0; t < 3000; t += 50) {
    const p = zedPose({ state: 'idle', t });
    assert.equal(p.sx, 1); assert.equal(p.oy, 0); assert.ok(p.sy >= 1 && p.sy <= 1.0101);
    maxSy = Math.max(maxSy, p.sy);
  }
  assert.ok(maxSy > 1.005, 'idle still breathes');
  assert.ok(zedPose({ state: 'attack', phase: 'active', moveId: 'heavy1', facing: 1, t: 0 }).ox > zedPose({ state: 'attack', phase: 'active', moveId: 'light1', facing: 1, t: 0 }).ox);
  assert.ok(zedPose({ state: 'attack', phase: 'active', moveId: 'light1', facing: -1, t: 0 }).ox < 0);
  assert.equal(zedTextureKey('Idle', 'east'), 'zed.idle.east');
  for (const d of Object.values(ZED_SPRITE.dir)) assert.ok(existsSync(new URL(`../../../assets/sprites/zed/Idle/rotations/${d}.png`, import.meta.url)));
});

import { ZED_ANIMS, zedFrameKey, zedAnimKey, zedFramePath } from '../zedVisual.js';
test('zed run anim: keys, files, metadata agree', () => {
  assert.equal(zedAnimKey('run', 'east'), 'zed.run.east');
  assert.equal(zedFrameKey('run', 'west', 3), 'zed.run.west.3');
  const meta = JSON.parse(readFileSync(new URL('../../../assets/sprites/zed/metadata.json', import.meta.url), 'utf8'));
  for (const a of ZED_ANIMS) {
    const st = meta.states.find((x) => x.folder === a.folder);
    // metadata.json is regenerated per export and may list only the newest state; files below are the hard check
    for (const d of Object.values(ZED_SPRITE.dir)) {
      if (st) assert.equal(st.frames.animations[a.anim][d].length, a.frames);
      for (let i = 0; i < a.frames; i++) {
        if (st) assert.equal(st.frames.animations[a.anim][d][i], zedFramePath(a, d, i));
        assert.ok(existsSync(new URL(`../../../assets/sprites/zed/${zedFramePath(a, d, i)}`, import.meta.url)));
      }
    }
  }
  assert.ok(ZED_ANIMS.every((a) => a.fps >= 10 && a.fps <= 30));
  assert.equal(ZED_ANIMS[0].state, 'run');
  assert.equal(new Set(ZED_ANIMS.map((a) => a.state)).size, ZED_ANIMS.length, 'frame texture keys must not collide');
});

import { ZED_POSES } from '../zedVisual.js';
import { KEY_MAP, padToKeys } from '../input.js';
test('jump: pose textures exist, keys and gamepad map to jump edge', () => {
  assert.equal(ZED_POSES.jump.state, 'Jumping');
  assert.equal(zedTextureKey(ZED_POSES.jump.state, 'west'), 'zed.jumping.west');
  for (const d of Object.values(ZED_SPRITE.dir)) assert.ok(existsSync(new URL(`../../../assets/sprites/zed/Jumping/rotations/${d}.png`, import.meta.url)));
  assert.ok(zedPose({ state: 'jump', vy: -100, t: 0 }).sy > 1);
  assert.ok(zedPose({ state: 'jump', vy: 100, t: 0 }).sy < 1);
  // no snap at the apex: the shape changes smoothly as vy crosses zero
  const a = zedPose({ state: 'jump', vy: -5, t: 0 }), b = zedPose({ state: 'jump', vy: 5, t: 0 });
  assert.ok(Math.abs(a.sy - b.sy) < 0.01 && Math.abs(a.sx - b.sx) < 0.01);
  for (const k of ['Space', 'KeyW', 'ArrowUp']) {
    const i = new InputState(); i.poll([]); assert.equal(i.poll([k]).pressed.jump, true);
    assert.equal(i.poll([k]).pressed.jump, false); // held, no re-trigger
  }
  assert.ok(KEY_MAP.jump.includes('Space'));
  const pad = { buttons: Array.from({ length: 16 }, () => ({ pressed: false })), axes: [0, 0] };
  pad.buttons[0].pressed = true;
  assert.equal(new InputState().poll(padToKeys(pad)).pressed.jump, true);
  pad.buttons[0].pressed = false; pad.axes[0] = 0.9;
  assert.equal(new InputState().poll(padToKeys(pad)).moveX, 1);
});

import { punchLunge } from '../zedVisual.js';
test('punch lunge: coils back, steps forward, settles; mirrors with facing', () => {
  const at = (frame, moveId = 'light1', facing = 1) => punchLunge({ moveId, frame }, facing);
  assert.ok(at(3) < 0, 'wind-up pulls back');
  assert.ok(at(6) > 0, 'active frames step into the hit');
  assert.ok(Math.abs(at(14)) < Math.abs(at(6)), 'recovery settles');
  assert.equal(at(6, 'light1', -1), -at(6, 'light1', 1));
  assert.ok(at(18, 'heavy1') > at(6, 'light1'), 'heavy lunges further');
  assert.equal(punchLunge({ moveId: null, frame: 0 }), 0);
});

// Human tap rhythm: 3 single-frame taps `gap` frames apart must reach punch -> punch -> kick.
test('3 taps at human rhythm (7-20 frames apart, 117-333 ms) reach light3', () => {
  for (let gap = 7; gap <= 20; gap++) {
    const fired = [];
    const m = new PlayerStateMachine({ onActiveStart: (id) => fired.push(id) });
    for (let f = 0; f < 3 * gap + 80; f++) {
      m.step(f % gap === 0 && f / gap < 3 ? press('light') : NONE);
    }
    assert.deepEqual(fired, ['light1', 'light2', 'light3'], `gap ${gap}`);
  }
});

test('light3 kick: onActive fires with its hitbox, clip finishes, west/east frames exist', () => {
  const hits = [];
  const m = new PlayerStateMachine({ onActive: (id, mv) => hits.push([id, mv.hitbox.w]) });
  m.step(press('light'));
  for (let f = 0; f < 60; f++) m.step(f === 6 || f === 14 ? press('light') : NONE);
  assert.equal(hits.filter((h) => h[0] === 'light3').length, MOVES.light3.active);
  assert.equal(hits.find((h) => h[0] === 'light3')[1], MOVES.light3.hitbox.w);
  assert.equal(m.state, 'idle');
  const k = ZED_ANIMS.find((a) => a.state === 'light3');
  assert.ok(k, 'light3 clip registered');
  assert.equal(zedAnimKey('light3', 'west'), 'zed.light3.west');
  for (const d of ['east', 'west']) for (let i = 0; i < k.frames; i++) assert.ok(existsSync(new URL(`../../../assets/sprites/zed/${zedFramePath(k, d, i)}`, import.meta.url)));
});

test('combo works while running (moveX held) and a heavy mid-combo does not break the chain', () => {
  const run = (k) => ({ pressed: k ? { [k]: true } : {}, held: {}, moveX: -1 });
  const fired = [];
  const m = new PlayerStateMachine({ onActiveStart: (id) => fired.push(id) });
  m.step(run('light'));
  for (let f = 1; f < 80; f++) m.step(run(f === 9 || f === 18 ? 'light' : null));
  assert.deepEqual(fired, ['light1', 'light2', 'light3']);
  const h = new PlayerStateMachine();
  h.step(press('light'));
  for (let i = 0; i < 8; i++) h.step(i === 7 ? press('heavy') : NONE);
  assert.equal(h.moveId, 'heavy1');
});

test('controls table bindings: dodge L/C, block I/V, no Shift, no shared keys', () => {
  assert.deepEqual(KEY_MAP.dodge, ['KeyL', 'KeyC']);
  assert.deepEqual(KEY_MAP.block, ['KeyI', 'KeyV']);
  const all = Object.values(KEY_MAP).flat();
  assert.equal(new Set(all).size, all.length, 'a key is bound to two actions');
  assert.ok(!all.includes('ShiftLeft'));
  for (const k of ['KeyL', 'KeyC']) { const m = mapKeys([k]); assert.equal(m.dodge, true); assert.equal(m.block, false); }
  for (const k of ['KeyI', 'KeyV']) { const m = mapKeys([k]); assert.equal(m.block, true); assert.equal(m.dodge, false); }
  const pad = { buttons: Array.from({ length: 16 }, () => ({ pressed: false })), axes: [0, 0] };
  pad.buttons[1].pressed = true;
  const p = new InputState().poll(padToKeys(pad));
  assert.equal(p.held.dodge, true); assert.equal(p.held.block, false);
});

import { DODGE } from '../moves.js';
