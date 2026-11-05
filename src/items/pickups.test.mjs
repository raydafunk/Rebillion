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

// boss mercy drop: only while the boss lives, only when Zed is low, rate limited
{
  const { LOW_HEALTH_DROP, createLowHealthDrop, lowHealthDrop } = await import('./pickups.js');
  const s = createLowHealthDrop();
  assert.equal(lowHealthDrop(s, 80, 100, 0, true), 0, 'healthy: no drop');
  assert.equal(lowHealthDrop(s, 20, 100, 0, false), 0, 'boss gone: no drop');
  assert.equal(lowHealthDrop(s, 0, 100, 0, true), 0, 'dead: no drop');
  assert.equal(lowHealthDrop(s, 30, 100, 1000, true), LOW_HEALTH_DROP.heal, 'low: boss drops health');
  assert.equal(lowHealthDrop(s, 10, 100, 2000, true), 0, 'cooldown');
  assert.equal(lowHealthDrop(s, 10, 100, 1000 + LOW_HEALTH_DROP.cooldownMs, true), LOW_HEALTH_DROP.heal, 'second drop after the cooldown');
  assert.equal(lowHealthDrop(s, 10, 100, 1e6, true), 0, 'capped per fight');
}

// a nonLethal hit (Dugan's slam) hurts but leaves the player at 1 hp
{
  const ev = fakeEmitter(); let t = 0;
  createHitResolver(ev, () => t);
  ev.emit(EVENTS.ENTITY_REGISTERED, { id: PLAYER_ID, team: 'zed', maxHp: 100, hurtbox: { x: -20, y: -80, w: 40, h: 80 }, getState: () => ({ x: 100, y: 500, lane: 500, facing: 1 }) });
  const dmg = [];
  ev.on(EVENTS.DAMAGE_APPLIED, (d) => dmg.push(d));
  const req = (id, damage) => ({ attackerId: 'b', attackId: id, team: 'rust', hitbox: { x: -20, y: -80, w: 40, h: 80 }, origin: { x: 100, y: 500 }, lane: 500, facing: 1, damage, knockback: 0, hitstun: 0, pierceInvuln: true, unblockable: true, nonLethal: true });
  ev.emit(EVENTS.HIT_REQUEST, req('a', 40));
  assert.equal(dmg.at(-1).hpAfter, 60, 'full 40 when it will not kill');
  t = 5000; ev.emit(EVENTS.HIT_REQUEST, req('b', 500));
  assert.equal(dmg.at(-1).hpAfter, 1, 'a huge slam still leaves 1 hp');
}

// level-end loot + throwable weapons
{
  const { finishDrops } = await import('./pickups.js');
  const { ThrownWeapon, WEAPON, isThrowHit } = await import('./thrownWeapon.js');
  const last = { lockX: 4000, finishDrop: { heals: [100, 100, 100], weapons: 5 } };
  const drops = finishDrops(last, 640);
  assert.equal(drops.filter((d) => d.kind === 'health').length, 3);
  assert.equal(drops.filter((d) => d.kind === 'weapon').length, 5);
  assert.ok(drops.every((d) => d.x > 4000 && d.x < 5280), 'all loot lands on the cleared fight screen');
  assert.equal(new Set(drops.map((d) => d.x)).size, drops.length, 'no two items stacked');
  assert.deepEqual(finishDrops({ lockX: 0 }, 640), [], 'no finishDrop, no loot');
  const w = new ThrownWeapon({ x: 100, y: 600, lane: 600, facing: -1 });
  const r = w.update(100);
  assert.equal(r.team, 'player'); assert.equal(r.facing, -1); assert.ok(w.x < 100, 'flies the way Zed faces');
  assert.ok(isThrowHit(w, { attackId: w.id, amount: 30 }) && !isThrowHit(w, { attackId: 'x', amount: 30 }));
  for (let i = 0; i < 40; i++) w.update(50);
  assert.equal(w.alive, false, 'spent after max range'); assert.equal(w.update(16), null);
  assert.ok(WEAPON.damage > 18, 'a throw out-hits a heavy punch');
  console.log('finish loot + thrown weapon ok');
}
