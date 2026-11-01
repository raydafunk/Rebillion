import test from 'node:test';
import assert from 'node:assert/strict';
import { createHealth, applyDamage } from './health.js';
import { createHitResolver } from './hitResolver.js';
import { fakeEmitter } from '../shared/fakeEmitter.mjs';
import { EVENTS } from '../shared/events.js';
import { ATTACK_VARIANTS, GRUNT } from '../enemies/gruntData.js';
import { EnemyManager } from '../enemies/EnemyManager.js';

test('health: pierce ignores the invulnerability window, but never a dead target', () => {
  const h = createHealth({ maxHp: 100, invulnMsAfterHit: 400 });
  assert.equal(applyDamage(h, 8, 0).applied, true);
  assert.equal(applyDamage(h, 8, 100).applied, false, 'normal hits are absorbed');
  assert.equal(applyDamage(h, 16, 100, 0, { pierce: true }).applied, true, 'piercing hit lands');
  h.hp = 1; applyDamage(h, 5, 200, 0, { pierce: true }); assert.equal(h.dead, true);
  assert.equal(applyDamage(h, 5, 300, 0, { pierce: true }).applied, false);
});

// Drive a real grunt through a full finisher attack against a player stand-in, with the player's guard chosen per moment.
function fight({ guardAt = () => null }) {
  const ev = fakeEmitter(); let clock = 0;
  const hurt = { x: -10, y: -80, w: 20, h: 80 };
  const me = { x: 40, y: 0, facing: -1, guard: null };
  const out = [];
  ev.on(EVENTS.DAMAGE_APPLIED, (p) => out.push({ ...p, t: clock }));
  const resolver = createHitResolver(ev, () => clock);
  ev.emit(EVENTS.ENTITY_REGISTERED, { id: 'player', team: 'player', maxHp: 100, hurtbox: hurt, getState: () => me });
  const finisher = ATTACK_VARIANTS.find((v) => v.id === 'finisher');
  const mgr = new EnemyManager({ events: ev, mixUp: true, rng: () => 0 });
  mgr.pickVariant = () => finisher;
  const g = mgr.spawn({ id: 'g1', x: 0, y: 0 });
  g.timer = 0; // skip spawn idle
  // Zed turns a negated hit into PARRY_STUN; EnemyManager stuns the attacker (which cancels the rest of its string).
  ev.on(EVENTS.DAMAGE_APPLIED, (p) => { if (p.targetId === 'player' && !p.landed) ev.emit(EVENTS.PARRY_STUN, { attackerId: p.attackerId, hitstun: 1200 }); });
  let attackStart = null;
  for (clock = 0; clock < 3000; clock += 10) {
    g.update(10, { x: me.x, y: 0 });
    if (g.state === 'attack' && attackStart === null) attackStart = clock;
    me.guard = attackStart === null ? null : guardAt(clock - attackStart);
    if (attackStart !== null && clock - attackStart > 700) break;
  }
  return { out, resolver, hp: resolver.getHealth('player').hp };
}

test('no guard: first jab lands, jab 2 is absorbed, the finisher and flurry PIERCE and land', () => {
  const { out, hp } = fight({});
  const landed = out.filter((d) => d.landed);
  assert.equal(landed.length, 1 + 1 + 2, 'jab 1 + finisher + 2 flurry hits');
  assert.equal(hp, 100 - (8 + 16 + 6 + 6));
});

test('missing the ring costs far more than a clean parry', () => {
  const missed = fight({}).hp;
  const parried = fight({ guardAt: (t) => (t >= 160 ? 'parry' : null) }).hp; // parry up before the finisher, jab 1 already landed
  assert.ok(parried > missed + 20, `parried ${parried} vs missed ${missed}`);
  assert.equal(parried, 100 - 8, 'only the first jab landed; the finisher was parried even though invuln was active');
});

test('a parry on the finisher stuns the grunt and cancels the flurry', () => {
  const { out } = fight({ guardAt: (t) => (t >= 160 ? 'parry' : null) });
  assert.equal(out.filter((d) => d.landed).length, 1);
  assert.ok(out.some((d) => !d.landed && d.t > 0), 'the parried finisher is reported as negated');
  assert.equal(out.filter((d) => !d.landed).length, 1, 'no flurry hits after the stun');
});

test('blocking the finisher only chips, but the flurry still comes', () => {
  const { hp, out } = fight({ guardAt: () => 'block' });
  assert.equal(out.filter((d) => d.landed).length, 4, 'jab 1, finisher, 2 flurry hits all chip');
  assert.ok(hp >= 100 - 14, `blocked total ${100 - hp} stays small`);
  assert.ok(hp < 100);
});
