// Node simulation: full 3-wave run with a fake emitter, the real hit resolver, and a bot player.
// Run: node src/arena/arena.sim.test.mjs
import assert from 'node:assert/strict';
import { fakeEmitter } from '../shared/fakeEmitter.mjs';
import { EVENTS } from '../shared/events.js';
import { createHitResolver } from '../combat/hitResolver.js';
import { Arena } from './Arena.js';
import { ArenaBounds } from './ArenaBounds.js';
import { ArenaFailsafe } from './ArenaFailsafe.js';
import { EnemyManager } from '../enemies/EnemyManager.js';
import { WaveSpawner } from '../waves/WaveSpawner.js';
import { WAVES } from '../waves/waveData.js';
import { GRUNT } from '../enemies/gruntData.js';

const STEP = 16;

function makeWorld() {
  const events = fakeEmitter();
  let clock = 0;
  const resolver = createHitResolver(events, () => clock);
  const log = [];
  for (const e of [EVENTS.WAVE_STARTED, EVENTS.WAVE_CLEARED, EVENTS.ARENA_CLEARED, EVENTS.ENTITY_REGISTERED, EVENTS.ENTITY_UNREGISTERED, EVENTS.HIT_REQUEST]) {
    events.on(e, (p) => log.push({ e, p }));
  }
  const player = { x: 200, y: 560, facing: 1 };
  events.emit(EVENTS.ENTITY_REGISTERED, {
    id: 'player', team: 'player', maxHp: 1e9, hurtbox: { x: -20, y: -90, w: 40, h: 90 },
    getState: () => ({ x: player.x, y: player.y, facing: player.facing }),
  });
  return { events, resolver, log, player, tick: (n = STEP) => { clock += n; return clock; }, get clock() { return clock; } };
}

// bot: walk toward nearest live grunt, swing every 300ms
function botStep(w, arena, bounds, dt, state) {
  const live = arena.enemies.list().filter((g) => g.alive);
  if (!live.length) return;
  const near = live.reduce((a, b) => (Math.hypot(a.x - w.player.x, a.y - w.player.y) < Math.hypot(b.x - w.player.x, b.y - w.player.y) ? a : b));
  const dx = near.x - w.player.x, dy = near.y - w.player.y, d = Math.hypot(dx, dy);
  w.player.facing = dx >= 0 ? 1 : -1;
  if (d > 60) { w.player.x += (dx / d) * 220 * dt / 1000; w.player.y += (dy / d) * 220 * dt / 1000; }
  const c = bounds.clamp(w.player); w.player.x = c.x; w.player.y = c.y;
  state.cd -= dt;
  if (state.cd <= 0 && d < 100) {
    state.cd = 900; state.n++;
    w.events.emit(EVENTS.HIT_REQUEST, {
      attackerId: 'player', attackId: `player:${state.n}`, team: 'player',
      hitbox: { x: 10, y: -80, w: 90, h: 80 }, origin: { x: w.player.x, y: w.player.y },
      facing: w.player.facing, damage: 10, knockback: 200, hitstun: 250,
    });
  }
}

// 1) Full 3-wave run through Arena facade
{
  const w = makeWorld();
  let scroll = 0;
  const arena = new Arena({ events: w.events, getTarget: () => w.player, getScrollX: () => scroll });
  const cam = { scrollX: 0, setBounds() {} };
  const bot = { cd: 0, n: 0 };
  const lockSeen = [];
  w.events.on(EVENTS.WAVE_STARTED, ({ index }) => lockSeen.push([index, arena.bounds.locked, arena.bounds.lockX]));
  arena.start();
  let maxAtk = 0, t = 0;
  for (; t < 120000 && !arena.finished; t += STEP) {
    w.tick();
    botStep(w, arena, arena.bounds, STEP, bot);
    arena.update(STEP);
    arena.applyToCamera(cam, w.player.x); scroll = cam.scrollX;
    const atk = arena.enemies.list().filter((g) => g.state === 'telegraph' || g.state === 'attack').length;
    maxAtk = Math.max(maxAtk, atk);
    assert.ok(atk <= 2, 'attacker cap');
    assert.ok(arena.enemies.liveCount <= 4);
  }
  assert.ok(arena.finished, 'arena cleared within 120s sim');
  const names = w.log.map((l) => l.e).filter((e) => e.startsWith('wave') || e.startsWith('arena'));
  assert.deepEqual(names, ['wave-started', 'wave-cleared', 'wave-started', 'wave-cleared', 'wave-started', 'wave-cleared', 'arena-cleared']);
  const spawnedPerWave = WAVES.map((x) => x.count);
  const regs = w.log.filter((l) => l.e === EVENTS.ENTITY_REGISTERED && l.p.team === 'rust').length;
  assert.equal(regs, spawnedPerWave.reduce((a, b) => a + b, 0));
  assert.deepEqual(lockSeen.map((x) => x[0]), [0, 1, 2]);
  assert.ok(lockSeen.every((x) => x[1]));
  assert.ok(w.log.some((l) => l.e === EVENTS.HIT_REQUEST && l.p.team === 'rust'), 'grunts attacked');
  assert.equal(arena.bounds.locked, false, 'camera released');
  // let corpses clean up, all unregistered
  for (let i = 0; i < 100; i++) arena.update(STEP);
  assert.equal(arena.enemies.enemies.size, 0);
  console.log(`full run ok: ${(t / 1000).toFixed(1)}s sim, maxAttackers=${maxAtk}`);

  // retry restarts at wave 1
  w.log.length = 0;
  w.events.emit(EVENTS.RETRY, {});
  assert.equal(w.log.filter((l) => l.e === EVENTS.WAVE_STARTED)[0].p.index, 0);
  arena.dispose();
}

// helper for failsafe scenarios
function failsafeRig(dataOverride) {
  const w = makeWorld();
  const events = w.events;
  const bounds = new ArenaBounds({ events });
  const manager = new EnemyManager({ events, data: { ...GRUNT, ...dataOverride } });
  const spawner = new WaveSpawner({ events, spawn: (s) => manager.spawn(s) });
  let scroll = 0;
  const actions = [];
  const fs = new ArenaFailsafe({ bounds, manager, spawner, getScrollX: () => scroll, onAction: (a) => actions.push(a) });
  return { w, bounds, manager, spawner, fs, actions, setScroll: (s) => { scroll = s; } };
}

// 2) Stuck enemy (cannot move) is repositioned, then removed so the wave can still clear
{
  const r = failsafeRig({ moveSpeed: 0, circleSpeed: 0 });
  r.spawner.start();
  const cleared = [];
  r.w.events.on(EVENTS.WAVE_CLEARED, (p) => cleared.push(p.index));
  const target = { x: 600, y: 560 };
  for (let t = 0; t < 120000 && !r.spawner.finished; t += STEP) {
    r.spawner.update(STEP); r.manager.update(STEP, target); r.fs.update(STEP, target);
    r.setScroll(r.bounds.locked ? r.bounds.lockX : 0);
  }
  assert.ok(r.spawner.finished, 'immobile enemies cannot soft-lock the arena');
  assert.ok(r.actions.some((a) => a.reason === 'stuck' && !a.removed));
  assert.ok(r.actions.some((a) => a.removed));
  assert.deepEqual(cleared, [0, 1, 2]);
  console.log('stuck failsafe ok');
}

// 3) Off-screen enemy is pulled back; out-of-world is clamped immediately
{
  const r = failsafeRig({});
  r.spawner.start();
  const target = { x: 100, y: 560 };
  for (let t = 0; t < 2000; t += STEP) { r.spawner.update(STEP); r.manager.update(STEP, target); }
  const g = r.manager.list()[0];
  g.teleport(99999, 9999);
  r.fs.update(STEP, target);
  assert.ok(g.x <= r.bounds.world.w + 0.001 && g.y <= r.bounds.lane.maxY, 'clamped');
  // far from camera (scroll 0, locked window clamps x to <= 1240 which is inside view) -> force a far camera
  r.setScroll(-5000);
  for (let t = 0; t < 4000; t += STEP) r.fs.update(STEP, target);
  assert.ok(r.actions.some((a) => a.reason === 'offscreen'));
  console.log('offscreen failsafe ok');
}

console.log('arena sim tests passed');
