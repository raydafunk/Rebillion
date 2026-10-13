// Wave table (Tier 0): 3 waves of 3, 4, 5 grunts (placeholder counts, see contracts.md).
// lockX = camera scrollX held while the wave is active. spawnPoints are world coordinates,
// just inside the locked view edges, alternated round-robin.
// All times in ms.
const VIEW_W = 1280;
const sides = (lockX) => [
  { x: lockX + 60, y: 520 },
  { x: lockX + VIEW_W - 60, y: 580 },
  { x: lockX + 60, y: 640 },
  { x: lockX + VIEW_W - 60, y: 500 },
];

export const WAVES = Object.freeze([
  { enemy: 'grunt', count: 3, maxAlive: 3, spawnIntervalMs: 900, startDelayMs: 800, lockX: 0,   spawnPoints: sides(0) },
  { enemy: 'grunt', count: 4, maxAlive: 3, spawnIntervalMs: 800, startDelayMs: 1500, lockX: 320, spawnPoints: sides(320) },
  { enemy: 'grunt', count: 5, maxAlive: 4, spawnIntervalMs: 700, startDelayMs: 1500, lockX: 640, spawnPoints: sides(640) },
]);
