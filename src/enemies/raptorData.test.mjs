import test from 'node:test';
import assert from 'node:assert/strict';
import { RAPTOR, RAPTOR_MOVES, RAPTOR_ID, RAPTOR_AIR_LIFT, pickRaptorMove } from './raptorData.js';
import { ROYCE } from './royceData.js';
import { GLITCH } from './glitchData.js';

const rdy = (o = {}) => ({ dive: true, punch: true, falcon: true, rush: false, ...o });
const none = { dive: false, punch: false, falcon: false, rush: false };
const ctx = (o) => ({ dist: 400, dy: 0, lift: 0, ready: rdy(), lastId: null, ...o });

test('tougher than the content file, Royce and Kane, and the fastest', () => {
  assert.ok(RAPTOR.maxHp > 130 && RAPTOR.maxHp >= 300 && RAPTOR.maxHp > ROYCE.maxHp);
  assert.ok(RAPTOR.moveSpeed > GLITCH.moveSpeed && RAPTOR.moveSpeed > ROYCE.moveSpeed);
  assert.equal(RAPTOR_ID, 'rust-raptor');
});
test('telegraphs and names match mini-bosses.json', () => {
  const order = ['dive', 'punch', 'falcon', 'rush'];
  assert.deepEqual(Object.keys(RAPTOR_MOVES), order);
  assert.deepEqual(order.map((k) => RAPTOR_MOVES[k].telegraphMs), [450, 420, 800, 350]);
  assert.deepEqual(order.map((k) => RAPTOR_MOVES[k].name), ['Dive Kick', '4-Hit Punch', 'Falcon Drop', '6-Hit Charge']);
  assert.equal(RAPTOR.moveSpeed, 135);
});
test('6-Hit Charge numbers and pacing', () => {
  const r = RAPTOR_MOVES.rush;
  assert.equal(r.hits.length, 6); assert.deepEqual(r.hits.map((h) => h.damage), [3, 3, 3, 3, 3, 6]);
  for (let i = 1; i < 6; i++) assert.ok(r.hits[i].atMs - r.hits[i - 1].atMs >= 100 && r.hits[i].atMs - r.hits[i - 1].atMs <= 130);
  assert.ok(r.runSpeed >= 320 && r.runSpeed <= 380 && r.runMaxMs <= 1600 && r.stopPx === 130);
  assert.equal(RAPTOR.rushCooldownMs, 7000); assert.equal(RAPTOR.rushFirstMs, 3000);
  assert.ok(r.minRange > RAPTOR_MOVES.punch.maxRange, 'rush is the gap-closer, punch owns close range');
});
test('rush is picked from afar, never up close, never back to back', () => {
  assert.equal(pickRaptorMove(ctx({ dist: 450, ready: { ...none, rush: true } }), () => 0).id, 'rush');
  assert.equal(pickRaptorMove(ctx({ dist: 200, ready: { ...none, rush: true } }), () => 0), null, 'too close for the rush');
  assert.equal(pickRaptorMove(ctx({ dist: 700, ready: { ...none, rush: true } }), () => 0), null, 'too far for a run to cover');
  assert.equal(pickRaptorMove(ctx({ dist: 450, lastId: 'rush', ready: { ...none, rush: true } }), () => 0), null);
  assert.equal(pickRaptorMove(ctx({ dist: 150, ready: rdy({ rush: true }) }), () => 0).id, 'punch');
});
test('picker never returns the run alone and close range picks the 4-hit', () => {
  for (let i = 0; i <= 20; i++) for (const dist of [50, 150, 199, 260, 400, 650, 700]) for (const lastId of [null, 'dive', 'punch', 'falcon']) {
    const m = pickRaptorMove(ctx({ dist, lastId, ready: rdy({ rush: true }) }), () => i / 20);
    assert.ok(m === null || RAPTOR_MOVES[m.id] === m, 'a full move');
    assert.notEqual(m && m.id, 'run');
    if (m && m.id === 'rush') assert.ok(dist >= 260 && dist <= 650 && m.hits.length === 6);
  }
  assert.ok(!Object.keys(RAPTOR_MOVES).includes('run'));
  for (const r of [0, 0.5, 0.99]) assert.equal(pickRaptorMove(ctx({ dist: 120, ready: rdy({ rush: true }) }), () => r).id, 'punch');
});
test('move picker', () => {
  assert.equal(pickRaptorMove(ctx({ dist: 150 }), () => 0.9).id, 'punch', 'in his face: 4-hit punch');
  assert.notEqual(pickRaptorMove(ctx({ dist: 150, dy: 80 }), () => 0.9).id, 'punch', 'punch needs Zed in his lane');
  assert.equal(pickRaptorMove(ctx({ ready: { ...none, dive: true } }), () => 0).id, 'dive');
  assert.equal(pickRaptorMove(ctx({ ready: { ...none, falcon: true } }), () => 0).id, 'falcon');
  assert.equal(pickRaptorMove(ctx({ dist: 700, ready: { ...none, falcon: true } }), () => 0), null, 'falcon out of range');
  assert.equal(pickRaptorMove(ctx({ dist: 400 }), () => 0.99).id, 'falcon', 'weighted pick reaches the last move');
  assert.equal(pickRaptorMove(ctx({ dist: 400 }), () => 0).id, 'dive');
  assert.equal(pickRaptorMove(ctx({ lastId: 'dive', ready: { ...none, dive: true } }), () => 0), null, 'never the same move twice');
  assert.equal(pickRaptorMove(ctx({ lift: RAPTOR_AIR_LIFT }), () => 0), null, 'Zed airborne: ground moves would miss');
  assert.equal(pickRaptorMove(ctx({ ready: none }), () => 0), null);
});

import { RAPTOR_BLOCK } from './raptorData.js';
{ // BLOCK numbers: a readable, fair window
  assert.ok(RAPTOR_BLOCK.holdMs >= 900 && RAPTOR_BLOCK.holdMs <= 1200);
  assert.ok(RAPTOR_BLOCK.reactRangePx > 100 && RAPTOR_BLOCK.reactRangePx <= 200);
  assert.ok(RAPTOR_BLOCK.cooldownMs >= 3 * RAPTOR_BLOCK.holdMs, 'not a permanent wall');
  assert.ok(RAPTOR_BLOCK.recoverMs > 0 && Object.isFrozen(RAPTOR_BLOCK));
  assert.ok(!('guardBreakDamage' in RAPTOR_BLOCK), 'no guard break');
  assert.equal(Object.keys(RAPTOR_MOVES).includes('block'), false, 'block is a reaction state, not a picked move');
}
