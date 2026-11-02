import assert from 'node:assert/strict';
import { fakeEmitter } from '../shared/fakeEmitter.mjs';
import { EVENTS } from '../shared/events.js';
import { WaveSpawner } from './WaveSpawner.js';
import { WAVES } from './waveData.js';

const events = fakeEmitter();
const spawned = [], out = [];
for (const e of [EVENTS.WAVE_STARTED, EVENTS.WAVE_CLEARED, EVENTS.ARENA_CLEARED]) events.on(e, (p) => out.push([e, p]));
const sp = new WaveSpawner({ events, spawn: (s) => spawned.push(s) });
assert.deepEqual(WAVES.map((w) => w.count), [4, 6, 7, 8, 4]);
const perWave = WAVES.map((w) => w.count + (w.leader ? 1 : 0)); // a wave's leader is one more spawn
sp.start();
assert.deepEqual(out[0], [EVENTS.WAVE_STARTED, { index: 0, total: 5 }]);
for (let w = 0; w < 5; w++) {
  const before = spawned.length;
  let guard = 0;
  while (spawned.length - before < perWave[w] && guard++ < 1000) {
    sp.update(100);
    assert.ok(sp.regularAliveCount <= WAVES[w].maxAlive);
    // kill anything alive to keep the pipeline flowing, but only once spawn is capped out
    if (sp.regularAliveCount >= WAVES[w].maxAlive || sp.phase === 'fighting') {
      events.emit(EVENTS.ENTITY_DIED, { id: [...sp.alive][0], team: 'rust' });
    }
    if (sp.waveIndex !== w) break;
  }
  // ensure everything dies
  while (sp.waveIndex === w && sp.aliveCount) events.emit(EVENTS.ENTITY_DIED, { id: [...sp.alive][0], team: 'rust' });
}
assert.equal(spawned.length, 30);
assert.equal(spawned.filter((s) => s.leader).length, 1, 'one Dugan');
assert.ok(spawned.every((s, i) => spawned.findIndex((x) => x.id === s.id) === i), 'unique ids');
assert.deepEqual(out.map((o) => o[0]), ['wave-started', 'wave-cleared', 'wave-started', 'wave-cleared', 'wave-started', 'wave-cleared', 'wave-started', 'wave-cleared', 'wave-started', 'wave-cleared', 'arena-cleared']);
assert.ok(sp.finished);
// player deaths are ignored
events.emit(EVENTS.ENTITY_DIED, { id: 'player', team: 'player' });
assert.equal(out.filter((o) => o[0] === 'arena-cleared').length, 1);
console.log('WaveSpawner tests passed');

// Hold mode (side-scrolling levels): the spawner waits for advance() after each wave and never emits arena-cleared.
{
  const ev = fakeEmitter(); const log = []; const made = [];
  for (const e of [EVENTS.WAVE_STARTED, EVENTS.WAVE_CLEARED, EVENTS.ARENA_CLEARED]) ev.on(e, (p) => log.push([e, p]));
  const waves = [0, 800].map((lockX) => ({ enemy: 'grunt', count: 1, maxAlive: 1, spawnIntervalMs: 300, startDelayMs: 0, lockX, spawnPoints: [{ x: lockX + 60, y: 520 }] }));
  const h = new WaveSpawner({ events: ev, waves, holdBetweenWaves: true, spawn: (s) => made.push(s) });
  h.start();
  h.update(100);
  assert.equal(made.length, 1);
  ev.emit(EVENTS.ENTITY_DIED, { id: made[0].id, team: 'rust' });
  assert.ok(h.holding);
  assert.equal(h.nextWave.lockX, 800);
  h.update(5000);
  assert.equal(made.length, 1, 'no spawning while holding');
  assert.deepEqual(log.map((l) => l[0]), [EVENTS.WAVE_STARTED, EVENTS.WAVE_CLEARED]);
  h.advance();
  assert.deepEqual(log.at(-1), [EVENTS.WAVE_STARTED, { index: 1, total: 2 }]);
  h.update(100);
  ev.emit(EVENTS.ENTITY_DIED, { id: made[1].id, team: 'rust' });
  assert.ok(h.finished && h.nextWave === null);
  assert.ok(!log.some((l) => l[0] === EVENTS.ARENA_CLEARED), 'level end is signalled by the scene, not the spawner');
  h.advance(); // no-op when not holding
  h.restart();
  assert.equal(h.waveIndex, 0);
  console.log('WaveSpawner hold mode passed');
}

// Wave leader (Level 1 wave 5): the mini-boss walks in first, grunts follow later and do not count against maxAlive for him.
{
  const ev = fakeEmitter(); const made = []; const log = [];
  for (const e of [EVENTS.WAVE_STARTED, EVENTS.WAVE_CLEARED, EVENTS.ARENA_CLEARED]) ev.on(e, (p) => log.push([e, p]));
  const lockX = 3200;
  const waves = [{ enemy: 'grunt', count: 4, maxAlive: 4, spawnIntervalMs: 300, startDelayMs: 0, lockX, spawnPattern: 'flank',
    leader: { enemy: 'rust-brick-dugan', entrance: 'far-side', gate: false }, spawnPoints: [{ x: lockX + 60, y: 520 }, { x: lockX + 1220, y: 580 }] }];
  const s = new WaveSpawner({ events: ev, waves, holdBetweenWaves: true, getPlayer: () => ({ x: lockX + 400, facing: 1 }), spawn: (sp) => made.push(sp), rng: () => 0 });
  s.start();
  s.update(16);
  assert.equal(made.length, 1, 'only the leader at first');
  assert.equal(made[0].enemy, 'rust-brick-dugan'); assert.equal(made[0].leader, true);
  assert.equal(made[0].x, lockX + 1220, 'enters from the far side (Zed is on the left)');
  s.update(1000); assert.equal(made.length, 1, 'grunts wait for the leader to make his entrance');
  s.update(1000);
  assert.ok(made.length >= 2 && made.slice(1).every((m) => m.enemy === 'grunt' && !m.leader), 'then the grunts come in');
  for (let i = 0; i < 40; i++) s.update(100);
  assert.equal(made.length, 5, 'Dugan + 4 grunts');
  assert.equal(new Set(made.slice(1).map((m) => m.x < lockX + 640)).size, 2, 'grunts flank in from both edges');
  assert.equal(s.regularAliveCount, 4, 'maxAlive 4 grunts at once alongside the leader');
  for (const m of made.slice(1)) ev.emit(EVENTS.ENTITY_DIED, { id: m.id, team: 'rust' });
  assert.ok(!log.some((l) => l[0] === EVENTS.WAVE_CLEARED), 'wave is not cleared while the leader lives');
  ev.emit(EVENTS.ENTITY_DIED, { id: made[0].id, team: 'rust' });
  assert.ok(log.some((l) => l[0] === EVENTS.WAVE_CLEARED), 'cleared once the leader is down too');
  assert.ok(s.finished);
  console.log('WaveSpawner leader passed');
}

// Starting at a later wave (?wave=N testing): begins there, and a retry restarts from the same wave.
{
  const ev = fakeEmitter(); const log = [];
  ev.on(EVENTS.WAVE_STARTED, (p) => log.push(p.index));
  const s = new WaveSpawner({ events: ev, spawn() {} });
  s.start(4);
  assert.equal(s.waveIndex, 4);
  ev.emit(EVENTS.RETRY, {});
  assert.deepEqual(log, [4, 4], 'retry restarts the chosen wave');
  s.start(99); assert.equal(s.waveIndex, WAVES.length - 1, 'clamped to the last wave');
  s.start(); assert.equal(s.waveIndex, 0);
  console.log('WaveSpawner start-from passed');
}

// Leader alone: count 0 still spawns the leader, and the wave clears when he falls.
{
  const ev = fakeEmitter(); const made = []; const log = [];
  ev.on(EVENTS.WAVE_CLEARED, (p) => log.push(p));
  const waves = [{ enemy: 'grunt', count: 0, maxAlive: 1, spawnIntervalMs: 300, startDelayMs: 0, lockX: 0, spawnPoints: [{ x: 60, y: 520 }, { x: 1220, y: 580 }],
    leader: { enemy: 'rust-brick-dugan', entrance: 'far-side' } }];
  const s = new WaveSpawner({ events: ev, waves, holdBetweenWaves: true, spawn: (sp) => made.push(sp) });
  s.start(); s.update(16); s.update(5000);
  assert.deepEqual(made.map((m) => m.enemy), ['rust-brick-dugan'], 'only Dugan');
  assert.equal(log.length, 0);
  ev.emit(EVENTS.ENTITY_DIED, { id: made[0].id, team: 'rust' });
  assert.equal(log.length, 1, 'cleared when Dugan is down');
  console.log('WaveSpawner leader-only passed');
}

// crewAfter 'first-move' (Level 1 wave 5): Dugan fights alone until his first move is done, then the crew follows; a safety net always sends them.
{
  const lockX = 3200;
  const mk = (leader) => [{ enemy: 'grunt', count: 3, maxAlive: 3, spawnIntervalMs: 300, startDelayMs: 0, lockX, spawnPattern: 'flank', leader,
    spawnPoints: [{ x: lockX + 60, y: 520 }, { x: lockX + 1220, y: 580 }] }];
  const run = (leader, engagedAtMs) => {
    const ev = fakeEmitter(); const made = []; let t = 0;
    const s = new WaveSpawner({ events: ev, waves: mk(leader), holdBetweenWaves: true, getPlayer: () => ({ x: lockX + 400, facing: 1 }),
      spawn: (sp) => made.push({ ...sp, at: t }), rng: () => 0, leaderEngaged: () => engagedAtMs !== null && t >= engagedAtMs });
    s.start();
    for (; t < 20000; t += 100) s.update(100);
    return made;
  };
  const L = { enemy: 'rust-brick-dugan', entrance: 'far-side', gate: false, crewAfter: 'first-move', crewDelayMs: 900, crewMaxWaitMs: 9000 };
  let made = run(L, 5000);
  assert.equal(made[0].enemy, 'rust-brick-dugan');
  assert.ok(made.slice(1).every((m) => m.at >= 5000 + 900), 'no grunt before his first move is over (+ the beat)');
  assert.equal(made.length, 4, 'then the whole crew comes');
  made = run(L, null);
  assert.ok(made.length === 4 && made[1].at >= 9000 && made[1].at < 11000, 'he never engages: the safety net still sends the crew');
  made = run({ ...L, crewAfter: undefined }, null);
  assert.ok(made[1].at < 3000, 'without crewAfter the crew follows on the normal lead time');
  // hint rides on wave-started
  const ev = fakeEmitter(); const got = [];
  ev.on(EVENTS.WAVE_STARTED, (p) => got.push(p));
  new WaveSpawner({ events: ev, waves: [{ ...mk(null)[0], leader: undefined, hint: 'Step out' }], spawn() {} }).start();
  assert.equal(got[0].hint, 'Step out');
  console.log('WaveSpawner crewAfter + hint passed');
}

// eliteSkin: the closing `elites` spawns of a wave take the wave's elite skin (default 'rust-breaker'; Level 2 sends 'rust-breaker-2').
{
  const run = (extra) => {
    const ev = fakeEmitter(); const made = [];
    const base = { enemy: 'grunt', sourceEnemy: 'grunt', count: 4, maxAlive: 4, spawnIntervalMs: 100, startDelayMs: 0, lockX: 0, spawnPoints: [{ x: 60, y: 520 }], elites: 2, eliteHpMult: 3 };
    const s = new WaveSpawner({ events: ev, waves: [{ ...base, ...extra }], spawn: (m) => made.push(m) });
    s.start(); for (let i = 0; i < 50; i++) s.update(100);
    return made;
  };
  let made = run({ eliteSkin: 'rust-breaker-2' });
  assert.deepEqual(made.map((m) => m.skin), ['grunt', 'grunt', 'rust-breaker-2', 'rust-breaker-2']);
  assert.deepEqual(made.map((m) => m.hpMult), [1, 1, 3, 3]);
  made = run({});
  assert.deepEqual(made.map((m) => m.skin), ['grunt', 'grunt', 'rust-breaker', 'rust-breaker'], 'no eliteSkin keeps the original Breaker');
  console.log('WaveSpawner eliteSkin passed');
}

// mix + speedMult + mixElites: kinds cycle in spawn order, elites scatter, the wave moves faster.
{
  const ev = fakeEmitter(); const made = [];
  const w = { enemy: 'grunt', sourceEnemy: 'grunt', count: 8, maxAlive: 8, spawnIntervalMs: 100, startDelayMs: 0, lockX: 0, spawnPoints: [{ x: 60, y: 520 }],
    mix: ['grunt', 'rust-watcher'], speedMult: 1.2, elites: 2, eliteHpMult: 3, eliteSkin: 'rust-breaker-2', mixElites: true };
  const s = new WaveSpawner({ events: ev, waves: [w], spawn: (m) => made.push(m) });
  s.start(); for (let i = 0; i < 80; i++) s.update(100);
  assert.equal(made.length, 8);
  const eliteIdx = made.map((m, i) => (m.skin === 'rust-breaker-2' ? i : -1)).filter((i) => i >= 0);
  assert.equal(eliteIdx.length, 2);
  assert.ok(eliteIdx[0] > 0 && eliteIdx[1] < 7 && eliteIdx[1] - eliteIdx[0] > 1, 'elites are scattered, not the last two');
  const kinds = made.filter((m) => m.skin !== 'rust-breaker-2').map((m) => m.skin);
  assert.ok(kinds.includes('grunt') && kinds.includes('rust-watcher'), 'both kinds appear');
  assert.ok(made.filter((m) => m.skin === 'rust-watcher').every((m) => m.hpMult === 1.5 && Math.abs(m.speedMult - 1.2 * 1.1) < 1e-9), 'watchers: 1.5x health, wave speed x kind speed');
  assert.ok(made.filter((m) => m.skin === 'grunt').every((m) => m.hpMult === 1 && m.speedMult === 1.2));
  assert.ok(made.filter((m) => m.skin === 'rust-breaker-2').every((m) => m.hpMult === 3 && m.speedMult < 1.2), 'heavies are a touch slower than the crowd');
  console.log('WaveSpawner mix + speed passed');
}
