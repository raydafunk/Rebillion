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
  let clock = 0;
  createHitResolver(e2, () => clock);
  const me = { x: 0, y: 0, facing: 1, guard: null };
  e2.emit(EVENTS.ENTITY_REGISTERED, { id: 'player', team: 'player', maxHp: 100, hurtbox: hurt, getState: () => me });
  const atk = (id) => ({ attackerId: 'g', attackId: id, team: 'rust', hitbox: { x: 0, y: -40, w: 50, h: 40 },
    origin: { x: 20, y: 0 }, facing: -1, damage: 20, knockback: 200, hitstun: 300 });
  me.guard = 'parry'; e2.emit(EVENTS.HIT_REQUEST, atk('nparry')); e2.emit(EVENTS.HIT_REQUEST, atk('nparry'));
  assert.equal(out.length, 1, 'negated hit emits once');
  assert.deepEqual(out.map((o) => [o.amount, o.knockback, o.hitstun, o.hpAfter]), [[0, 0, 0, 100]]);
  me.guard = 'block'; e2.emit(EVENTS.HIT_REQUEST, atk('b'));
  assert.deepEqual([out[1].amount, out[1].hpAfter, out[1].knockback, out[1].hitstun], [5, 95, -50, 0]);
  assert.equal(hp.at(-1).hp, 95);
  // airborne: a jump over the attacker's reach makes ground melee pass underneath, and the swing can still land after landing
  me.guard = null; me.lift = 40; e2.emit(EVENTS.HIT_REQUEST, atk('air'));
  assert.equal(out.length, 2, 'no damage while airborne');
  clock = 1000; me.lift = 0; e2.emit(EVENTS.HIT_REQUEST, atk('air'));
  assert.equal(out.length, 3, 'same swing connects once grounded');
}
// Rage Special vs bosses
{
  const e3 = fakeEmitter(); const out = []; const died = [];
  e3.on(EVENTS.DAMAGE_APPLIED, (p) => out.push(p)); e3.on(EVENTS.ENTITY_DIED, (p) => died.push(p));
  let clock = 0;
  createHitResolver(e3, () => clock);
  const me = { x: 100, y: 0, facing: 1 }; const at = { x: 130, y: 0, facing: -1 };
  e3.emit(EVENTS.ENTITY_REGISTERED, { id: 'player', team: 'player', maxHp: 100, hurtbox: hurt, getState: () => me });
  e3.emit(EVENTS.ENTITY_REGISTERED, { id: 'boss', team: 'rust', boss: true, maxHp: 60, hurtbox: hurt, getState: () => at });
  e3.emit(EVENTS.ENTITY_REGISTERED, { id: 'grunt', team: 'rust', maxHp: 60, hurtbox: hurt, getState: () => ({ ...at, x: 135 }) });
  const sp = (id, extra = {}) => ({ attackerId: 'player', attackId: id, team: 'player', hitbox: { x: 10, y: -40, w: 60, h: 40 },
    origin: me, facing: 1, damage: 40, knockback: 300, hitstun: 300, special: true, bossDamageCap: 25, neverKills: true, ...extra });
  e3.emit(EVENTS.HIT_REQUEST, sp('s1'));
  const by = (id) => out.filter((o) => o.targetId === id);
  assert.equal(by('boss')[0].amount, 25, 'boss clamped to bossDamageCap'); assert.equal(by('boss')[0].hpAfter, 35);
  assert.equal(by('grunt')[0].amount, 40, 'normal enemy takes full damage');
  clock = 1000; e3.emit(EVENTS.HIT_REQUEST, sp('s2'));
  assert.equal(by('boss')[1].amount, 25); assert.equal(by('boss')[1].hpAfter, 10);
  clock = 2000; e3.emit(EVENTS.HIT_REQUEST, sp('s3'));
  assert.equal(by('boss')[2].amount, 9, 'clamped to hp-1'); assert.equal(by('boss')[2].hpAfter, 1);
  clock = 3000; e3.emit(EVENTS.HIT_REQUEST, sp('s4'));
  const last = by('boss')[3];
  assert.deepEqual([last.amount, last.hpAfter, last.landed, last.hitstun], [0, 1, true, 300], 'blow still lands at 1 hp');
  assert.equal(died.filter((d) => d.id === 'boss').length, 0, 'boss never dies to the special');
  assert.equal(died.filter((d) => d.id === 'grunt').length, 1, 'grunt (60hp) dies to 2nd 40-dmg hit... via full damage');
  // a normal (non-special) hit still kills the boss
  clock = 4000; e3.emit(EVENTS.HIT_REQUEST, sp('n1', { special: false, neverKills: false, bossDamageCap: undefined }));
  assert.equal(died.filter((d) => d.id === 'boss').length, 1);
}
console.log('combat tests passed');
