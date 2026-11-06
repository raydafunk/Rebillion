import assert from 'node:assert/strict';
import { fakeEmitter } from '../shared/fakeEmitter.mjs';
import { EVENTS } from '../shared/events.js';
import { EnemyManager } from './EnemyManager.js';
import { KaneBoss } from './KaneBoss.js';
import { KANE, KANE_MOVES, KANE_ID, pickKaneMove } from './kaneData.js';
import { BOSS_PROFILES } from '../ui/bossBarData.js';
import { victoryFor, victoryProblems } from '../ui/victoryData.js';

const rdy = (o = {}) => ({ hook: true, kick: true, vent: true, uppercut: true, ...o });
const ctx = (o) => ({ dist: 300, dy: 0, lift: 0, meleeMs: 0, ready: rdy(), lastId: null, ...o });

// --- data
assert.equal(KANE.moveSpeed, 75, 'owner change: moveSpeed 75');
assert.equal(KANE.maxHp, 400);
assert.deepEqual(Object.values(KANE_MOVES).map((m) => m.telegraphMs), [850, 700, 600, 900, 750], 'telegraphs match mini-bosses.json');
assert.deepEqual(Object.values(KANE_MOVES).map((m) => m.name), ['Hammer Slam', 'Hook Chain Grab', 'Furnace Kick', 'Steam Vent Burst', 'Crushing Uppercut']);
assert.equal(KANE_MOVES.hammer.hits[0].damage, 20);
assert.ok(KANE_MOVES.hook.hits[0].knockback < 0, 'the hook pulls Zed towards him (negative knockback)');
assert.equal(KANE_MOVES.vent.patch.lifeMs, 3000, 'steam patch lasts about 3 s');

// --- move picker
assert.equal(pickKaneMove(ctx({ dist: 90 }), () => 0.99).id, 'hammer', 'in reach: Hammer Slam is the default');
assert.equal(pickKaneMove(ctx({ dist: 70 }), () => 0.1).id, 'uppercut', 'Zed standing close: Crushing Uppercut');
assert.equal(pickKaneMove(ctx({ dist: 95 }), () => 0.1).id, 'kick', 'mid melee: Furnace Kick');
assert.equal(pickKaneMove(ctx({ dist: 40 }), () => 0.99).id, 'vent', 'crowding him: Steam Vent Burst');
assert.equal(pickKaneMove(ctx({ dist: 90, meleeMs: 3000 }), () => 0.99).id, 'vent', 'too long in melee: Steam Vent Burst');
assert.equal(pickKaneMove(ctx({ dist: 90, lift: 40 }), () => 0.99).id, 'vent', 'Zed airborne in reach: vent');
assert.equal(pickKaneMove(ctx({ dist: 40, ready: rdy({ vent: false }) }), () => 0.99).id, 'hammer', 'vent on cooldown: hammer');
assert.equal(pickKaneMove(ctx({ dist: 300 }), () => 0.1).id, 'hook', 'mid range in line: Hook Chain Grab');
assert.equal(pickKaneMove(ctx({ dist: 300, dy: 100 }), () => 0.1), null, 'out of line: keep walking');
assert.equal(pickKaneMove(ctx({ dist: 300, ready: rdy({ hook: false }) }), () => 0.1), null, 'hook on cooldown: keep walking');
assert.equal(pickKaneMove(ctx({ dist: 600 }), () => 0.1), null, 'too far for the hook: keep walking');

// --- state machine: drives a move through telegraph -> attack -> recover and collects hit requests
function run(moveId, { target = { x: 0, y: 500, lift: 0 }, x = 200, steps = 200 } = {}) {
  const reqs = [];
  const b = new KaneBoss({ id: 'k', x, y: 500, hooks: { onHitRequest: (q) => reqs.push(q) }, getXRange: () => ({ min: 0, max: 1280 }), rng: () => 0.99 });
  b.target = target; b.state = 'approach'; b.cooldownMs = 0; b.facing = -1;
  b._beginTelegraph(KANE_MOVES[moveId]);
  const states = [];
  for (let i = 0; i < steps; i++) { b.update(16, target); if (states[states.length - 1] !== b.state) states.push(b.state); }
  return { b, reqs, states };
}
for (const id of Object.keys(KANE_MOVES)) {
  const { states } = run(id, { target: { x: 150, y: 500 }, x: 200 });
  assert.deepEqual(states.slice(0, 3), ['telegraph', 'attack', 'recover'], `${id}: telegraph -> attack -> recover`);
}
{ // hammer: one 20 damage hit, one hammer impact
  const { reqs, b } = run('hammer', { target: { x: 150, y: 500 } });
  assert.equal(reqs.length, 1); assert.equal(reqs[0].damage, 20); assert.equal(reqs[0].knockback, 420); assert.equal(b.hammerSeq, 1);
}
{ // hook: one pulling hit
  const { reqs, b } = run('hook', { target: { x: -100, y: 500 }, x: 200 });
  assert.equal(reqs.length, 1); assert.ok(reqs[0].knockback < 0); assert.equal(b.hookSeq, 1);
}
{ // kick: one 12 damage hit
  const { reqs } = run('kick', { target: { x: 150, y: 500 } });
  assert.equal(reqs.length, 1); assert.equal(reqs[0].damage, 12);
}
{ // uppercut: one heavy hit with long hitstun
  const { reqs } = run('uppercut', { target: { x: 150, y: 500 } });
  assert.equal(reqs.length, 1); assert.equal(reqs[0].damage, 18); assert.equal(reqs[0].hitstun, 450);
}
{ // vent: one burst hit, then a patch that ticks for about 3 s and expires
  const { b, reqs } = run('vent', { target: { x: 150, y: 500 }, steps: 120 });
  assert.equal(b.ventSeq, 1);
  assert.equal(b.patches.length, 1, 'patch laid');
  assert.ok(reqs.some((r) => String(r.attackId).includes(':patch')), 'patch ticks while live');
  const tick = reqs.find((r) => String(r.attackId).includes(':patch'));
  assert.ok(tick.unblockable && tick.unparryable && tick.lane === b.y, 'floor hazard: not blockable, only a jump or leaving clears it');
  const t = { x: 150, y: 500 };
  for (let i = 0; i < 400; i++) b.update(16, t);       // run well past 3 s
  assert.equal(b.patches.length, 0, 'patch expires');
}
{ // a patch is marked (warn) during the wind-up and deals nothing until the burst
  const reqs = [];
  const b = new KaneBoss({ id: 'k', x: 200, y: 500, hooks: { onHitRequest: (q) => reqs.push(q) }, rng: () => 0.99 });
  b.state = 'approach'; b.cooldownMs = 0; b._beginTelegraph(KANE_MOVES.vent);
  for (let i = 0; i < 40; i++) b.update(16, { x: 150, y: 500 });
  assert.equal(b.state, 'telegraph'); assert.equal(b.patches[0].state, 'warn'); assert.equal(reqs.length, 0);
}
{ // a landed hook shortens the recovery and the next move is the Hammer Slam
  const reqs = [];
  const b = new KaneBoss({ id: 'k', x: 200, y: 500, hooks: { onHitRequest: (q) => reqs.push(q) }, rng: () => 0.99 });
  const t = { x: 0, y: 500 };
  b.state = 'approach'; b.cooldownMs = 0; b.facing = -1; b._beginTelegraph(KANE_MOVES.hook);
  let landed = false;
  for (let i = 0; i < 200 && b.state !== 'recover'; i++) { b.update(16, t); if (!landed && reqs.length) { b.onHitLanded(); landed = true; } }
  assert.ok(b.hookLanded && b.followUp);
  assert.equal(b.timer, KANE_MOVES.hook.landedRecoverMs, 'short recovery after a landed hook');
  b.x = 40;   // Zed was dragged right next to him
  for (let i = 0; i < 80 && b.state !== 'telegraph'; i++) b.update(16, { x: 0, y: 500 });
  assert.equal(b.move.id, 'hammer', 'follow-up Hammer Slam');
}
{ // a parry stuns him and cancels the move; ordinary hits do not
  const { b } = run('hammer', { target: { x: 150, y: 500 }, steps: 10 });
  assert.equal(b.state, 'telegraph');
  b.takeHit({ hitstun: 100, knockback: 400, hpAfter: 200 });
  assert.equal(b.state, 'telegraph', 'ordinary hits never stun him (boss hitstun immunity)');
  assert.ok(Math.abs(b.kx) <= 400 * KANE.knockbackScale + 1e-9);
  b.takeHit({ hitstun: 100, parry: true });
  assert.equal(b.state, 'hitstun'); assert.ok(b.hitstunMs >= KANE.parryStunMs);
}
{ // he walks at 75 px/s
  const b = new KaneBoss({ id: 'k', x: 600, y: 500, rng: () => 0.99 });
  b.state = 'approach'; b.cooldownMs = 9999;
  b.update(1000, { x: 0, y: 500 });
  assert.equal(Math.round(600 - b.x), 75);
}
{ // death
  const b = new KaneBoss({ id: 'k', x: 100, y: 500 });
  b.die(); assert.equal(b.state, 'dead'); assert.ok(!b.alive);
}

// --- EnemyManager registers him as a boss with his own AI
{
  const events = fakeEmitter(); const regs = [];
  events.on(EVENTS.ENTITY_REGISTERED, (p) => regs.push(p));
  const m = new EnemyManager({ events });
  const k = m.spawn({ id: 'crusher-kane-1', x: 100, y: 500, enemy: KANE_ID, hpMult: 1 });
  const reg = regs.find((p) => p.id === 'crusher-kane-1');
  assert.ok(reg.boss && reg.bossProfile === KANE_ID && reg.team === 'rust');
  assert.equal(k.constructor.name, 'KaneBoss', 'his own AI, not the grunt');
  assert.equal(k.maxHp, 400); assert.ok(k.miniBoss && !k.isBoss);
  assert.equal(k.data.moveSpeed, 75);
  assert.equal(m.spawn({ id: 'crusher-kane-2', x: 0, y: 500, enemy: KANE_ID, hpMult: 2 }).maxHp, 800, 'hpMult scales him');
  assert.equal(m.spawn({ id: 'crusher-kane-3', x: 0, y: 500, enemy: KANE_ID, speedMult: 1.2 }).data.moveSpeed, Math.round(75 * 1.2));
  assert.ok(BOSS_PROFILES[KANE_ID] && BOSS_PROFILES[KANE_ID].maxHpFallback === 400);
  assert.ok(victoryFor(KANE_ID));
  assert.deepEqual(victoryProblems(), []);
  // a landed hook tells him via damage-applied
  events.emit(EVENTS.DAMAGE_APPLIED, { targetId: 'player', attackerId: 'crusher-kane-1', amount: 8, hpAfter: 90, knockback: -560, hitstun: 420, landed: true });
}
console.log('kaneBoss ok');
