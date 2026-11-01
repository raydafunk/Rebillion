import test from 'node:test';
import assert from 'node:assert/strict';
import { telegraphCue, TELEGRAPH_CUE } from './telegraphCueData.js';
import { GRUNT } from './gruntData.js';
import { PARRY } from '../player/moves.js';

test('no ring or flash before the NOW beat', () => {
  const c = telegraphCue(0);
  assert.equal(c.ring, null); assert.equal(c.fill, false);
  assert.equal(telegraphCue(TELEGRAPH_CUE.nowAt - 0.01).ring, null);
});

test('NOW beat pops white once, then only the ring remains', () => {
  const at = telegraphCue(TELEGRAPH_CUE.nowAt);
  assert.equal(at.fill, true);
  assert.equal(at.ring.r, TELEGRAPH_CUE.ringFrom);
  const later = telegraphCue(0.7);
  assert.equal(later.fill, false); assert.ok(later.ring);
});

test('ring closes monotonically onto the enemy by the end of the wind-up', () => {
  let prev = Infinity;
  for (let p = TELEGRAPH_CUE.nowAt; p <= 1.0001; p += 0.05) { const r = telegraphCue(p).ring.r; assert.ok(r <= prev + 1e-9); prev = r; }
  assert.equal(Math.round(telegraphCue(1).ring.r), TELEGRAPH_CUE.ringTo);
});

test('reduce mode never uses the white pop and softens the ring', () => {
  for (let p = 0; p <= 1; p += 0.05) assert.equal(telegraphCue(p, { reduce: true }).fill, false);
  assert.ok(telegraphCue(0.5, { reduce: true }).ring.alpha < telegraphCue(0.5).ring.alpha);
});

test('timing: a parry pressed when the ring closes covers every jab; a reaction to the NOW beat is still in time', () => {
  const nowToHit1 = GRUNT.telegraphMs * (1 - TELEGRAPH_CUE.nowAt) + GRUNT.jabString[0].atMs;
  assert.ok(nowToHit1 >= 200, 'enough time to react after the cue');
  const windowMs = PARRY.window * 1000 / 60;
  const lastJab = GRUNT.jabString[GRUNT.jabString.length - 1].atMs;
  assert.ok(windowMs >= lastJab, 'pressing as the ring closes (attack start) covers the whole string');
});
