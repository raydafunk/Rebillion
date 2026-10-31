// Run: node --test src/player/test/rage.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { RageMeter, RAGE_STATES as S } from '../rage.js';
import { RAGE_CONFIG as C, SPECIAL_MOVE } from '../rageConfig.js';
import { PlayerStateMachine } from '../stateMachine.js';
import { MOVES } from '../moves.js';
import { mapKeys } from '../input.js';

const mk = (level = 2) => { const log = []; const m = new RageMeter({ onEvent: (n, p) => log.push([n, p]) }); m.reset(level); return { m, log }; };
const fill = (m) => { while (m.state === S.BUILDING) m.onBlowLanded(); };
const NONE = { pressed: {}, held: {}, moveX: 0 };

test('level 1: hidden, cannot fill, no special', () => {
  const { m } = mk(1);
  assert.equal(m.state, S.HIDDEN); assert.equal(m.visible, false);
  for (let i = 0; i < 100; i++) m.onBlowLanded();
  assert.equal(m.value, 0); assert.equal(m.pressSpecial(true), 'ignored');
  m.reset(2); assert.equal(m.state, S.BUILDING); assert.equal(m.visible, true);
});

test('gain +3 per blow; +5 after 3 clean blows; hit resets streak', () => {
  const { m } = mk();
  assert.deepEqual([m.onBlowLanded(), m.onBlowLanded(), m.onBlowLanded()], [3, 3, 3]);
  assert.equal(m.onBlowLanded(), 5); assert.equal(m.onBlowLanded(), 5);
  assert.equal(m.value, 19);
  m.onHitTaken(); assert.equal(m.streak, 0);
  assert.equal(m.onBlowLanded(), 3);
});

test('drains 2/s while building, floors at 0, paused does not drain', () => {
  const { m } = mk();
  for (let i = 0; i < 5; i++) m.onBlowLanded(); // 3,3,3,5,5 = 19
  m.update(1, false); assert.equal(m.value, 17);
  m.update(10, true); assert.equal(m.value, 17);
  m.update(100, false); assert.equal(m.value, 0);
});

test('reaching 100 -> READY, holds 4s, then drains from 100 and press is lost', () => {
  const { m, log } = mk();
  fill(m);
  assert.equal(m.state, S.READY); assert.equal(m.value, 100); assert.equal(m.readyTimeLeft, 4);
  assert.ok(log.some(([n]) => n === 'ready'));
  m.update(3.9, false); assert.equal(m.state, S.READY); assert.equal(m.value, 100);
  m.update(5, true); assert.equal(m.readyTimeLeft > 0, true, 'paused: window frozen');
  m.update(0.2, false); // window ends, 0.1s of drain
  assert.equal(m.state, S.BUILDING); assert.ok(Math.abs(m.value - 99.8) < 1e-9);
  assert.equal(m.pressSpecial(true), 'ignored');
});

test('extra blows in READY give nothing; no value overflow', () => {
  const { m } = mk(); fill(m);
  assert.equal(m.onBlowLanded(), 0); assert.equal(m.value, 100);
});

test('L in READY starts Rage; 9s countdown, ~11/s, no gain, ends at 0 -> BUILDING from 0', () => {
  const { m, log } = mk(); fill(m);
  assert.equal(m.pressSpecial(true), 'started');
  assert.equal(m.state, S.ACTIVE); assert.equal(m.rageTimeLeft, 9);
  m.update(1, false); assert.ok(Math.abs(m.value - 100 * 8 / 9) < 1e-9);
  assert.equal(m.onBlowLanded(), 0); // no gain in ACTIVE
  m.onHitTaken(); m.update(1, false); // hits do not change the clock
  assert.ok(Math.abs(m.rageTimeLeft - 7) < 1e-9);
  m.update(7, true); assert.ok(Math.abs(m.rageTimeLeft - 7) < 1e-9, 'pause freezes Rage clock');
  m.update(7, false);
  assert.equal(m.state, S.BUILDING); assert.equal(m.value, 0);
  assert.equal(log.filter(([n, p]) => n === 'ended' && p.reason === 'expired').length, 1);
  m.onBlowLanded(); assert.equal(m.value, 3);
});

test('knockout ends Rage; knockdown (hit) does not', () => {
  const { m } = mk(); fill(m); m.pressSpecial(true);
  m.onHitTaken(); assert.equal(m.state, S.ACTIVE);
  m.onKnockout(); assert.equal(m.state, S.BUILDING); assert.equal(m.value, 0);
});

test('buffered press fires on landing; hit cancels it; window expiry loses it', () => {
  let { m } = mk(); fill(m);
  assert.equal(m.pressSpecial(false), 'buffered'); assert.equal(m.buffered, true);
  assert.equal(m.update(0.1, false, { canStart: false }), false); assert.equal(m.state, S.READY);
  assert.equal(m.update(0.1, false, { canStart: true }), true); assert.equal(m.state, S.ACTIVE); assert.equal(m.buffered, false);

  ({ m } = mk()); fill(m); m.pressSpecial(false); m.onHitTaken();
  assert.equal(m.buffered, false);
  assert.equal(m.update(0.1, false, { canStart: true }), false); assert.equal(m.state, S.READY);

  ({ m } = mk()); fill(m); m.pressSpecial(false);
  m.update(4.1, false, { canStart: false });
  assert.equal(m.buffered, false); assert.equal(m.state, S.BUILDING);
  assert.equal(m.update(0.1, false, { canStart: true }), false);
});

test('buffered press is not fired while paused', () => {
  const { m } = mk(); fill(m); m.pressSpecial(false);
  assert.equal(m.update(0.1, true, { canStart: true }), false); assert.equal(m.state, S.READY);
});

test('reset (level start / retry) clears everything, including active Rage', () => {
  const { m, log } = mk(); fill(m); m.pressSpecial(true); m.reset(2);
  assert.equal(m.state, S.BUILDING); assert.equal(m.value, 0); assert.equal(m.streak, 0); assert.equal(m.rageTimeLeft, 0);
  assert.ok(log.some(([n, p]) => n === 'ended' && p.reason === 'reset'));
  m.reset(1); assert.equal(m.state, S.HIDDEN);
});

test('config: spec starting values', () => {
  assert.deepEqual([C.max, C.gainPerBlow, C.streakLength, C.streakBonus, C.drainPerSec, C.readyWindowSec, C.rageDurationSec, C.enabledFromLevel],
    [100, 3, 3, 2, 2, 4, 9, 2]);
});

test('special is bound to L', () => {
  assert.equal(mapKeys(['KeyL']).special, true);
});

test('state machine: Rage swaps attacks for the Special; move/jump/block ok; no air kick', () => {
  const m = new PlayerStateMachine();
  assert.equal(m.canStartSpecial(false), false); assert.equal(m.canStartSpecial(true), true);
  m.beginRage();
  assert.equal(m.state, 'attack'); assert.equal(m.moveId, 'special'); assert.equal(m.rage, true);
  assert.equal(MOVES.special.special, true); assert.equal(MOVES.special.bossDamageCap, SPECIAL_MOVE.bossDamageCap);
  for (let i = 0; i < 80; i++) m.step(NONE);
  assert.equal(m.state, 'idle');
  m.step({ pressed: { light: true }, held: {}, moveX: 0 }); assert.equal(m.moveId, 'special');
  for (let i = 0; i < 80; i++) m.step(NONE);
  m.step({ pressed: { heavy: true }, held: {}, moveX: 0 }); assert.equal(m.moveId, 'special');
  for (let i = 0; i < 80; i++) m.step(NONE);
  m.step({ pressed: { special: true }, held: {}, moveX: 0 }); assert.equal(m.moveId, 'special');
  for (let i = 0; i < 80; i++) m.step(NONE);
  m.step({ pressed: {}, held: { block: true }, moveX: 0 }); assert.equal(m.state, 'block');
  m.step({ pressed: {}, held: {}, moveX: 1 }); assert.equal(m.state, 'run');
  m.step({ pressed: { light: true }, held: {}, moveX: 0 }, { grounded: false }); assert.equal(m.state, 'jump');
  assert.notEqual(m.moveId, 'airkick');
  m.endRage();
  const n = new PlayerStateMachine(); n.beginRage(); n.endRage();
  for (let i = 0; i < 80; i++) n.step(NONE);
  n.step({ pressed: { light: true }, held: {}, moveX: 0 }); assert.equal(n.moveId, 'light1');
  n.step(NONE); // plain L (special) does nothing outside Rage
});

test('state machine: L press ignored by machine outside Rage', () => {
  const m = new PlayerStateMachine();
  m.step({ pressed: { special: true }, held: {}, moveX: 0 }); assert.equal(m.state, 'idle');
});
