import assert from 'node:assert/strict';
import { fakeEmitter } from '../shared/fakeEmitter.mjs';
import { EVENTS } from '../shared/events.js';
import { WaveSpawner } from './WaveSpawner.js';
import { WAVES } from './waveData.js';

const events = fakeEmitter();
const spawned = [], out = [];
for (const e of [EVENTS.WAVE_STARTED, EVENTS.WAVE_CLEARED, EVENTS.ARENA_CLEARED]) events.on(e, (p) => out.push([e, p]));
const sp = new WaveSpawner({ events, spawn: (s) => spawned.push(s) });
assert.deepEqual(WAVES.map((w) => w.count), [3, 4, 5]);
sp.start();
assert.deepEqual(out[0], [EVENTS.WAVE_STARTED, { index: 0, total: 3 }]);
for (let w = 0; w < 3; w++) {
  const before = spawned.length;
  let guard = 0;
  while (spawned.length - before < WAVES[w].count && guard++ < 1000) {
    sp.update(100);
    assert.ok(sp.aliveCount <= WAVES[w].maxAlive);
    // kill anything alive to keep the pipeline flowing, but only once spawn is capped out
    if (sp.aliveCount >= WAVES[w].maxAlive || sp.phase === 'fighting') {
      events.emit(EVENTS.ENTITY_DIED, { id: [...sp.alive][0], team: 'rust' });
    }
    if (sp.waveIndex !== w) break;
  }
  // ensure everything dies
  while (sp.waveIndex === w && sp.aliveCount) events.emit(EVENTS.ENTITY_DIED, { id: [...sp.alive][0], team: 'rust' });
}
assert.equal(spawned.length, 12);
assert.ok(spawned.every((s, i) => spawned.findIndex((x) => x.id === s.id) === i), 'unique ids');
assert.deepEqual(out.map((o) => o[0]), ['wave-started', 'wave-cleared', 'wave-started', 'wave-cleared', 'wave-started', 'wave-cleared', 'arena-cleared']);
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
