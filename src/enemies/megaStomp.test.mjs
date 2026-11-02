// Mega Stomp through the real hit resolver: the wave hits a grounded Zed at any depth, an airborne Zed is safe, a block does nothing, a parry does nothing (unparryable).
import assert from 'node:assert/strict';
import { fakeEmitter } from '../shared/fakeEmitter.mjs';
import { EVENTS } from '../shared/events.js';
import { createHitResolver } from '../combat/hitResolver.js';
import { PLAYER_ID } from '../shared/combatData.js';
import { BrickDugan, DuganState } from './BrickDugan.js';
import { AttackSlots } from './AttackSlots.js';

function rig(zedState) {
  const ev = fakeEmitter(); let clock = 0;
  const resolver = createHitResolver(ev, () => clock);
  const zed = { x: 700, y: 640, lane: 640, facing: 1, guard: null, lift: 0, ...zedState };
  ev.emit(EVENTS.ENTITY_REGISTERED, { id: PLAYER_ID, team: 'player', maxHp: 100, hurtbox: { x: -20, y: -90, w: 40, h: 90 }, getState: () => zed });
  const d = new BrickDugan({ id: 'dugan-1', x: 300, y: 520, slots: new AttackSlots(3), rng: () => 0.9, getXRange: () => ({ min: 0, max: 1280 }),
    hooks: { onHitRequest: (r) => ev.emit(EVENTS.HIT_REQUEST, r) } });
  d.stompCdMs = 0; d.cooldownMs = 0; d.state = DuganState.APPROACH;
  const dmg = [];
  ev.on(EVENTS.DAMAGE_APPLIED, (p) => { if (p.targetId === PLAYER_ID) dmg.push(p); });
  const target = () => ({ x: zed.x, y: zed.lane, lift: zed.lift });
  const play = (ms) => { for (let t = 0; t < ms; t += 16) { clock += 16; d.update(16, target()); } };
  return { d, zed, dmg, resolver, play };
}

{ // grounded and 120 px deeper in the lane than Dugan: depth does not save him
  const { d, resolver, dmg, play } = rig({});
  d.update(16, { x: 700, y: 640, lift: 0 });
  assert.equal(d.move.id, 'stomp', 'he picks the stomp from range');
  play(2500);
  assert.equal(dmg.length, 1, 'hit exactly once');
  assert.equal(dmg[0].amount, 14); assert.equal(dmg[0].landed, true);
  assert.equal(resolver.getHealth(PLAYER_ID).hp, 86);
  assert.ok(dmg[0].knockback > 0, 'pushed away from Dugan');
}
{ // airborne as the front passes (feet 40 px up): safe
  const { d, zed, resolver, dmg, play } = rig({ lift: 40 });
  d.update(16, { x: 700, y: 640, lift: 40 });
  play(2500);
  assert.equal(dmg.length, 0); assert.equal(resolver.getHealth(PLAYER_ID).hp, 100);
}
{ // jump timed to the front: up while it passes (about 1.2 s after the wind-up starts, front reaches 400 px at ~1.32 s), then down
  const { d, zed, resolver, play } = rig({});
  d.update(16, { x: 700, y: 640, lift: 0 });
  play(1050);                      // wind-up done, slam happened, front is on its way
  zed.lift = 45; play(700);        // in the air across the front's arrival
  zed.lift = 0; play(1500);
  assert.equal(resolver.getHealth(PLAYER_ID).hp, 100, 'a jump over the front takes no damage');
}
{ // blocking does not help: full damage
  const { d, resolver, dmg, play } = rig({ guard: 'block' });
  d.update(16, { x: 700, y: 640, lift: 0 });
  play(2500);
  assert.equal(dmg[0].amount, 14, 'block does not reduce the wave');
  assert.equal(resolver.getHealth(PLAYER_ID).hp, 86);
}
{ // a parry does NOT negate it (unparryable): full damage, the answer is to jump
  const { d, resolver, dmg, play } = rig({ guard: 'parry' });
  d.update(16, { x: 700, y: 640, lift: 0 });
  play(2500);
  assert.equal(dmg[0].amount, 14, 'a parry does not help');
  assert.equal(resolver.getHealth(PLAYER_ID).hp, 86);
}
console.log('Mega Stomp resolver tests passed');
