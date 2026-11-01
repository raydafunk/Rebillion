import test from 'node:test';
import assert from 'node:assert/strict';
import { GRUNT, ATTACK_VARIANTS, PARRY_CUE_LEAD_MS, FLURRY, pickAttackVariant } from './gruntData.js';
import { RustGrunt, GruntState } from './RustGrunt.js';
import { PARRY } from '../player/moves.js';

const seeded = (seed) => () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const byId = (id) => ATTACK_VARIANTS.find((v) => v.id === id);

test('variant table: every hit fits inside its attack state and the mark points at a real hit', () => {
  for (const v of ATTACK_VARIANTS) {
    assert.ok(v.hits.length >= 1 && v.markIndex < v.hits.length, v.id);
    assert.ok(v.hits[v.hits.length - 1].atMs < v.attackMs, v.id);
    assert.ok(v.attackMs >= GRUNT.attackMs, `${v.id} is never shorter than the plain string`);
  }
});

test('parry is not always on the first hit: finisher variants aim at the heavy third hit', () => {
  const f = byId('finisher');
  assert.equal(f.markIndex, 2);
  assert.equal(f.hits[2].pierceInvuln, true);
  assert.ok(f.hits[2].damage > f.hits[0].damage && f.hits[2].knockback > f.hits[0].knockback);
  assert.equal(f.hits[0].damage, f.hits[1].damage); // first two are plain, blockable jabs
  assert.ok(ATTACK_VARIANTS.some((v) => v.markIndex === 0) && ATTACK_VARIANTS.some((v) => v.markIndex > 0));
});

test('hold variants wait longer before swinging, but keep the same wind-up cue start', () => {
  assert.ok(byId('hold').holdMs > 0 && byId('hold-finisher').holdMs > 0);
  assert.equal(byId('string').holdMs, 0);
});

test('picker: never repeats back to back, covers all variants, honours weights roughly', () => {
  const rng = seeded(7); let last = null; const n = {};
  for (let i = 0; i < 4000; i++) { const v = pickAttackVariant(rng, last); assert.notEqual(v.id, last); last = v.id; n[v.id] = (n[v.id] || 0) + 1; }
  for (const v of ATTACK_VARIANTS) assert.ok(n[v.id] > 200, `${v.id} appears (${n[v.id]})`);
  assert.ok(n.string + n.finisher > n.hold + n['hold-finisher']); // weights 3,3 vs 2,1
});

test('RustGrunt without a picker keeps the plain 1-2-3 (no behaviour change)', () => {
  const g = new RustGrunt({ id: 'g1', x: 0, y: 0 });
  assert.equal(g.variant.id, 'string');
  assert.equal(g.cueClockMs, null);
});

function runAttack(variantId) {
  const hits = [];
  const g = new RustGrunt({ id: 'v', x: 0, y: 0, hooks: { onHitRequest: (r) => hits.push({ ...r, t }) }, pickVariant: () => byId(variantId) });
  var t = 0;
  const target = { x: 40, y: 0 };
  const marks = {};
  while (t < 3000 && g.state !== GruntState.RECOVER) {
    g.update(10, target); t += 10;
    if (g.state === GruntState.TELEGRAPH && marks.telegraphAt === undefined) marks.telegraphAt = t;
    if (g.state === GruntState.ATTACK && marks.attackAt === undefined) marks.attackAt = t;
  }
  return { g, hits, marks };
}

test('finisher variant emits two light jabs, the heavy hit, then the flurry', () => {
  const { hits, marks, g } = runAttack('finisher');
  assert.equal(hits.length, 3 + FLURRY.count);
  assert.deepEqual(hits.map((h) => h.damage), byId('finisher').hits.map((h) => h.damage));
  assert.equal(g.lastVariantId, 'finisher');
  assert.ok(hits[2].t - marks.attackAt >= byId('finisher').hits[2].atMs - 10);
});

test('hold variant delays the first hit by holdMs compared to the plain string', () => {
  const a = runAttack('string'), b = runAttack('hold');
  const d = b.hits[0].t - a.hits[0].t;
  assert.ok(Math.abs(d - byId('hold').holdMs) <= 20, `delay ${d}`);
});

test('cue timing: the ring closes PARRY_CUE_LEAD_MS before the hit to parry, inside the parry window', () => {
  for (const v of ATTACK_VARIANTS) {
    const g = new RustGrunt({ id: 'c', pickVariant: () => v });
    g._beginTelegraph();
    const hitClock = g.telegraphTotalMs + v.hits[v.markIndex].atMs;
    assert.equal(hitClock - g.parryMarkMs, PARRY_CUE_LEAD_MS, v.id);
    assert.ok(PARRY.window * 1000 / 60 >= PARRY_CUE_LEAD_MS, 'a press at the mark covers the hit');
  }
});
