import assert from 'node:assert/strict';
import { createHealth, applyDamage, resetHealth } from './health.js';
import { createHitResolver } from './hitResolver.js';
import { fakeEmitter } from '../shared/fakeEmitter.mjs';
import { EVENTS } from '../shared/events.js';

// health
let h = createHealth({ maxHp: 30, invulnMsAfterHit: 100 });
let r = applyDamage(h, 10, 0, 200);
assert.equal(h.hp, 20); assert.ok(r.applied && !r.died); assert.equal(h.hitstunUntil, 200);
assert.equal(applyDamage(h, 10, 50).applied, false, 'invulnerable');
assert.equal(applyDamage(h, 100, 100).died, true);
assert.equal(h.hp, 0); assert.equal(applyDamage(h, 5, 999).applied, false, 'dead');
resetHealth(h); assert.equal(h.hp, 30); assert.equal(h.dead, false);

// resolver
const ev = fakeEmitter(); let t = 0;
const log = [];
for (const n of Object.values(EVENTS)) ev.on(n, (p) => log.push([n, p]));
createHitResolver(ev, () => t);
const pos = { player: { x: 100, y: 0, facing: 1 }, g: { x: 140, y: 0, facing: -1 } };
const hurt = { x: -10, y: -40, w: 20, h: 40 };
ev.emit(EVENTS.ENTITY_REGISTERED, { id: 'player', team: 'player', maxHp: 100, hurtbox: hurt, getState: () => pos.player });
ev.emit(EVENTS.ENTITY_REGISTERED, { id: 'g', team: 'rust', maxHp: 20, hurtbox: hurt, getState: () => pos.g });
const count = (n) => log.filter((l) => l[0] === n).length;
assert.equal(count(EVENTS.PLAYER_HEALTH_CHANGED), 1);

const punch = (facing, id) => ({ attackerId: 'player', attackId: id, team: 'player',
  hitbox: { x: 10, y: -40, w: 40, h: 40 }, origin: pos.player, facing, damage: 10, knockback: 200, hitstun: 300 });
ev.emit(EVENTS.HIT_REQUEST, punch(-1, 'a1'));
assert.equal(count(EVENTS.DAMAGE_APPLIED), 0, 'facing flip: hitbox points away');
ev.emit(EVENTS.HIT_REQUEST, punch(1, 'a2'));
ev.emit(EVENTS.HIT_REQUEST, punch(1, 'a2'));
assert.equal(count(EVENTS.DAMAGE_APPLIED), 1, 'same attack hits once');
const d = log.find((l) => l[0] === EVENTS.DAMAGE_APPLIED)[1];
assert.equal(d.hpAfter, 10); assert.equal(d.knockback, 200);
ev.emit(EVENTS.HIT_REQUEST, punch(1, 'a3'));
assert.equal(count(EVENTS.ENTITY_DIED), 1);
// friendly fire off
ev.emit(EVENTS.HIT_REQUEST, { ...punch(1, 'a4'), attackerId: 'x', team: 'rust', origin: { x: 90, y: 0 } });
assert.equal(count(EVENTS.PLAYER_HEALTH_CHANGED), 2);
assert.equal(log.at(-1)[1].hp, 90);
// guard
{
  const e2 = fakeEmitter(); const out = [];
  e2.on(EVENTS.DAMAGE_APPLIED, (p) => out.push(p));
  const hp = []; e2.on(EVENTS.PLAYER_HEALTH_CHANGED, (p) => hp.push(p));
  createHitResolver(e2, () => 0);
  const me = { x: 0, y: 0, facing: 1, guard: null };
  e2.emit(EVENTS.ENTITY_REGISTERED, { id: 'player', team: 'player', maxHp: 100, hurtbox: hurt, getState: () => me });
  const atk = (id) => ({ attackerId: 'g', attackId: id, team: 'rust', hitbox: { x: 0, y: -40, w: 50, h: 40 },
    origin: { x: 20, y: 0 }, facing: -1, damage: 20, knockback: 200, hitstun: 300 });
  for (const g of ['dodge', 'parry']) {
    me.guard = g; e2.emit(EVENTS.HIT_REQUEST, atk('n' + g)); e2.emit(EVENTS.HIT_REQUEST, atk('n' + g));
  }
  assert.equal(out.length, 2, 'negated hits emit once each');
  assert.deepEqual(out.map((o) => [o.amount, o.knockback, o.hitstun, o.hpAfter]), [[0, 0, 0, 100], [0, 0, 0, 100]]);
  me.guard = 'block'; e2.emit(EVENTS.HIT_REQUEST, atk('b'));
  assert.deepEqual([out[2].amount, out[2].hpAfter, out[2].knockback, out[2].hitstun], [5, 95, -50, 0]);
  assert.equal(hp.at(-1).hp, 95);
}
console.log('combat tests passed');
