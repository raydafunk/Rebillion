import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SPAWN_PATTERNS } from '../waves/spawnPatterns.js';
import { loadLevelContent, buildLevels, levelErrors, legacyLevel, nextLevelIndex, STAND_IN, WAVE_SPACING, worldWidthFor } from './levelData.js';

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
// Every level gets a breather pickup after each wave except the last (pipeline/validate.mjs enforces the same rule).
for (const l of levels) {
  l.waves.forEach((w, i) => {
    if (i < l.waves.length - 1) assert.ok(w.restPickup && w.restPickup.heal > 0, `${l.id} wave ${i + 1} needs a restPickup`);
    else assert.ok(!w.restPickup, `${l.id}: no pickup after the last wave`);
    assert.ok(w.attackerCap >= 1, `${l.id} wave ${i + 1} sets attackerCap`);
    assert.ok(SPAWN_PATTERNS.includes(w.spawnPattern), `${l.id} wave ${i + 1} sets a spawnPattern`);
    if (i > 0) assert.notEqual(w.spawnPattern, l.waves[i - 1].spawnPattern, `${l.id}: pattern repeats at wave ${i + 1}`);
  });
}
assert.ok(levelErrors({ id: 'x', timeLimitSec: 10, waves: [{ count: 1, maxAlive: 1, spawnIntervalMs: 500, startDelayMs: 0, spawnPattern: 'diagonal' }] }).length, 'unknown spawnPattern rejected');
assert.equal(levels[7].waves.at(-1).hpMult, 8, 'the final boss wave is tough');
assert.ok(levelErrors({ id: 'x', timeLimitSec: 10, waves: [{ count: 1, maxAlive: 1, spawnIntervalMs: 500, startDelayMs: 0, hpMult: 0.5 }] }).length, 'hpMult must be >= 1');
// Level 1 is paced as an arc: quick warm-up, rising pressure, Breakers from wave 3, a big finale; health pickups in the breathers.
{
  const w = levels[0].waves;
  assert.equal(w.length, 5);
  assert.ok(w[0].count >= 4 && w[0].startDelayMs <= 800, 'wave 1 starts fast and is not trivial');
  assert.ok(w.every((x, i) => i === 0 || x.count >= w[i - 1].count), 'enemy counts never shrink');
  assert.ok(w.every((x, i) => i === 0 || x.spawnIntervalMs <= w[i - 1].spawnIntervalMs), 'spawns only get faster');
  assert.ok(!w[0].elites && !w[1].elites, 'no Breaker before wave 3');
  assert.ok(w[2].elites >= 1 && w[4].elites > w[2].elites, 'Breakers arrive in wave 3 and peak in the finale');
  assert.ok([0, 1, 2, 3].every((i) => w[i].restPickup && w[i].restPickup.heal > 0), 'a breather pickup after waves 1-4');
  assert.ok(w.slice(1, 4).every((x, i) => x.restPickup.heal > w[i].restPickup.heal), 'heals grow with the danger ahead');
  assert.ok(!w[4].restPickup, 'no pickup after the finale');
  assert.ok(w.every((x) => x.startDelayMs <= 1000), 'short waits: the breather is the walk and the pickup');
}
assert.ok(levelErrors({ id: 'x', timeLimitSec: 10, waves: [{ count: 2, maxAlive: 1, spawnIntervalMs: 500, startDelayMs: 0, elites: 3 }] }).length, 'elites cannot exceed count');
assert.ok(levelErrors({ id: 'x', timeLimitSec: 10, waves: [{ count: 2, maxAlive: 1, spawnIntervalMs: 500, startDelayMs: 0, restPickup: { heal: 0 } }] }).length, 'pickup must heal');
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
