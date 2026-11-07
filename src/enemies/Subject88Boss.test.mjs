import assert from 'node:assert/strict';
import { Subject88Boss } from './Subject88Boss.js';
import { SUBJECT88, SUBJECT88_MOVES } from './subject88Data.js';
import { AttackSlots } from './AttackSlots.js';

function make(over = {}) {
  const hits = [];
  const b = new Subject88Boss({ id: 's', x: 900, y: 520, hooks: { onHitRequest: (q) => hits.push(q) }, getXRange: () => ({ min: 0, max: 1280 }), rng: () => 0.5, ...over });
  b.target = { x: 700, y: 520, lift: 0 }; b.state = 'approach'; b.cooldownMs = 0; b.facing = -1;
  return { b, hits };
}
function play(b, id, extra = 200) {
  const m = SUBJECT88_MOVES[id];
  b._beginTelegraph(m);
  for (let t = 0; t < m.telegraphMs + m.attackMs + m.recoverMs + extra; t += 10) b.update(10, b.target);
}

// breath: one cone hit, then a lingering cloud that ticks and fades
{ const { b, hits } = make(); b._beginTelegraph(SUBJECT88_MOVES.breath);
  for (let t = 0; t < 600 + 200; t += 10) b.update(10, b.target);
  assert.equal(b.state, 'attack'); assert.equal(b.hazards.length, 1); assert.equal(b.hazards[0].kind, 'gas'); assert.equal(b.gasSeq, 1);
  assert.equal(b.hazards[0].box.x < b.x, true, 'cone points at Zed (west)');
  b.holdIdle();   // no second breath muddying the count
  const n0 = hits.length; for (let t = 0; t < 1500; t += 10) b.update(10, b.target);
  assert.ok(hits.length > n0 + 1, 'gas keeps ticking');
  assert.ok(hits.some((q) => q.hazard === 'gas' && q.damage === 3));
  assert.ok(b.hazards[0].alpha < 1, 'fades');
  for (let t = 0; t < 3000; t += 10) b.update(10, b.target);
  assert.equal(b.hazards.length, 0, 'gone after its life'); }

// spit: marks Zed's spot at wind-up, lands there, puddle ~3 s
{ const { b, hits } = make(); b._beginTelegraph(SUBJECT88_MOVES.spit);
  assert.deepEqual([b.spitMark.x, b.spitMark.y], [700, 520]); b.target = { x: 300, y: 520 };   // Zed walks away
  for (let t = 0; t < 650 + 200; t += 10) b.update(10, b.target);
  assert.equal(b.hazards.length, 1); assert.equal(b.hazards[0].x, 700, 'puddle lands where Zed was'); assert.equal(b.spitMark, null); assert.equal(b.spitSeq, 1);
  assert.equal(b.hazards[0].maxLife, 3000); assert.equal(hits[0].damage, SUBJECT88_MOVES.spit.puddle.landDamage); }

// slam: heavy hit + small puddle in front
{ const { b, hits } = make(); play(b, 'slam', 0); assert.equal(hits.filter((q) => !q.hazard).length, 1); assert.equal(hits[0].damage, 18);
  assert.ok(b.puddleSeq === 1); }
{ const { b } = make(); b._beginTelegraph(SUBJECT88_MOVES.slam); for (let t = 0; t < 750 + 300; t += 10) b.update(10, b.target);
  assert.equal(b.hazards[0].kind, 'puddle'); assert.ok(b.hazards[0].r < SUBJECT88_MOVES.spit.puddle.radius, 'slam puddle is small'); assert.ok(b.hazards[0].x < b.x); }

// charge: lane strip during wind-up, runs, hits the wall and is left open
{ const { b, hits } = make({ x: 400 }); b.facing = 1; b.target = { x: 900, y: 520 }; b.phase2 = true; b._beginTelegraph(SUBJECT88_MOVES.charge);
  assert.ok(b.chargeLane && b.chargeLane.dir === 1 && b.chargeLane.x1 > b.chargeLane.x0, 'red lane strip');
  const x0 = b.x; for (let t = 0; t < 800 + 650; t += 10) b.update(10, b.target);
  assert.ok(b.x > x0 + 200, 'ran down the lane'); assert.ok(hits.length >= 1 && hits[0].damage === 14); }
{ const { b } = make({ x: 1000 }); b.facing = 1; b.target = { x: 1270, y: 520 }; b._beginTelegraph(SUBJECT88_MOVES.charge);
  for (let t = 0; t < 800 + 700; t += 10) b.update(10, b.target);
  assert.equal(b.wallSeq, 1, 'hit the edge'); assert.ok(b.x <= 1280 - SUBJECT88.edgeInsetPx); assert.equal(b.state, 'recover');
  assert.ok(b.timer > SUBJECT88_MOVES.charge.recoverMs - 700, 'extra helpless time after the wall'); assert.equal(b.chargeLane, null); }

// explosion: ring grows, bursts once, he is rooted; forced by health thresholds
{ const { b, hits } = make(); b._beginTelegraph(SUBJECT88_MOVES.explosion);
  assert.equal(b.stopped, true); const x0 = b.x;
  for (let t = 0; t < 500; t += 10) b.update(10, b.target);
  assert.ok(b.explosion.r > 0 && b.explosion.r < b.explosion.maxR && b.explosion.state === 'warn');
  for (let t = 0; t < 500 + 600; t += 10) b.update(10, b.target);
  assert.equal(b.explosionSeq, 1); assert.equal(hits.length, 1); assert.equal(hits[0].damage, 20); assert.equal(b.x, x0, 'never moved');
  assert.ok(hits[0].hitbox.w >= 400, 'ring wide enough that Zed must step out'); }
{ const { b } = make(); assert.equal(b.stopped, false);
  b.takeHit({ knockback: 100, hpAfter: b.maxHp * 0.7 }); assert.equal(b.phase2, false); assert.equal(b.forceExplosion, false);
  b.takeHit({ knockback: 100, hpAfter: b.maxHp * 0.55 }); assert.equal(b.phase2, true, 'flares'); assert.equal(b.forceExplosion, false);
  const slow = new Subject88Boss({ id: 'z' }).speed; assert.ok(b.speed > slow);
  b.takeHit({ hpAfter: b.maxHp * 0.39 }); assert.equal(b.forceExplosion, true);
  b.update(1, b.target); assert.equal(b.state, 'telegraph'); assert.equal(b.move.id, 'explosion'); assert.equal(b.explosion.state, 'warn'); }

// attacker slot taken before every move; none free means he holds
{ const slots = new AttackSlots(1); slots.tryAcquire('other');
  const { b } = make({ slots }); b.target = { x: 850, y: 520 }; for (const k of Object.keys(b.cd)) b.cd[k] = 0; b.update(16, b.target);
  assert.notEqual(b.state, 'telegraph'); assert.equal(b.circling, true);
  slots.release('other'); b.update(16, b.target); assert.equal(b.state, 'telegraph'); assert.equal(slots.tryAcquire('x'), false, 'his slot is held'); }

// he walks Zed down, never backs away
{ const { b } = make(); b.cooldownMs = 5000; const d0 = b.x - 400; for (let i = 0; i < 30; i++) b.update(16, { x: 400, y: 520 }); assert.ok(b.x - 400 < d0); assert.ok(b.vx < 0); }

// ordinary hits do not stun; a parry does and cancels the move
{ const { b } = make(); b.takeHit({ hitstun: 300, knockback: 200, hpAfter: b.maxHp - 10 }); assert.notEqual(b.state, 'hitstun');
  b._beginTelegraph(SUBJECT88_MOVES.slam); assert.equal(b.cueClockMs, 0);
  b.takeHit({ hitstun: 300, parry: true }); assert.equal(b.state, 'hitstun'); assert.equal(b.hitSeq, 1); assert.equal(b.cueClockMs, null); }

// hazards outlive the boss's move and stop hurting when he dies
{ const { b, hits } = make(); b._beginTelegraph(SUBJECT88_MOVES.breath); for (let t = 0; t < 800; t += 10) b.update(10, b.target);
  b.die(); assert.equal(b.state, 'dead'); const n = hits.length; for (let t = 0; t < 400; t += 10) b.update(10, b.target);
  assert.equal(hits.length, n, 'no damage after death'); for (let t = 0; t < 600; t += 10) b.update(10, b.target); assert.equal(b.hazards.length, 0); }

// intro hold / release
{ const { b } = make(); b.holdIdle(); assert.equal(b.state, 'idle'); b.update(2000, b.target); assert.equal(b.state, 'idle'); b.releaseIdle(); b.update(16, b.target); assert.equal(b.state, 'approach'); }

console.log('Subject88Boss ok');
