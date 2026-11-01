import test from 'node:test';
import assert from 'node:assert/strict';
import { telegraphCue, TELEGRAPH_CUE, FINISHER_ORANGE, RING_CENTER_ABOVE_FEET } from './telegraphCueData.js';
import { GRUNT } from './gruntData.js';

const MARK = 350;
const cue = (clockMs, o = {}) => telegraphCue({ clockMs, markMs: MARK, kind: 'finisher', ...o });
const popAt = TELEGRAPH_CUE.nowAt * GRUNT.telegraphMs;

test('no ring before the NOW beat; the ring opens wide at the beat', () => {
  assert.equal(cue(0).ring, null);
  assert.equal(cue(popAt - 1).ring, null);
  assert.equal(cue(popAt).ring.r, TELEGRAPH_CUE.ringFrom);
  assert.equal(cue(popAt).ring.alpha, 0, 'fades in from nothing');
  assert.ok(cue(popAt + TELEGRAPH_CUE.ringFadeInMs).ring.alpha > 0.9);
  assert.ok(popAt < 60, 'the ring appears within the first ~60 ms of the wind-up');
});

test('the ring is the only cue: no flash or icon fields are returned', () => {
  for (const kind of ['strike', 'finisher']) for (let t = 0; t <= 700; t += 10) {
    const c = cue(t, { kind });
    assert.deepEqual(Object.keys(c), ['ring']);
  }
});

test('ring closes monotonically and is fully closed at the mark, then disappears', () => {
  let prev = Infinity;
  for (let t = popAt; t <= MARK; t += 10) { const r = cue(t).ring.r; assert.ok(r <= prev + 1e-9); prev = r; }
  assert.equal(Math.round(cue(MARK).ring.r), TELEGRAPH_CUE.ringTo);
  assert.ok(cue(MARK + TELEGRAPH_CUE.ringLingerMs).ring);
  assert.equal(cue(MARK + TELEGRAPH_CUE.ringLingerMs + 1).ring, null);
});

test('a later mark closes the ring more slowly (hold / finisher variants)', () => {
  const t = popAt + 100;
  assert.ok(telegraphCue({ clockMs: t, markMs: 800, kind: 'finisher' }).ring.r > telegraphCue({ clockMs: t, markMs: 350, kind: 'finisher' }).ring.r);
});

test('only finisher attacks get a ring (orange); plain strikes get nothing', () => {
  assert.equal(cue(popAt + 50).ring.color, FINISHER_ORANGE);
  for (let t = 0; t <= 600; t += 10) assert.equal(cue(t, { kind: 'strike' }).ring, null);
});

test('reduce mode softens the ring', () => {
  assert.ok(cue(popAt + 50, { reduce: true }).ring.alpha < cue(popAt + 50).ring.alpha);
});

test('the ring sits above the head: its closed edge clears a bar that tops out ~120 px above the feet', () => {
  assert.ok(RING_CENTER_ABOVE_FEET - TELEGRAPH_CUE.ringTo > 120);
});
