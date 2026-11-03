import assert from 'node:assert/strict';
import { RoyceBoss } from './RoyceBoss.js';
import { ROYCE, ROYCE_MOVES, pickRoyceMove, ROYCE_BLOCK } from './royceData.js';
import { roycePose, royceAnimKey } from './royceSprites.js';

const rdy = (o = {}) => ({ dash: true, slam: true, trap: true, taser: true, ...o });
const ctx = (o) => ({ dist: 300, dy: 0, lift: 0, meleeMs: 0, ready: rdy(), lastId: null, ...o });

// --- move picker
assert.equal(pickRoyceMove(ctx({ dist: 80 }), () => 0.9).id, 'combo', 'in reach: Baton Combo');
assert.equal(pickRoyceMove(ctx({ dist: 40 }), () => 0.9).id, 'slam', 'crowding him: Shockwave Slam');
assert.equal(pickRoyceMove(ctx({ dist: 80, lift: 40 }), () => 0.9).id, 'slam', 'Zed airborne in reach: slam');
assert.equal(pickRoyceMove(ctx({ dist: 40, ready: rdy({ slam: false }) }), () => 0.9).id, 'combo', 'slam on cooldown: combo');
assert.equal(pickRoyceMove(ctx({ dist: 250 }), () => 0.1).id, 'taser', 'mid-range in line: Taser Burst');
assert.equal(pickRoyceMove(ctx({ dist: 250, dy: 100 }), () => 0.1).id, 'trap', 'out of line: no taser, lays a trap');
assert.equal(pickRoyceMove(ctx({ dist: 500 }), () => 0.9).id, 'dash', 'far, in lane: Charging Dash');
assert.equal(pickRoyceMove(ctx({ dist: 500, ready: rdy({ dash: false, trap: false }) }), () => 0.9), null, 'everything on cooldown: keep walking');
assert.deepEqual(Object.values(ROYCE_MOVES).map((m) => m.telegraphMs), [500, 650, 750, 800, 550], 'telegraphs match mini-bosses.json');
assert.ok(ROYCE_MOVES.taser.hits[0].hitstun <= 600, 'the stun never locks Zed for more than 600 ms');
assert.ok(ROYCE_MOVES.trap.trap.hitstun <= 600);

// --- state machine: drives a move through telegraph -> attack -> recover and collects hit requests
function run(moveId, { target = { x: 0, y: 500, lift: 0 }, x = 200, steps = 100 } = {}) {
  const reqs = [];
  const b = new RoyceBoss({ id: 'r', x, y: 500, hooks: { onHitRequest: (q) => reqs.push(q) }, getXRange: () => ({ min: 0, max: 1280 }), rng: () => 0.99 });
  b.target = target; b.state = 'approach'; b.cooldownMs = 0; b.facing = -1;
  b._beginTelegraph(ROYCE_MOVES[moveId]);
  const states = [];
  for (let i = 0; i < steps; i++) { b.update(16, target); if (states[states.length - 1] !== b.state) states.push(b.state); }
  return { b, reqs, states };
}
{ // combo: four hits, finisher is the heavy one
  const { reqs, states } = run('combo', { target: { x: 150, y: 500 }, x: 200 });
  assert.deepEqual(states.slice(0, 3), ['telegraph', 'attack', 'recover']);
  assert.equal(reqs.length, 4); assert.equal(reqs[3].damage, 12); assert.equal(new Set(reqs.map((r) => r.attackId)).size, 4);
}
{ // taser: one stun hit of 600 ms
  const { reqs } = run('taser', { target: { x: 0, y: 500 }, x: 250 });
  assert.equal(reqs.length, 1); assert.equal(reqs[0].hitstun, 600);
}
{ // slam: one hit around him
  const { reqs, b } = run('slam', { target: { x: 220, y: 500 } });
  assert.equal(reqs.length, 1); assert.equal(b.slamSeq, 1);
}
{ // dash: runs the lane, crashes into the wall when nothing is hit, long recovery
  const { b, states } = run('dash', { target: { x: 0, y: 500 }, x: 400, steps: 300 });
  assert.ok(states.includes('attack') && states.includes('recover'));
  assert.ok(b.crashSeq === 1 && b.x <= 70 + 1, 'crashed into the left wall');
}
{ // dash ends on contact
  const reqs = [];
  const b = new RoyceBoss({ id: 'r', x: 400, y: 500, hooks: { onHitRequest: (q) => reqs.push(q) }, getXRange: () => ({ min: 0, max: 1280 }), rng: () => 0.99 });
  b.state = 'approach'; b.facing = -1; b._beginTelegraph(ROYCE_MOVES.dash);
  for (let i = 0; i < 80; i++) b.update(16, { x: 0, y: 500 });
  assert.ok(reqs.length >= 1 && b.state === 'attack');
  b.onHitLanded(); b.update(16, { x: 0, y: 500 });
  assert.equal(b.state, 'recover', 'contact ends the dash');
  const n = reqs.length; for (let i = 0; i < 10; i++) b.update(16, { x: 0, y: 500 });
  assert.equal(reqs.length, n, 'no more hit requests after it lands');
}
{ // rail trap: strips marked in the wind-up (no damage yet), live after, shock on a tick, gone after 4 s, outlive the move
  const reqs = [];
  const b = new RoyceBoss({ id: 'r', x: 600, y: 500, hooks: { onHitRequest: (q) => reqs.push(q) }, getXRange: () => ({ min: 0, max: 1280 }), rng: () => 0.99 });
  const tg = { x: 300, y: 500 };
  b.target = tg; b.state = 'approach'; b._beginTelegraph(ROYCE_MOVES.trap);
  assert.equal(b.traps.length, 2); assert.ok(b.traps.every((t) => t.state === 'warn'));
  for (let i = 0; i < 40; i++) b.update(16, tg);   // wind-up (800 ms)
  assert.equal(reqs.length, 0, 'marked strips do no damage');
  for (let i = 0; i < 80; i++) b.update(16, tg);   // attack + recover
  assert.ok(b.traps.every((t) => t.state === 'live') && reqs.length > 2, 'strips are live and shocking');
  assert.ok(reqs.every((r) => r.lane === null && r.hitstun <= 600 && r.unparryable));
  assert.notEqual(b.state, 'telegraph'); assert.ok(b.traps.length === 2, 'strips outlive the move');
  for (let i = 0; i < 300; i++) b.update(16, tg);  // >4 s total
  assert.equal(b.traps.length, 0, 'strips expire');
}
{ // parry stun cancels the wind-up and its marked strips
  const b = new RoyceBoss({ id: 'r', x: 600, y: 500, rng: () => 0.99 });
  b.target = { x: 300, y: 500 }; b.state = 'approach'; b._beginTelegraph(ROYCE_MOVES.trap);
  b.takeHit({ parry: true, hitstun: 100 });
  assert.equal(b.state, 'hitstun'); assert.equal(b.traps.length, 0); assert.equal(b.hitstunMs, ROYCE.parryStunMs);
}
{ // ordinary hits never stun him
  const b = new RoyceBoss({ id: 'r', x: 600, y: 500 }); b.state = 'approach';
  b.takeHit({ hitstun: 500, knockback: 400, hpAfter: 100 });
  assert.equal(b.state, 'approach'); assert.equal(b.hp, 100); assert.ok(b.kx !== 0);
}
{ // block: guard flag, heavy hit breaks it
  const b = new RoyceBoss({ id: 'r', x: 600, y: 500, rng: () => 0 }); b.state = 'approach';
  b.onPlayerAttack({ attackId: 'a1', damage: 6, origin: { x: 560, y: 500 } });
  assert.equal(b.state, 'block'); assert.equal(b.guard, 'block');
  b.onPlayerAttack({ attackId: 'a2', damage: ROYCE_BLOCK.guardBreakDamage, origin: { x: 560, y: 500 } });
  assert.equal(b.state, 'hitstun'); assert.equal(b.guard, null);
}

// --- poses: every move has its own clip
const g = { facing: 1, vx: 0, vy: 0, moveSeq: 2, blockSeq: 1 };
for (const [id, clip] of [['combo', 'attack'], ['dash', 'dash'], ['slam', 'slam'], ['trap', 'trap'], ['taser', 'taser']]) {
  const p = roycePose({ ...g, state: 'telegraph', move: ROYCE_MOVES[id] });
  assert.equal(p.anim, royceAnimKey(clip, 'east')); assert.equal(p.seq, 'mv2');
  assert.equal(roycePose({ ...g, state: 'attack', move: ROYCE_MOVES[id] }).seq, 'mv2', 'wind-up and strike are one clip');
}
assert.equal(roycePose({ ...g, state: 'block' }).anim, royceAnimKey('block', 'east'));
console.log('RoyceBoss ok');
