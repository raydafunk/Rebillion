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
