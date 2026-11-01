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

// Leader alone (?solo testing): count 0 still spawns the leader, and the wave clears when he falls.
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
