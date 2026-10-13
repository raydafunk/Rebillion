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
  for (let i = 0; i < 16; i++) m.step(NONE);
  assert.equal(m.state, 'dodge'); assert.equal(m.guardType, null);
  for (let i = 0; i < 10; i++) m.step(NONE);
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
  assert.ok(zedPose({ state: 'attack', phase: 'active', moveId: 'heavy1', facing: 1, t: 0 }).ox > zedPose({ state: 'attack', phase: 'active', moveId: 'light1', facing: 1, t: 0 }).ox);
  assert.ok(zedPose({ state: 'attack', phase: 'active', moveId: 'light1', facing: -1, t: 0 }).ox < 0);
  assert.equal(zedTextureKey('Idle', 'east'), 'zed.idle.east');
  for (const d of Object.values(ZED_SPRITE.dir)) assert.ok(existsSync(new URL(`../../../assets/sprites/zed/Idle/rotations/${d}.png`, import.meta.url)));
});

import { ZED_ANIMS, zedFrameKey, zedAnimKey, zedFramePath } from '../zedVisual.js';
test('zed walk anim: keys, files, metadata agree', () => {
  assert.equal(zedAnimKey('run', 'east'), 'zed.run.east');
  assert.equal(zedFrameKey('run', 'west', 3), 'zed.run.west.3');
  const meta = JSON.parse(readFileSync(new URL('../../../assets/sprites/zed/metadata.json', import.meta.url), 'utf8'));
  for (const a of ZED_ANIMS) {
    const st = meta.states.find((x) => x.folder === a.folder);
    // metadata.json is regenerated per export and may list only the newest state; files below are the hard check
    if (st) assert.deepEqual([st.character.size.width, st.character.size.height], [ZED_SPRITE.size, ZED_SPRITE.size]);
    for (const d of Object.values(ZED_SPRITE.dir)) {
      if (st) assert.equal(st.frames.animations[a.anim][d].length, a.frames);
      for (let i = 0; i < a.frames; i++) {
        if (st) assert.equal(st.frames.animations[a.anim][d][i], zedFramePath(a, d, i));
        assert.ok(existsSync(new URL(`../../../assets/sprites/zed/${zedFramePath(a, d, i)}`, import.meta.url)));
      }
    }
  }
  assert.ok(ZED_ANIMS.every((a) => a.fps >= 10 && a.fps <= 12));
  assert.equal(ZED_ANIMS[0].state, 'run');
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
