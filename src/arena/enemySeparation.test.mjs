import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { Arena } from './Arena.js';
import { separateEnemies } from './EnemySeparation.js';
import { SEPARATION, WORLD } from './arenaData.js';

test('crowd chasing a player pinned at the world end does not stack', () => {
  const ev = new EventEmitter();
  const player = { x: WORLD.w - 5, y: 600 };
  const arena = new Arena({ events: ev, getTarget: () => player, getScrollX: () => WORLD.w - 1280, waves: [] });
  for (let i = 0; i < 6; i++) arena.enemies.spawn({ id: `g${i}`, x: WORLD.w - 300 + i * 20, y: 560 + i * 6 });
  for (let t = 0; t < 60 * 20; t++) arena.update(16);
  const g = arena.enemies.list().filter((e) => e.alive);
  assert.ok(g.length >= 5);
  for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) {
    const d = Math.hypot((g[i].x - g[j].x) / SEPARATION.radiusX, (g[i].y - g[j].y) / SEPARATION.radiusY);
    assert.ok(d > 0.6, `enemies ${g[i].id}/${g[j].id} stacked (d=${d.toFixed(2)})`);
  }
  for (const e of g) assert.ok(e.x <= WORLD.w && e.y >= 460 && e.y <= 680);
});

test('exactly overlapping enemies are pushed apart', () => {
  const bounds = { locked: false, world: WORLD, lane: { minY: 460, maxY: 680 } };
  const a = { id: 'a', alive: true, x: 1900, y: 600, state: 'approach' };
  const b = { id: 'b', alive: true, x: 1900, y: 600, state: 'approach' };
  for (let i = 0; i < 10; i++) separateEnemies([a, b], bounds);
  assert.ok(Math.hypot((a.x - b.x) / SEPARATION.radiusX, (a.y - b.y) / SEPARATION.radiusY) >= 0.95);
});
