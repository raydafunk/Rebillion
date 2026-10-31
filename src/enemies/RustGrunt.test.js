import assert from 'node:assert/strict';
import { RustGrunt, GruntState as S } from './RustGrunt.js';
import { AttackSlots } from './AttackSlots.js';
import { GRUNT } from './gruntData.js';
import { COMBAT_DEFAULTS, GRUNT_ATTACK_COMBAT } from '../shared/combatData.js';

const run = (g, target, ms, step = 16) => { for (let t = 0; t < ms; t += step) g.update(step, target); };
const target = { x: 300, y: 0 };

// full cycle with telegraph before hit
{
  const hits = []; const states = [];
  const g = new RustGrunt({ id: 'g1', x: 0, y: 0, hooks: { onHitRequest: (h) => hits.push(h), onStateChange: (n) => states.push(n) } });
  run(g, target, 20000);
  assert.ok(states.indexOf('telegraph') >= 0 && states.indexOf('attack') > states.indexOf('telegraph'));
  assert.ok(hits.length >= 1);
  assert.equal(hits[0].team, 'rust'); assert.equal(hits[0].attackId, 'g1:1'); assert.equal(hits[0].facing, 1); assert.ok(hits[0].origin);
  assert.equal(hits[0].damage, GRUNT.attack.damage);
  assert.ok(GRUNT.telegraphMs >= 300);
}
// hit lands only after telegraph elapsed
{
  let t = 0, hitAt = null, telegraphAt = null;
  const g = new RustGrunt({
    id: 'g', x: 250, y: 0,
    hooks: { onHitRequest: () => { hitAt = t; }, onStateChange: (n) => { if (n === 'telegraph') telegraphAt = t; } },
  });
  for (; t < 5000 && hitAt === null; t += 16) g.update(16, target);
  assert.ok(hitAt - telegraphAt >= GRUNT.telegraphMs);
}
// hitbox flips with facing
{
  const g = new RustGrunt({ id: 'f', x: 100, y: 0 });
  g.facing = 1; const r = g.attackHitbox();
  g.facing = -1; const l = g.attackHitbox();
  assert.equal(r.x, 100 + GRUNT.attack.hitbox.x);
  assert.equal(l.x + l.w, 100 - GRUNT.attack.hitbox.x);
}
// hitstun interrupts telegraph, cancels hit, frees slot
{
  const slots = new AttackSlots(2); let hit = 0;
  const g = new RustGrunt({ id: 'h', x: 280, y: 0, slots, hooks: { onHitRequest: () => hit++ } });
  run(g, target, 800);
  assert.equal(g.state, S.TELEGRAPH);
  g.takeHit({ hitstun: 300, knockback: -100 });
  assert.equal(g.state, S.HITSTUN); assert.equal(slots.count, 0);
  run(g, target, 250); assert.equal(g.state, S.HITSTUN);
  run(g, target, 100); assert.notEqual(g.state, S.HITSTUN);
  assert.equal(hit, 0);
}
// interrupt mid-attack before hit frame: no hit
{
  let hit = 0;
  const g = new RustGrunt({ id: 'i', x: 280, y: 0, hooks: { onHitRequest: () => hit++ } });
  while (g.state !== S.ATTACK) g.update(16, target);
  g.takeHit({ hitstun: 200 }); run(g, target, 400); assert.equal(hit, 0);
}
// death
{
  const slots = new AttackSlots(2); let died = 0;
  const g = new RustGrunt({ id: 'd', x: 280, y: 0, slots, hooks: { onDeath: () => died++ } });
  run(g, target, 800); g.die(); g.die();
  assert.equal(g.state, S.DEAD); assert.equal(slots.count, 0); assert.equal(died, 1);
  g.takeHit({ hitstun: 100 }); assert.equal(g.state, S.DEAD);
}
// attacker cap: 5 grunts around target, never more than 2 attacking
{
  const slots = new AttackSlots(2); let maxAtk = 0, attacks = 0;
  const gs = Array.from({ length: 5 }, (_, i) => new RustGrunt({ id: 'c' + i, x: 150 + i * 40, y: i * 10 - 20, slots, hooks: { onHitRequest: () => attacks++ } }));
  for (let t = 0; t < 20000; t += 16) {
    gs.forEach((g) => g.update(16, target));
    const n = gs.filter((g) => g.state === S.TELEGRAPH || g.state === S.ATTACK).length;
    maxAtk = Math.max(maxAtk, n);
    assert.ok(n <= 2);
  }
  assert.equal(maxAtk, 2); assert.ok(attacks > 2);
  assert.ok(gs.every((g) => g.alive));
}
// gruntData numbers come from combatData.js (single source)
{
  const c = GRUNT_ATTACK_COMBAT.attack;
  assert.equal(GRUNT.maxHp, COMBAT_DEFAULTS.GRUNT_MAX_HP);
  assert.equal(GRUNT.attack.damage, c.damage);
  assert.equal(GRUNT.attack.knockback, c.knockback);
  assert.equal(GRUNT.attack.hitstun, c.hitstun);
}
// jab string: three hit-requests in order, distinct attackIds, spacing from the data table
{
  const hits = []; let t = 0, atkStart = null;
  const g = new RustGrunt({ id: 'j', x: 280, y: 0, hooks: {
    onHitRequest: (h) => hits.push({ ...h, t }),
    onStateChange: (n) => { if (n === 'attack') atkStart = t; },
  } });
  for (; t < 3000 && hits.length < 3; t += 4) g.update(4, target);
  assert.equal(GRUNT.jabString.length, 3);
  assert.equal(hits.length, 3);
  assert.deepEqual(hits.map((h) => h.attackId), ['j:1', 'j:2', 'j:3']);
  assert.equal(new Set(hits.map((h) => h.attackId)).size, 3);
  for (let i = 0; i < 3; i++) {
    assert.equal(hits[i].damage, GRUNT_ATTACK_COMBAT.attack.damage);
    assert.equal(hits[i].knockback, GRUNT_ATTACK_COMBAT.attack.knockback);
    assert.equal(hits[i].hitstun, GRUNT_ATTACK_COMBAT.attack.hitstun);
    const want = GRUNT.jabString[i].atMs;
    assert.ok(hits[i].t - atkStart >= want && hits[i].t - atkStart < want + 12);
  }
  assert.ok(GRUNT.jabString[2].atMs < GRUNT.attackMs);
}
// hitstun mid-string cancels the remaining jabs
{
  let t = 0; const hits = [];
  const g = new RustGrunt({ id: 'k', x: 280, y: 0, hooks: { onHitRequest: (h) => hits.push(h) } });
  while (hits.length < 1) { g.update(4, target); t += 4; }
  g.takeHit({ hitstun: 200 }); run(g, target, 400);
  assert.equal(hits.length, 1);
}
console.log('RustGrunt tests passed');
