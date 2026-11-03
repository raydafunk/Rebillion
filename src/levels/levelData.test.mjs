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
  assert.equal(l.totalEnemies, l.waves.reduce((n, w) => n + w.count + (w.leader ? 1 : 0), 0)); // a wave's leader (mini-boss) is one more enemy
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
assert.equal(levels[7].waves.length, 6, 'Level 8 has 6 waves');
assert.equal(levels[7].waves.at(-1).leader.hpMult, 8, 'the final boss (Varr, leader of wave 6) is tough');
assert.equal(levels[7].waves[4].mix.filter((k) => k.startsWith('rust-overseer-')).length, 3, 'wave 5 fields all three Overseers (Voss, Calder, Wren; Holt was cut)');
assert.ok(levelErrors({ id: 'x', timeLimitSec: 10, waves: [{ count: 1, maxAlive: 1, spawnIntervalMs: 500, startDelayMs: 0, hpMult: 0.5 }] }).length, 'hpMult must be >= 1');
// Level 2 (Mustard Row): same length and arc as Level 1 (5 waves, 210 s, Breakers from wave 3, mini-boss wave 5) but harder:
// bigger waves, Watchers, Type 2 Breakers (Rust-BreakerType2 art), bigger breathers, and a bigger finale around "Railgun" Royce.
{
  const L1 = levels[0], L2 = levels[1], w = L2.waves, w1 = L1.waves;
  assert.equal(L2.timeLimitSec, L1.timeLimitSec, 'Level 2 has the same timer as Level 1');
  assert.equal(w.length, w1.length, 'same number of waves');
  assert.ok(!w[0].elites && !w[1].elites, 'Level 2: no elites in waves 1-2');
  assert.ok(w[2].elites >= 1 && w[3].elites > w[2].elites, 'Level 2: Type 2 Breakers arrive in wave 3 and grow in wave 4');
  assert.ok([2, 3].every((i) => w[i].eliteSkin === 'rust-breaker-2' && w[i].eliteHpMult >= 3), 'Level 2 elites use the Type 2 skin');
  assert.ok(w1.every((x) => !x.eliteSkin), 'Level 1 keeps the original Breaker');
  assert.ok([0, 1, 2, 3].every((i) => w[i].count > w1[i].count), 'Level 2 waves 1-4 are bigger than Level 1');
  assert.ok(w.slice(0, 4).every((x, i) => i === 0 || x.count >= w[i - 1].count), 'enemy counts never shrink before the mini-boss beat');
  assert.ok(w.slice(0, 4).every((x, i) => i === 0 || x.spawnIntervalMs <= w[i - 1].spawnIntervalMs || x.sourceEnemy !== w[i - 1].sourceEnemy), 'spawns speed up within a kind of enemy');
  assert.ok(w.some((x) => x.sourceEnemy === 'rust-watcher') && w1.every((x) => x.sourceEnemy === 'grunt'), 'Level 2 brings in Watchers, Level 1 has none');
  assert.ok([0, 1, 2, 3].every((i) => w[i].restPickup.heal > w1[i].restPickup.heal), 'Level 2 breathers heal more than Level 1');
  assert.ok(w.slice(1, 4).every((x, i) => x.restPickup.heal > w[i].restPickup.heal), 'heals grow through the level');
  assert.ok(!w[4].restPickup, 'no pickup after the finale');
  assert.equal(w[4].leader.enemy, 'rust-railgun-royce', 'wave 5 is the Royce mini-boss beat');
  assert.ok(w[4].count > w1[4].count, 'the finale spawns more than Level 1\'s Dugan wave');
  assert.ok(!w[4].elites, 'no Breakers in the boss beat');
  assert.ok(new Set(w.map((x) => x.spawnPattern)).size >= 4 && w.every((x, i) => i === 0 || x.spawnPattern !== w[i - 1].spawnPattern), 'varied patterns, never the same twice in a row');
  assert.ok(w.every((x) => x.mix && new Set(x.mix).size > 1), 'every Level 2 wave mixes more than one kind');
  assert.ok(w.every((x) => x.speedMult > 1) && w.every((x, i) => i === 0 || x.speedMult >= w[i - 1].speedMult), 'Level 2 enemies move faster than Level 1 and speed up');
  assert.ok(w1.every((x) => !x.speedMult && !x.mix), 'Level 1 is unchanged');
  assert.ok(w[2].mixElites && w[3].mixElites, 'Type 2 Breakers are scattered through waves 3 and 4');
  assert.equal(L2.totalEnemies, w.reduce((n, x) => n + x.count + (x.leader ? 1 : 0), 0), 'elites are part of the wave count; the leader is one more');
}
assert.ok(levelErrors({ id: 'x', timeLimitSec: 10, waves: [{ count: 2, maxAlive: 1, spawnIntervalMs: 500, startDelayMs: 0, speedMult: 5 }] }).length, 'speedMult out of range rejected');
assert.ok(levelErrors({ id: 'x', timeLimitSec: 10, waves: [{ count: 2, maxAlive: 1, spawnIntervalMs: 500, startDelayMs: 0, mix: [] }] }).length, 'empty mix rejected');
assert.ok(levelErrors({ id: 'x', timeLimitSec: 10, waves: [{ count: 2, maxAlive: 1, spawnIntervalMs: 500, startDelayMs: 0, elites: 1, eliteSkin: '' }] }).length, 'eliteSkin must be a non-empty string');
// Level 1 is paced as an arc: quick warm-up, rising pressure, Breakers from wave 3, then the mini-boss beat; health pickups in the breathers.
{
  const w = levels[0].waves;
  assert.equal(w.length, 5);
  assert.ok(w[0].count >= 4 && w[0].startDelayMs <= 800, 'wave 1 starts fast and is not trivial');
  assert.ok(w.slice(0, 4).every((x, i) => i === 0 || x.count >= w[i - 1].count), 'enemy counts never shrink before the boss beat');
  assert.ok(w.slice(0, 4).every((x, i) => i === 0 || x.spawnIntervalMs <= w[i - 1].spawnIntervalMs), 'spawns only get faster');
  assert.ok(!w[0].elites && !w[1].elites, 'no Breaker before wave 3');
  assert.ok(w[2].elites >= 1 && w[3].elites > w[2].elites, 'Breakers arrive in wave 3 and grow in wave 4');
  assert.ok([0, 1, 2, 3].every((i) => w[i].restPickup && w[i].restPickup.heal > 0), 'a breather pickup after waves 1-4');
  assert.ok(w.slice(1, 4).every((x, i) => x.restPickup.heal > w[i].restPickup.heal), 'heals grow with the danger ahead');
  assert.ok(!w[4].restPickup, 'no pickup after the finale');
  assert.ok(w.every((x) => x.startDelayMs <= 1000), 'short waits: the breather is the walk and the pickup');
  // Wave 5 is the mini-boss beat (owner decision): Dugan leads, 4 grunts flank in around him, not a hard gate.
  assert.equal(w[4].count, 4, 'wave 5 brings 4 grunts');
  assert.equal(w[4].leader.enemy, 'rust-brick-dugan');
  assert.equal(w[4].leader.entrance, 'far-side');
  assert.equal(w[4].leader.gate, false);
  assert.equal(w[4].spawnPattern, 'flank', 'grunts come in from both edges');
  assert.equal(w[4].maxAlive, 3, 'at most three grunts on screen with him (playtest: four overwhelmed agents that did not reposition)');
  assert.equal(w[4].leader.crewAfter, 'first-move', 'the crew walks in after Dugan has made his first move');
  assert.ok(w[4].leader.crewMaxWaitMs > 0 && w[4].leader.crewMaxWaitMs <= 20000, 'and always comes eventually');
  // Wave 3 teaches crowd control before the finale: enemies from both edges, two at a time, with a coaching line.
  assert.equal(w[2].spawnPattern, 'pincer');
  assert.equal(w[2].maxAlive, 2, 'a gentle sandwich: one each side');
  assert.ok(w[2].hint && w[2].hint.length <= 80, 'wave 3 shows the crowd-control hint');
  assert.ok(!w[4].elites, 'no Breakers in the boss beat');
  assert.equal(levels[0].totalEnemies, w.reduce((n, x) => n + x.count, 0) + 1, 'Dugan counts as one more enemy');
}
assert.ok(levelErrors({ id: 'x', timeLimitSec: 10, waves: [{ count: 1, maxAlive: 1, spawnIntervalMs: 500, startDelayMs: 0, leader: { enemy: 'rust-brick-dugan', entrance: 'sideways' } }] }).length, 'unknown leader entrance rejected');
assert.ok(levelErrors({ id: 'x', timeLimitSec: 10, waves: [{ count: 1, maxAlive: 1, spawnIntervalMs: 500, startDelayMs: 0, leader: { entrance: 'far-side' } }] }).length, 'leader needs an enemy id');
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

// The fallback level (used when the level files cannot load) mirrors Level 1 and counts Dugan.
{
  const f = legacyLevel();
  assert.equal(f.waves.length, 5);
  assert.equal(f.totalEnemies, 4 + 6 + 7 + 8 + 4 + 1, 'wave counts plus Dugan');
  assert.equal(f.totalEnemies, levels[0].totalEnemies, 'same enemy total as Level 1');
}

// Wave data validation for the new fields.
{
  const base = { id: 'x', timeLimitSec: 10 };
  const wv = (o) => ({ ...base, waves: [{ count: 1, maxAlive: 1, spawnIntervalMs: 500, startDelayMs: 0, ...o }] });
  assert.ok(levelErrors(wv({ leader: { enemy: 'rust-brick-dugan', crewAfter: 'whenever' } })).length, 'unknown crewAfter rejected');
  assert.equal(levelErrors(wv({ leader: { enemy: 'rust-brick-dugan', crewAfter: 'first-move', crewMaxWaitMs: 9000 } })).length, 0);
  assert.ok(levelErrors(wv({ hint: '' })).length, 'empty hint rejected');
  assert.ok(levelErrors(wv({ hint: 'x'.repeat(81) })).length, 'over-long hint rejected');
  assert.ok(levelErrors(wv({ spawnPattern: 'pincer' })).length === 0, 'pincer is a known pattern');
  console.log('levelData new wave fields passed');
}
