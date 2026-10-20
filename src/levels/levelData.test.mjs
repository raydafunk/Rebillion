import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadLevelContent, buildLevels, levelErrors, legacyLevel, nextLevelIndex, STAND_IN, WAVE_SPACING, worldWidthFor } from './levelData.js';
import { WAVES } from '../waves/waveData.js';

const fetchJson = async (p) => JSON.parse(await readFile(new URL(`../../${p}`, import.meta.url), 'utf8'));

const levels = await loadLevelContent(fetchJson, { onSkip: (id, e) => assert.fail(`skipped ${id}: ${e}`) });
assert.ok(levels.length >= 6, 'at least the six levels load');
assert.deepEqual(levels.map((l) => l.order), [...levels.map((l) => l.order)].sort((a, b) => a - b), 'sorted by order');
assert.equal(new Set(levels.map((l) => l.id)).size, levels.length, 'unique ids');
for (const l of levels) {
  assert.ok(l.waves.length > 0 && l.timeLimitSec > 0);
  for (const w of l.waves) {
    assert.equal(w.enemy, STAND_IN);
    assert.ok(w.maxAlive <= w.count && w.maxAlive >= 1);
    assert.ok(w.spawnPoints.length > 0);
  }
  // Side scroller: each wave locks further right, the world fits the last lock plus a run to the exit.
  assert.deepEqual(l.waves.map((w) => w.lockX), l.waves.map((_, i) => i * WAVE_SPACING));
  assert.equal(l.worldWidth, worldWidthFor(l.waves.length));
  assert.ok(l.waves.at(-1).lockX + 1280 <= l.worldWidth, 'last locked screen fits in the world');
  assert.ok(l.exitX > l.waves.at(-1).lockX + 1280 - 200 && l.exitX < l.worldWidth, 'exit is past the last fight');
  assert.equal(l.totalEnemies, l.waves.reduce((n, w) => n + w.count, 0));
}
// Level 1 keeps the Tier 0 wave numbers (positions differ: the level scrolls now).
assert.deepEqual(levels[0].waves.map((w) => [w.count, w.maxAlive, w.spawnIntervalMs, w.startDelayMs]),
  WAVES.map((w) => [w.count, w.maxAlive, w.spawnIntervalMs, w.startDelayMs]));
assert.ok(levels.some((l) => l.standIns.length), 'expansion enemies are recorded as stand-ins');
assert.equal(nextLevelIndex(levels, 0), 1);
assert.equal(nextLevelIndex(levels, levels.length - 1), null);

// Bad data is skipped, not fatal.
const skipped = [];
const built = buildLevels([[{ id: 'a', order: 1, timeLimitSec: 0, waves: [] }, { id: 'b', order: 2, timeLimitSec: 60, waves: [{ enemy: 'grunt', count: 2, maxAlive: 9, spawnIntervalMs: 500, startDelayMs: 0 }] }]], {}, (id) => skipped.push(id));
assert.deepEqual(skipped, ['a']);
assert.equal(built.length, 1);
assert.equal(built[0].waves[0].maxAlive, 2, 'maxAlive is capped at count');
assert.ok(levelErrors({ id: 'x', timeLimitSec: 10, waves: [{ count: 1, maxAlive: 1, spawnIntervalMs: 100, startDelayMs: 0 }] }).length);

// Missing files fall back to the Tier 0 round.
const fallback = await loadLevelContent(async () => { throw new Error('offline'); });
assert.equal(fallback.length, 1);
assert.equal(fallback[0].waves.length, legacyLevel().waves.length);
assert.equal(fallback[0].scrolling, false);
console.log('levelData ok:', levels.length, 'levels');
