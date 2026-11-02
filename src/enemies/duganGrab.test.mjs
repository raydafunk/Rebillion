import assert from 'node:assert/strict';
import { fakeEmitter } from '../shared/fakeEmitter.mjs';
import { EVENTS } from '../shared/events.js';
import { BrickDugan, DuganState } from './BrickDugan.js';
import { DUGAN_MOVES } from './duganData.js';
import { EnemyManager } from './EnemyManager.js';
import { duganMoveMs } from './duganSprites.js';

const G = DUGAN_MOVES.grab.grab;
assert.equal(DUGAN_MOVES.grab.kind, 'strike', 'no parry ring on a move that cannot be parried');

function make(accept = true) {
  const log = [];
  const d = new BrickDugan({ id: 'dugan-1', x: 640, y: 580, rng: () => 0.9, getXRange: () => ({ min: 40, max: 1240 }),
    hooks: {
      onHitRequest: (r) => log.push(['hit', r]),
      onGrab: (r) => { log.push(['grab', r]); return accept; },
      onGrabSlam: (p) => log.push(['slam', p]),
      onGrabRelease: (p) => log.push(['release', p]),
    } });
  return { d, log };
}
const run = (d, ms, t, step = 16) => { for (let i = 0; i < ms; i += step) d.update(step, t); };
const start = (d, t) => { d.state = DuganState.APPROACH; d.cooldownMs = 0; d.meleeMs = 9999; d.update(16, t); };
const kinds = (log) => log.map((e) => e[0]);

{ // jump over it: an airborne Zed in reach is not grabbed (whiff)
  const { d, log } = make();
  const zed = { x: 700, y: 580, lift: 60 };
  start(d, zed); run(d, 1200, zed);
  assert.deepEqual(kinds(log), [], 'no grab request while Zed is in the air');
  assert.equal(d.grab === null || d.grab.phase === 'whiff', true);
}

{ // in reach + accepted: hold, then slam after holdMs, then he stays planted and recovers
  const { d, log } = make();
  const zed = { x: 700, y: 580, lift: 0 };
  start(d, zed); assert.equal(d.move.id, 'grab'); assert.equal(d.telegraphTotalMs, 600);
  run(d, 600 + 100, zed); assert.deepEqual(kinds(log), [], 'nothing during the wind-up');
  run(d, 150, zed);
  assert.deepEqual(kinds(log), ['grab'], 'grab request at reachAt');
  const req = log[0][1];
  assert.equal(req.targetId, 'player'); assert.equal(req.holdMs, G.holdMs); assert.equal(req.slamDamage, 40); assert.equal(req.slamKnockback, 640);
  assert.equal(req.slamDir, -1, 'Dugan at x 640 is nearer the left wall');
  assert.deepEqual(Object.keys(req.anchor()).sort(), ['facing', 'x', 'y']);
  d.x = 650; assert.equal(req.anchor().x, 650, 'anchor follows him');
  assert.equal(d.grab.phase, 'hold'); assert.equal(d.grabSeq, 1);
  run(d, G.holdMs - 100, zed); assert.deepEqual(kinds(log), ['grab'], 'still holding');
  run(d, 200, zed); assert.deepEqual(kinds(log), ['grab', 'slam'], 'slam when the hold ends');
  assert.equal(d.state, DuganState.ATTACK);
  run(d, G.slamLingerMs + 40, zed); assert.equal(d.state, DuganState.RECOVER);
  assert.ok(log.every((e) => e[0] !== 'hit'), 'the grab never sends an ordinary hit-request');
}
{ // out of reach: whiff, long recovery, no grab request
  const { d, log } = make();
  const zed = { x: 700, y: 580, lift: 0 };
  start(d, zed); run(d, 600 + 40, zed); zed.x = 900;     // Zed back-steps out of the short reach during the wind-up
  run(d, 600, zed);
  assert.deepEqual(kinds(log), []); assert.equal(d.state, DuganState.RECOVER); assert.equal(d.timer > 800, true, 'whiff: free punish');
}
{ // Zed answers accepted:false (downed / invulnerable): he whiffs
  const { d, log } = make(false);
  const zed = { x: 700, y: 580, lift: 0 };
  start(d, zed); run(d, 1300, zed);
  assert.deepEqual(kinds(log), ['grab']); assert.equal(d.grab, null); assert.equal(d.state, DuganState.RECOVER);
}
{ // Zed mashes free: Dugan is stunned (hitstun clip) and the move is over
  const { d, log } = make();
  const zed = { x: 700, y: 580, lift: 0 };
  start(d, zed); run(d, 800, zed); assert.equal(d.grab.phase, 'hold');
  const seq = d.hitSeq;
  d.grabBroken();
  assert.equal(d.state, DuganState.HITSTUN); assert.equal(d.timer, G.breakStunMs); assert.equal(d.hitSeq, seq + 1);
  run(d, 1000, zed); assert.deepEqual(kinds(log), ['grab'], 'no slam after a break');
  assert.equal(d.state, DuganState.APPROACH);
  d.grabBroken(); assert.notEqual(d.state, DuganState.HITSTUN, 'grabBroken does nothing when not holding');
}
{ // stunned or killed mid-hold: Zed is released
  let { d, log } = make();
  const zed = { x: 700, y: 580, lift: 0 };
  start(d, zed); run(d, 800, zed); d.takeHit({ hitstun: 300, parry: true });
  assert.deepEqual(kinds(log), ['grab', 'release']); assert.equal(log[1][1].reason, 'stunned');
  ({ d, log } = make());
  start(d, zed); run(d, 800, zed); d.die();
  assert.equal(log[1][1].reason, 'died'); assert.equal(d.grab, null);
}

// ---- the running grab: a charge that catches Zed holds and slams him ----
const CG = DUGAN_MOVES.charge.catchGrab;
assert.equal(DUGAN_MOVES.charge.kind, 'strike', 'no parry ring on the charge: it ends in a grab');
function charger(accept = true) {
  const { d, log } = make(accept);
  d.x = 300; d.facing = 1; d.cooldownMs = 0; d.chargeCdMs = 0; d.state = DuganState.APPROACH;
  return { d, log };
}
{ // caught in the lane, on the floor: grab (never a hit-request), hold, slam
  const { d, log } = charger();
  const zed = { x: 700, y: 580, lift: 0 };
  d.update(16, zed); assert.equal(d.move.id, 'charge');
  run(d, 800, zed); assert.equal(d.state, DuganState.ATTACK);
  for (let i = 0; i < 100 && !d.grab; i++) d.update(16, zed);
  assert.ok(d.grab && d.grab.phase === 'hold', 'he caught Zed'); assert.equal(d.charge, null, 'the run is over');
  assert.equal(d.grabSeq, 1);
  assert.ok(d.x < 700 && d.x > 500, 'he stops where he caught him');
  const req = log.find((e) => e[0] === 'grab')[1];
  assert.equal(req.holdMs, CG.holdMs); assert.equal(req.slamDamage, 40);
  assert.ok(!log.some((e) => e[0] === 'hit'), 'no plain hit');
  const x = d.x; run(d, 500, zed); assert.equal(d.x, x, 'planted while holding');
  run(d, CG.holdMs - 500 + 60, zed); assert.ok(log.some((e) => e[0] === 'slam'), 'slam at the end of the hold');
  run(d, CG.slamLingerMs + 40, zed); assert.equal(d.state, DuganState.RECOVER); assert.ok(!d.crashed);
  assert.equal(d.timer <= DUGAN_MOVES.charge.recoverMs, true, 'normal recovery after a catch');
}
{ // break free: stunned, same as the standing grab
  const { d } = charger();
  const zed = { x: 700, y: 580, lift: 0 };
  d.update(16, zed); run(d, 800, zed); for (let i = 0; i < 100 && !d.grab; i++) d.update(16, zed);
  d.grabBroken(); assert.equal(d.state, DuganState.HITSTUN); assert.equal(d.timer, CG.breakStunMs);
}
{ // a jump clears the charge: no grab, he runs on into the wall
  const { d, log } = charger();
  const zed = { x: 700, y: 580, lift: 60 };
  d.update(16, zed); run(d, 800, zed);
  for (let i = 0; i < 400 && d.state === DuganState.ATTACK; i++) d.update(16, zed);
  assert.deepEqual(kinds(log), []); assert.equal(d.crashed, true);
}
{ // Zed cannot be grabbed (invulnerable / down): he runs through and crashes
  const { d, log } = charger(false);
  const zed = { x: 700, y: 580, lift: 0 };
  d.update(16, zed); run(d, 800, zed);
  for (let i = 0; i < 400 && d.state === DuganState.ATTACK; i++) d.update(16, zed);
  assert.ok(log.every((e) => e[0] === 'grab')); assert.equal(d.grab, null); assert.equal(d.crashed, true);
}
{ // parry-stunned mid-hold: Zed released
  const { d, log } = charger();
  const zed = { x: 700, y: 580, lift: 0 };
  d.update(16, zed); run(d, 800, zed); for (let i = 0; i < 100 && !d.grab; i++) d.update(16, zed);
  d.takeHit({ hitstun: 300, parry: true }); assert.equal(log[log.length - 1][1].reason, 'stunned');
}

// ---- through the EnemyManager: GRAB -> GRAB_RESULT, slam, broken ----
function rig(accept) {
  const ev = fakeEmitter(); const seen = [];
  for (const n of [EVENTS.GRAB, EVENTS.GRAB_SLAM, EVENTS.GRAB_RELEASE]) ev.on(n, (p) => seen.push([n, p]));
  ev.on(EVENTS.GRAB, (r) => ev.emit(EVENTS.GRAB_RESULT, { attackerId: r.attackerId, targetId: 'player', accepted: accept }));
  const m = new EnemyManager({ events: ev, getXRange: () => ({ min: 40, max: 1240 }), rng: () => 0.9 });
  const d = m.spawn({ id: 'brick-dugan-1', x: 640, y: 580, enemy: 'rust-brick-dugan', skin: 'rust-brick-dugan' });
  return { ev, m, d, seen };
}
for (const accept of [true, false]) {
  const { m, d, seen, ev } = rig(accept);
  const zed = { x: 700, y: 580, lift: 0 };
  d.state = DuganState.APPROACH; d.cooldownMs = 0; d.meleeMs = 9999;
  for (let i = 0; i < 52; i++) m.update(16, zed);   // 832 ms: past the wind-up and the reach check, inside the hold
  assert.equal(d.move.id, 'grab');
  assert.equal(d.grab?.phase === 'hold', accept, accept ? 'accepted: holding' : 'declined: whiff');
  if (accept) {
    ev.emit(EVENTS.GRAB_BROKEN, { attackerId: 'brick-dugan-1' });
    assert.equal(d.state, DuganState.HITSTUN, 'GRAB_BROKEN stuns him');
    assert.equal(seen.filter((e) => e[0] === EVENTS.GRAB).length, 1);
  }
  m.dispose();
}
{ // full hold through the manager emits GRAB_SLAM
  const { m, d, seen } = rig(true);
  const zed = { x: 700, y: 580, lift: 0 };
  d.state = DuganState.APPROACH; d.cooldownMs = 0; d.meleeMs = 9999;
  for (let i = 0; i < 220; i++) m.update(16, zed);
  assert.ok(seen.some((e) => e[0] === EVENTS.GRAB_SLAM && e[1].attackerId === 'brick-dugan-1'));
  m.dispose();
}
console.log('Dugan grab tests passed');
