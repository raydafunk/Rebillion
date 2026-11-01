import assert from 'node:assert/strict';
import { fakeEmitter } from '../shared/fakeEmitter.mjs';
import { EVENTS } from '../shared/events.js';
import { BrickDugan, DuganState } from './BrickDugan.js';
import { DUGAN, DUGAN_MOVES, DUGAN_MAX_HP, pickDuganMove } from './duganData.js';
import { EnemyManager } from './EnemyManager.js';
import { AttackSlots } from './AttackSlots.js';

// ---- data matches the content file: telegraphs readable, five canon moves ----
assert.equal(DUGAN.maxHp, DUGAN_MAX_HP);
assert.equal(DUGAN_MAX_HP, 150);
assert.deepEqual(Object.values(DUGAN_MOVES).map((m) => m.name).sort(),
  ['Brick Breaker Punch', 'Grab and Wall Slam', 'Ground Stomp', 'Rage Punch', 'Running Shoulder Charge']);
assert.deepEqual(Object.values(DUGAN_MOVES).map((m) => m.telegraphMs), [650, 800, 700, 600, 900], 'telegraphs match mini-bosses.json');
for (const m of Object.values(DUGAN_MOVES)) assert.ok(m.telegraphMs >= 300, `${m.id} telegraph is readable`);

// ---- move choice ----
const base = { dist: 60, dy: 0, lift: 0, meleeMs: 0, ragePending: false, chargeReady: false, lastId: null };
assert.equal(pickDuganMove(base, () => 0.9).id, 'punch', 'close range: Brick Breaker Punch');
assert.equal(pickDuganMove({ ...base, lift: 40 }, () => 0.9).id, 'stomp', 'Zed airborne: Ground Stomp');
assert.equal(pickDuganMove({ ...base, dist: 30 }, () => 0.9).id, 'stomp', 'crowding him: Ground Stomp');
assert.equal(pickDuganMove({ ...base, meleeMs: 2600 }, () => 0.9).id, 'grab', 'too long in melee: Grab and Wall Slam');
assert.equal(pickDuganMove({ ...base, ragePending: true }, () => 0.9).id, 'rage', 'below 30 percent: Rage Punch');
assert.equal(pickDuganMove({ ...base, dist: 400, chargeReady: true }, () => 0.9).id, 'charge', 'from range along his lane: charge');
assert.equal(pickDuganMove({ ...base, dist: 400, dy: 90, chargeReady: true }, () => 0.9), null, 'no charge when Zed is off his lane');
assert.equal(pickDuganMove({ ...base, dist: 400 }, () => 0.9), null, 'charge on cooldown: keep walking');
assert.equal(pickDuganMove({ ...base, dist: 400, ragePending: true }, () => 0.9), null, 'rage waits until he is in reach');

// ---- a single Dugan: telegraph, then the hit, with the shared attacker slot ----
function make(opts = {}) {
  const hits = [], states = [];
  const slots = new AttackSlots(3);
  const d = new BrickDugan({ id: 'dugan-1', x: 400, y: 580, slots, rng: () => 0.9,
    getXRange: () => ({ min: 40, max: 1240 }),
    hooks: { onHitRequest: (r) => hits.push(r), onStateChange: (n) => states.push(n) }, ...opts });
  return { d, hits, states, slots };
}
function run(d, ms, target, step = 16) { for (let t = 0; t < ms; t += step) d.update(step, target); }

{ // Brick Breaker Punch: telegraph >= 650 ms before the hit, then a hit-request with the data numbers
  const { d, hits, states, slots } = make();
  const zed = { x: 470, y: 580, lift: 0 };
  d.update(16, zed); run(d, 700, zed);                     // idle, then he walks in and reaches the cooldown
  assert.ok(states.includes('telegraph'), 'he winds up');
  assert.equal(hits.length, 0, 'no hit during the wind-up');
  assert.equal(slots.count, 1, 'takes an attacker slot before the move');
  const startedAt = d.state;
  run(d, 2200, zed);
  assert.ok(hits.length >= 1, 'the punch lands a hit-request');
  assert.equal(hits[0].damage, 16); assert.equal(hits[0].knockback, 400); assert.equal(hits[0].hitstun, 280);
  assert.equal(hits[0].team, 'rust');
  assert.ok(startedAt);
}

{ // telegraph really lasts the move's telegraphMs
  const { d, hits } = make();
  const zed = { x: 470, y: 580, lift: 0 };
  d.cooldownMs = 0; d.state = DuganState.APPROACH;
  d.update(16, zed);
  assert.equal(d.state, DuganState.TELEGRAPH); assert.equal(d.move.id, 'punch');
  assert.equal(d.telegraphTotalMs, 650);
  run(d, 600, zed); assert.equal(d.state, DuganState.TELEGRAPH, 'still winding up at 600 ms'); assert.equal(hits.length, 0);
  assert.ok(d.cueClockMs !== null && d.parryMarkMs === 650 + 130 - 80, 'parry cue clock and mark');
  run(d, 120, zed); assert.equal(d.state, DuganState.ATTACK);
}

{ // ordinary hits never stun him or juggle him; a parry does and cancels the move
  const { d, hits } = make();
  const zed = { x: 470, y: 580, lift: 0 };
  d.cooldownMs = 0; d.state = DuganState.APPROACH; d.update(16, zed);
  assert.equal(d.state, DuganState.TELEGRAPH);
  d.takeHit({ hitstun: 500, knockback: 400, hpAfter: 140 });
  assert.equal(d.state, DuganState.TELEGRAPH, 'hitstun immunity: a hit does not interrupt him');
  assert.equal(d.hp, 140);
  assert.ok(Math.abs(d.kx) < 100, 'barely knocked back');
  d.takeHit({ hitstun: 300, knockback: 0, parry: true });
  assert.equal(d.state, DuganState.HITSTUN, 'a parry stuns him');
  assert.ok(d.hitstunMs >= DUGAN.parryStunMs);
  run(d, 1000, zed); assert.equal(hits.length, 0, 'the cancelled punch never lands');
  assert.equal(d.state, DuganState.APPROACH);
}

{ // Rage Punch fires once when health drops under 30 percent
  const { d } = make();
  const zed = { x: 470, y: 580, lift: 0 };
  d.state = DuganState.APPROACH; d.cooldownMs = 0;
  d.takeHit({ hpAfter: 40 });                              // 40/150 = 26.7 percent
  d.update(16, zed);
  assert.equal(d.move.id, 'rage'); assert.equal(d.telegraphTotalMs, 900);
  assert.equal(d.ragePending, false);
  d.takeHit({ hpAfter: 10 }); d.state = DuganState.APPROACH; d.cooldownMs = 0; d.update(16, zed);
  assert.notEqual(d.move.id, 'rage', 'only one Rage Punch');
}

{ // Running Shoulder Charge: lane charge into the wall leaves a long recovery; a landed hit ends it early
  const { d, hits } = make();
  d.x = 700; d.facing = 1;
  const zed = { x: 1100, y: 580, lift: 0 };
  d.cooldownMs = 0; d.chargeCdMs = 0; d.state = DuganState.APPROACH; d.update(16, zed);
  assert.equal(d.move.id, 'charge'); assert.equal(d.chargeWarning, true); assert.equal(d.telegraphTotalMs, 800);
  zed.x = 700; zed.y = 700;                                 // Zed side-steps out of the lane while he winds up
  run(d, 820, zed); assert.equal(d.state, DuganState.ATTACK);
  const x0 = d.x;
  run(d, 400, { x: 700, y: 700 }); assert.ok(d.x > x0 + 100, 'he runs along the lane');
  assert.ok(hits.length >= 1 && hits[0].attackId === hits[hits.length - 1].attackId, 'one attackId per charge so it lands once');
  for (let i = 0; i < 400 && d.state === DuganState.ATTACK; i++) d.update(16, { x: 700, y: 700 });
  assert.equal(d.state, DuganState.RECOVER); assert.equal(d.crashed, true, 'crashed into the wall');
  assert.ok(d.timer > 1700, 'long recovery: free punish');
  assert.ok(d.x <= 1240 && d.x >= 1100, 'stopped at the wall');
  assert.equal(d.crashSeq, 1);
}
{ // a charge that connects stops there (normal recovery)
  const { d } = make();
  d.x = 300; d.facing = 1; const zed = { x: 700, y: 580, lift: 0 };
  d.cooldownMs = 0; d.chargeCdMs = 0; d.state = DuganState.APPROACH; d.update(16, zed);
  run(d, 820, zed); assert.equal(d.state, DuganState.ATTACK);
  run(d, 100, zed); d.onHitLanded(); d.update(16, zed);
  assert.equal(d.state, DuganState.RECOVER); assert.ok(!d.crashed); assert.equal(d.timer <= DUGAN_MOVES.charge.recoverMs, true);
}

{ // waiting for a slot: he holds his ground and is flagged circling (failsafe will not read him as stuck)
  const slots = new AttackSlots(1); slots.tryAcquire('someone-else');
  const { d } = make({ slots });
  const zed = { x: 470, y: 580, lift: 0 };
  d.cooldownMs = 0; d.state = DuganState.APPROACH; d.update(16, zed);
  assert.equal(d.state, DuganState.APPROACH); assert.equal(d.circling, true);
  slots.release('someone-else'); d.update(16, zed);
  assert.equal(d.state, DuganState.TELEGRAPH);
}

{ // Ground Stomp hits a ring around his feet; death clears the slot
  const { d, hits, slots } = make();
  const zed = { x: 470, y: 580, lift: 50 };
  d.cooldownMs = 0; d.state = DuganState.APPROACH; d.update(16, zed);
  assert.equal(d.move.id, 'stomp');
  run(d, 700 + 200, zed);
  assert.ok(hits.length >= 1 && hits[0].hitbox.w === 190, 'wide ground ring');
  d.die(); assert.equal(d.alive, false); assert.equal(slots.count, 0);
}

// ---- through the EnemyManager: registers as a boss, spawns Dugan, hp and parry routed ----
{
  const ev = fakeEmitter(); const reg = [];
  ev.on(EVENTS.ENTITY_REGISTERED, (r) => reg.push(r));
  const m = new EnemyManager({ events: ev, getXRange: () => ({ min: 0, max: 1280 }) });
  const g = m.spawn({ id: 'brick-dugan-1', x: 900, y: 580, enemy: 'rust-brick-dugan', skin: 'rust-brick-dugan' });
  assert.ok(g instanceof BrickDugan);
  assert.equal(reg[0].boss, true); assert.equal(reg[0].maxHp, 150); assert.equal(reg[0].team, 'rust');
  ev.emit(EVENTS.DAMAGE_APPLIED, { targetId: 'brick-dugan-1', attackerId: 'player', amount: 18, hpAfter: 132, knockback: 380, hitstun: 28, landed: true });
  assert.equal(g.hp, 132); assert.equal(g.state, DuganState.IDLE, 'no hitstun from an ordinary hit');
  ev.emit(EVENTS.PARRY_STUN, { attackerId: 'brick-dugan-1', hitstun: 700 });
  assert.equal(g.state, DuganState.HITSTUN);
  const grunt = m.spawn({ id: 'grunt-2', x: 100, y: 500 });
  assert.notEqual(grunt.constructor, BrickDugan, 'plain spawns are still grunts');
  m.dispose();
}

console.log('BrickDugan tests passed');
