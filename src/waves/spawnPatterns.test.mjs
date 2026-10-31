import assert from 'node:assert/strict';
import { pickSpawn, SPAWN_PATTERNS, MIN_SPAWN_GAP, VIEW_W } from './spawnPatterns.js';
import { fakeEmitter } from '../shared/fakeEmitter.mjs';
import { WaveSpawner } from './WaveSpawner.js';

const zeroRng = () => 0;
const lockX = 800, L = lockX + 60, R = lockX + VIEW_W - 60;
const run = (pattern, player, count = 6) => Array.from({ length: count }, (_, index) => pickSpawn({ pattern, lockX, index, count, player, rng: zeroRng }).side);

// Zed on the left of the screen, facing right: far side is the right edge.
const zedLeft = { x: lockX + 400, facing: 1 };
assert.deepEqual(run('alternate', zedLeft), ['right', 'left', 'right', 'left', 'right', 'left']);
assert.deepEqual(run('flank', zedLeft, 8), ['right', 'right', 'left', 'left', 'right', 'right', 'left', 'left'], 'pairs, far side first');
// Facing right means behind is the left edge.
assert.ok(run('ambush', { x: lockX + 640, facing: 1 }).every((s, i) => s === (i % 3 === 2 ? 'right' : 'left')), 'ambush: behind (left) with every third from the front');
assert.deepEqual(run('surge', zedLeft, 4), ['right', 'right', 'right', 'left'], 'surge: wall from the far side, last from the other');
assert.deepEqual(run('surge', zedLeft, 1), ['right'], 'a single enemy is not split');
// with an anchor the wall stays on its edge even if Zed crosses the screen
// (Zed has wandered to the right edge, yet the wall started on the right and stays there; the last one breaks from the left)
assert.deepEqual(
  Array.from({ length: 4 }, (_, index) => pickSpawn({ pattern: 'surge', lockX, index, count: 4, player: { x: lockX + 640, facing: 1 }, anchorSide: 'right', rng: zeroRng }).side),
  ['right', 'right', 'right', 'left'], 'surge keeps to its anchored edge');

// Zed hugging the left edge: nothing may spawn on top of him, so everything uses the right edge
assert.ok(run('ambush', { x: lockX + 100, facing: -1 }).every((s) => s === 'right'));
assert.ok(run('flank', { x: lockX + 100, facing: 1 }, 6).every((s) => s === 'right'));

// the far side flips with Zed's position
assert.equal(run('alternate', { x: lockX + 1100, facing: -1 })[0], 'left');

// never on top of Zed
for (const p of SPAWN_PATTERNS) for (const x of [lockX + 70, lockX + 640, lockX + 1210]) for (const f of [1, -1]) {
  for (let i = 0; i < 8; i++) {
    const s = pickSpawn({ pattern: p, lockX, index: i, count: 8, player: { x, facing: f }, rng: zeroRng });
    const other = s.side === 'left' ? R : L;
    assert.ok(Math.abs(s.x - x) >= MIN_SPAWN_GAP || Math.abs(other - x) < MIN_SPAWN_GAP, `${p} spawned ${Math.abs(s.x - x)}px from Zed`);
  }
}

// inside the locked screen, depth varies, x jitter stays inward
const seen = new Set();
let seed = 7; const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
for (let w = 0; w < 3; w++) for (let i = 0; i < 10; i++) {
  const s = pickSpawn({ pattern: 'flank', lockX, index: i, count: 10, waveIndex: w, player: zedLeft, rng });
  assert.ok(s.x >= lockX && s.x <= lockX + VIEW_W, 'inside the locked view');
  assert.ok(s.y >= 480 && s.y <= 670, 'inside the lane');
  seen.add(Math.round(s.y / 10));
}
assert.ok(seen.size >= 4, 'enemies enter on several different rows');

// WaveSpawner: a wave with spawnPattern asks for Zed's position; a wave without one keeps the fixed round-robin
{
  const made = [];
  const wave = (pattern) => ({ enemy: 'grunt', count: 4, maxAlive: 4, spawnIntervalMs: 300, startDelayMs: 0, lockX: 0, spawnPattern: pattern, spawnPoints: [{ x: 60, y: 520 }, { x: 1220, y: 580 }] });
  let asked = 0;
  const sp = new WaveSpawner({ events: fakeEmitter(), waves: [wave('surge')], holdBetweenWaves: true, rng: zeroRng, getPlayer: () => { asked++; return { x: 400, facing: 1 }; }, spawn: (s) => made.push(s) });
  sp.start(); for (let i = 0; i < 30; i++) sp.update(300);
  assert.equal(asked, 4);
  assert.deepEqual(made.map((s) => s.x > 640), [true, true, true, false], 'surge from the right, last one from the left');
  // Zed walks across the screen mid-wave (first sample x=700, right of centre, so the wall starts on the left and stays there)
  made.length = 0;
  let zx = 400;
  const walker = new WaveSpawner({ events: fakeEmitter(), waves: [wave('surge')], holdBetweenWaves: true, rng: zeroRng, getPlayer: () => ({ x: (zx += 300), facing: 1 }), spawn: (s) => made.push(s) });
  walker.start(); for (let i = 0; i < 30; i++) walker.update(300);
  assert.deepEqual(made.map((s) => s.x > 640), [false, false, false, true], 'surge side is fixed at the first spawn');
  made.length = 0;
  const plain = new WaveSpawner({ events: fakeEmitter(), waves: [wave(undefined)], holdBetweenWaves: true, getPlayer: () => ({ x: 400, facing: 1 }), spawn: (s) => made.push(s) });
  plain.start(); for (let i = 0; i < 30; i++) plain.update(300);
  assert.deepEqual(made.map((s) => s.x), [60, 1220, 60, 1220], 'no pattern: old fixed round-robin');
}
console.log('spawnPatterns ok');
