import assert from 'node:assert/strict';
import { PICKUP, pickupDrop, canCollect } from './pickups.js';
import { createHealth, applyDamage, applyHeal } from '../combat/health.js';
import { createHitResolver } from '../combat/hitResolver.js';
import { fakeEmitter } from '../shared/fakeEmitter.mjs';
import { EVENTS } from '../shared/events.js';
import { PLAYER_ID } from '../shared/combatData.js';
import { WaveSpawner } from '../waves/WaveSpawner.js';
import { EnemyManager } from '../enemies/EnemyManager.js';

// drop placement
const waves = [
  { lockX: 0, restPickup: { heal: 25 } },
  { lockX: 800 },
];
assert.deepEqual(pickupDrop(waves[0], waves[1], 640), { x: 1340, y: 640, heal: 25 }, 'ahead of the cleared screen, short of the next trigger');
assert.ok(pickupDrop(waves[0], waves[1], 640).x > waves[0].lockX + 1280, 'past the right edge of the locked fight screen');
assert.equal(pickupDrop(waves[1], null, 640), null, 'nothing to rest before after the last wave');
assert.equal(pickupDrop({ lockX: 0 }, waves[1], 640), null, 'no restPickup, no drop');

// collection range
const p = { x: 1000, y: 640, heal: 25 };
assert.ok(canCollect(p, 1000 + PICKUP.collectRadius));
assert.ok(!canCollect(p, 1000 + PICKUP.collectRadius + 1));
assert.ok(!canCollect(p, 1000, PICKUP.maxAirborne + 1), 'cannot grab it from a high jump');

// healing: capped, never revives
const h = createHealth({ maxHp: 100 });
applyDamage(h, 30, 0);
assert.equal(applyHeal(h, 25), 25);
assert.equal(h.hp, 95);
assert.equal(applyHeal(h, 25), 5, 'capped at maxHp');
assert.equal(applyHeal(h, 25), 0, 'full health gains nothing');
applyDamage(h, 999, 1000);
assert.equal(applyHeal(h, 50), 0, 'the dead stay dead');

// resolver heal emits the HUD event only when hp changed
{
  const ev = fakeEmitter(); const seen = [];
  ev.on(EVENTS.PLAYER_HEALTH_CHANGED, (d) => seen.push(d.hp));
  const r = createHitResolver(ev, () => 0);
  ev.emit(EVENTS.ENTITY_REGISTERED, { id: PLAYER_ID, team: 'player', maxHp: 100, hurtbox: { x: 0, y: 0, w: 1, h: 1 }, getState: () => ({ x: 0, y: 0, facing: 1 }) });
  r.getHealth(PLAYER_ID).hp = 60;
  assert.equal(r.heal(PLAYER_ID, 25), 25);
  assert.equal(r.getHealth(PLAYER_ID).hp, 85);
  assert.equal(seen.at(-1), 85);
  const n = seen.length;
  r.getHealth(PLAYER_ID).hp = 100;
  assert.equal(r.heal(PLAYER_ID, 25), 0);
  assert.equal(seen.length, n, 'no event at full health');
  assert.equal(r.heal('nobody', 10), 0);
}

// elites: the last N spawns of a wave are tougher Breakers; the manager registers their larger hp
{
  const ev = fakeEmitter(); const made = [];
  const wv = [{ enemy: 'grunt', sourceEnemy: 'grunt', count: 4, maxAlive: 4, spawnIntervalMs: 300, startDelayMs: 0, lockX: 0, elites: 1, eliteHpMult: 3, spawnPoints: [{ x: 60, y: 520 }] }];
  const sp = new WaveSpawner({ events: ev, waves: wv, holdBetweenWaves: true, spawn: (s) => made.push(s) });
  sp.start(); for (let i = 0; i < 20; i++) sp.update(300);
  assert.equal(made.length, 4);
  assert.deepEqual(made.map((s) => s.skin), ['grunt', 'grunt', 'grunt', 'rust-breaker']);
  assert.deepEqual(made.map((s) => s.hpMult), [1, 1, 1, 3]);

  const regs = [];
  ev.on(EVENTS.ENTITY_REGISTERED, (r) => regs.push(r));
  const mgr = new EnemyManager({ events: ev });
  for (const s of made) mgr.spawn(s);
  assert.deepEqual(regs.map((r) => r.maxHp), [30, 30, 30, 90]);
  assert.equal(mgr.get(made[3].id).hp, 90);
  mgr.dispose();
}

// wave-wide hpMult (tough specials/bosses) applies to every spawn; elites still override it
{
  const made = [];
  const wv = [{ enemy: 'grunt', sourceEnemy: 'rust-watcher', count: 3, maxAlive: 3, spawnIntervalMs: 300, startDelayMs: 0, lockX: 0, hpMult: 1.5, spawnPoints: [{ x: 60, y: 520 }] }];
  const sp = new WaveSpawner({ events: fakeEmitter(), waves: wv, holdBetweenWaves: true, spawn: (s) => made.push(s) });
  sp.start(); for (let i = 0; i < 20; i++) sp.update(300);
  assert.deepEqual(made.map((s) => s.hpMult), [1.5, 1.5, 1.5]);
  const mgr = new EnemyManager({ events: fakeEmitter() });
  assert.equal(mgr.spawn(made[0]).maxHp, 45);
  mgr.dispose();
}

console.log('pickups + elites ok');
