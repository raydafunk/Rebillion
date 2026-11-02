// Brick Dugan BLOCK: chance to raise it on Zed's swing, x0.25 damage through the real hit resolver, never while committed, cooldown, unblockable wave, guard break.
import assert from 'node:assert/strict';
import { fakeEmitter } from '../shared/fakeEmitter.mjs';
import { EVENTS } from '../shared/events.js';
import { createHitResolver } from '../combat/hitResolver.js';
import { COMBAT_DEFAULTS } from '../shared/combatData.js';
import { EnemyManager } from './EnemyManager.js';
import { BrickDugan, DuganState } from './BrickDugan.js';
import { DUGAN_BLOCK, DUGAN_ID } from './duganData.js';
import { duganPose, duganAnimDefs, duganAnimKey } from './duganSprites.js';

const zedSwing = (id, damage = 6) => ({
  attackerId: 'player', attackId: id, team: 'player', hitbox: { x: 10, y: -90, w: 80, h: 60 }, origin: { x: 360, y: 580 }, lane: 580, facing: -1,
  damage, knockback: 300, hitstun: 250, pierceInvuln: false,
});

function rig(rngVal = 0) {
  const events = fakeEmitter(); let clock = 0;
  const resolver = createHitResolver(events, () => clock);
  const mgr = new EnemyManager({ events, rng: () => rngVal, getXRange: () => ({ min: 0, max: 1280 }) });
  const d = mgr.spawn({ id: 'dugan-1', x: 300, y: 580, enemy: DUGAN_ID });
  d.cooldownMs = 99999; d.stompCdMs = 99999; d.chargeCdMs = 99999;   // no moves of his own unless a test wants them
  d.state = DuganState.APPROACH;
  const zed = { x: 360, y: 580 };
  const tick = (ms) => { for (let t = 0; t < ms; t += 16) { clock += 16; d.update(16, { x: zed.x, y: zed.y, lift: 0 }); } };
  const swing = (req) => events.emit(EVENTS.HIT_REQUEST, req);
  return { events, resolver, mgr, d, tick, swing, advance: (ms) => { clock += ms; } };
}

{ // chance: rng under 0.35 blocks, over does not; enraged uses 0.55
  let r = rig(0.3); r.swing(zedSwing('a')); assert.equal(r.d.state, DuganState.BLOCK); assert.equal(r.d.guard, 'block');
  r = rig(0.4); r.swing(zedSwing('a')); assert.equal(r.d.state, DuganState.APPROACH); assert.equal(r.d.guard, null);
  r = rig(0.5); r.d.enraged = true; r.swing(zedSwing('a')); assert.equal(r.d.state, DuganState.BLOCK, 'enraged: 0.55');
  r = rig(0.3); r.swing({ ...zedSwing('a'), origin: { x: 900, y: 580 } }); assert.equal(r.d.state, DuganState.APPROACH, 'swing out of reach: no reaction');
  r = rig(0.3); r.mgr.events.emit(EVENTS.HIT_REQUEST, { ...zedSwing('a'), team: 'rust' }); assert.equal(r.d.state, DuganState.APPROACH, 'only Zed\'s swings count');
}
{ // a swing re-sends its request every active frame: one roll per attackId
  const r = rig(0.9); r.swing(zedSwing('a')); r.d.rng = () => 0; r.swing(zedSwing('a')); assert.equal(r.d.state, DuganState.APPROACH, 'same swing is not re-rolled');
  r.swing(zedSwing('b')); assert.equal(r.d.state, DuganState.BLOCK);
}
{ // damage through the real resolver: x0.25, no hitstun or pushback; lasts blockMs then ends
  const r = rig(0); r.swing(zedSwing('a'));
  const dmg = []; r.events.on(EVENTS.DAMAGE_APPLIED, (p) => { if (p.targetId === 'dugan-1') dmg.push(p); });
  r.advance(1000);
  r.swing({ ...zedSwing('b', 12), lane: 580 });
  assert.equal(dmg.length, 1);
  assert.equal(dmg[0].amount, Math.max(1, Math.round(12 * COMBAT_DEFAULTS.BLOCK_DAMAGE_MULT)), 'blocked: quarter damage');
  assert.equal(dmg[0].hitstun, 0);
  assert.equal(r.d.state, DuganState.BLOCK, 'a blocked hit does not stun him');
  assert.equal(r.d.kx, 0, 'no pushback while blocking');
  r.tick(DUGAN_BLOCK.blockMs + 32);
  assert.equal(r.d.state, DuganState.APPROACH, 'block ends after blockMs');
  // unblocked comparison
  r.advance(1000);
  r.swing(zedSwing('c', 12));
  assert.equal(dmg[1].amount, 12, 'no guard: full damage');
}
{ // never while telegraphing, attacking (grab hold, stomp wave, charge), hit-stunned or dead
  for (const st of [DuganState.TELEGRAPH, DuganState.ATTACK, DuganState.HITSTUN, DuganState.DEAD]) {
    const r = rig(0); r.d.state = st; r.swing(zedSwing('a')); assert.equal(r.d.state, st, `no block during ${st}`);
  }
  let r = rig(0); r.d.grab = { phase: 'hold', holdLeft: 500, params: {} }; r.d.state = DuganState.RECOVER; r.swing(zedSwing('a')); assert.equal(r.d.state, DuganState.RECOVER, 'not during a grab hold');
  r = rig(0); r.d.charge = { travelled: 0 }; r.swing(zedSwing('a')); assert.equal(r.d.state, DuganState.APPROACH, 'not during a charge');
  r = rig(0); r.d.wave = { r: 0 }; r.swing(zedSwing('a')); assert.equal(r.d.state, DuganState.APPROACH, 'not during a stomp wave');
  r = rig(0); r.d.state = DuganState.RECOVER; r.swing(zedSwing('a')); assert.equal(r.d.state, DuganState.BLOCK, 'recovering he may block');
}
{ // cooldown: no second block until blockCooldownMs after the first started
  const r = rig(0); r.swing(zedSwing('a')); assert.equal(r.d.state, DuganState.BLOCK);
  r.tick(DUGAN_BLOCK.blockMs + 32); r.swing(zedSwing('b')); assert.equal(r.d.state, DuganState.APPROACH, 'still cooling down');
  r.tick(DUGAN_BLOCK.blockCooldownMs - DUGAN_BLOCK.blockMs); r.swing(zedSwing('c')); assert.equal(r.d.state, DuganState.BLOCK, 'ready again');
}
{ // an unblockable request (req.unblockable, like his own stomp wave) ignores the guard flag and does full damage
  const r = rig(0); r.swing(zedSwing('a'));
  const dmg = []; r.events.on(EVENTS.DAMAGE_APPLIED, (p) => { if (p.targetId === 'dugan-1') dmg.push(p); });
  r.advance(1000); r.swing({ ...zedSwing('u', 12), unblockable: true });
  assert.equal(dmg[0].amount, 12, 'unblockable ignores his guard');
}
{ // guard break: a heavy (>= 18) drops the block and staggers him; the follow-up lands in full
  const r = rig(0); r.swing(zedSwing('a'));
  assert.equal(r.d.state, DuganState.BLOCK);
  r.swing(zedSwing('k', 18));
  assert.equal(r.d.state, DuganState.HITSTUN); assert.equal(r.d.hitstunMs, DUGAN_BLOCK.guardBreakStunMs); assert.equal(r.d.guard, null);
  const dmg = []; r.events.on(EVENTS.DAMAGE_APPLIED, (p) => { if (p.targetId === 'dugan-1') dmg.push(p); });
  r.advance(1000); r.swing(zedSwing('n', 6)); assert.equal(dmg[0].amount, 6, 'full damage after the break');
  r.tick(DUGAN_BLOCK.guardBreakStunMs + 32); assert.equal(r.d.state, DuganState.APPROACH, 'stagger ends');
  const r2 = rig(0); r2.swing(zedSwing('a')); r2.swing(zedSwing('l', 12)); assert.equal(r2.d.state, DuganState.BLOCK, 'a light hit does not break the guard');
}
{ // sprites: pose and clips for both facings
  const defs = new Map(duganAnimDefs().map((x) => [x.key, x]));
  for (const f of ['east', 'west']) { assert.equal(defs.get(duganAnimKey('block', f)).frames.length, 9); }
  const r = rig(0); r.swing(zedSwing('a')); r.d.facing = 1;
  const p = duganPose(r.d); assert.equal(p.anim, duganAnimKey('block', 'east')); assert.equal(p.clip, 'block'); assert.equal(p.move, true);
  r.d.facing = -1; assert.equal(duganPose(r.d).anim, duganAnimKey('block', 'west'));
}
console.log('duganBlock tests passed');
