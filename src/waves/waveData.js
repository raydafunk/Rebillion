// Fallback wave table: Level 1 (Brick-Red Alley) as a fixed arena, used when the level files cannot be loaded (legacyLevel in levelData.js).
// It mirrors content/levels/levels.json, level-01-brick-red-alley; waveData.test.mjs fails if the two drift apart.
//   waves 1-4: grunt waves of 4, 6, 7, 8 with Breaker elites from wave 3 (the last N spawns of the wave, 3x health)
//   wave 5:    the mini-boss beat. "Brick" Dugan leads and walks in first, 4 grunts flank in around him in the same wave
// lockX = camera scrollX held while the wave is active. This arena is one world wide (1920), so the locks step 160 px, not the 800 px of the scrolling levels.
// spawnPoints are world coordinates, just inside the locked view edges, used when no spawnPattern/getPlayer is available. All times in ms.
const VIEW_W = 1280;
const LOCK_STEP = 160;
const sides = (lockX) => [
  { x: lockX + 60, y: 520 },
  { x: lockX + VIEW_W - 60, y: 580 },
  { x: lockX + 60, y: 640 },
  { x: lockX + VIEW_W - 60, y: 500 },
];
const wave = (i, w) => Object.freeze({ enemy: 'grunt', sourceEnemy: 'grunt', lockX: i * LOCK_STEP, spawnPoints: sides(i * LOCK_STEP), ...w });

export const WAVES = Object.freeze([
  wave(0, { count: 4, maxAlive: 2, spawnIntervalMs: 900, startDelayMs: 600,  spawnPattern: 'alternate', attackerCap: 2, restPickup: { heal: 15 } }),
  wave(1, { count: 6, maxAlive: 3, spawnIntervalMs: 800, startDelayMs: 1000, spawnPattern: 'flank',     attackerCap: 2, restPickup: { heal: 25 } }),
  wave(2, { count: 7, maxAlive: 4, spawnIntervalMs: 700, startDelayMs: 1000, spawnPattern: 'ambush',    attackerCap: 2, elites: 1, eliteHpMult: 3, restPickup: { heal: 30 } }),
  wave(3, { count: 8, maxAlive: 4, spawnIntervalMs: 650, startDelayMs: 1000, spawnPattern: 'surge',     attackerCap: 3, elites: 2, eliteHpMult: 3, restPickup: { heal: 35 } }),
  wave(4, { count: 4, maxAlive: 4, spawnIntervalMs: 900, startDelayMs: 1000, spawnPattern: 'flank',     attackerCap: 3,
    leader: Object.freeze({ enemy: 'rust-brick-dugan', entrance: 'far-side', gate: false }) }),
]);
