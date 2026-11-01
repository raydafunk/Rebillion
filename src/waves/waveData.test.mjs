// The fallback table in waveData.js must mirror Level 1 in content/levels/levels.json.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { WAVES } from './waveData.js';
import { SPAWN_PATTERNS } from './spawnPatterns.js';

const levels = JSON.parse(await readFile(new URL('../../content/levels/levels.json', import.meta.url), 'utf8'));
const level1 = levels.find((l) => l.id === 'level-01-brick-red-alley');
assert.equal(WAVES.length, level1.waves.length, 'same number of waves');
level1.waves.forEach((raw, i) => {
  const w = WAVES[i];
  for (const k of ['count', 'maxAlive', 'spawnIntervalMs', 'startDelayMs', 'spawnPattern', 'attackerCap', 'elites', 'eliteHpMult']) assert.equal(w[k], raw[k], `wave ${i + 1} ${k}`);
  assert.deepEqual(w.restPickup, raw.restPickup, `wave ${i + 1} restPickup`);
  assert.equal(w.leader?.enemy, raw.leader?.enemy, `wave ${i + 1} leader`);
  assert.equal(w.leader?.entrance, raw.leader?.entrance, `wave ${i + 1} leader entrance`);
  assert.ok(SPAWN_PATTERNS.includes(w.spawnPattern));
  assert.ok(w.lockX + 1280 <= 1920, 'locked view fits the 1920-wide fallback arena');
});
assert.deepEqual(WAVES.map((w) => w.count), [4, 6, 7, 8, 4]);
assert.equal(WAVES[4].leader.enemy, 'rust-brick-dugan');
console.log('waveData mirrors Level 1');
