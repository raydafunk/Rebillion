import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BOSS_PROFILES, BAR, FILL, DRAIN, INTRO, DEATH, inRage, fillBand, fillColors, drainFrac, joltOffset, introState, pulse, rageMoment, deathState, fillX, readoutText } from './bossBarData.js';
import { DUGAN, DUGAN_ID } from '../enemies/duganData.js';

test('Dugan has a profile whose rage threshold matches his own', () => {
  const p = BOSS_PROFILES[DUGAN_ID];
  assert.ok(p && p.name === 'BRICK DUGAN');
  assert.equal(p.maxHpFallback, DUGAN.maxHp);
  if (DUGAN.rageThreshold !== undefined) assert.equal(p.rageThreshold, DUGAN.rageThreshold);
});

test('bands: high above rage, rage below 30%, critical at 10% and under', () => {
  assert.equal(fillBand(1, 0.3), 'high');
  assert.equal(fillBand(0.3, 0.3), 'high');
  assert.equal(fillBand(0.29, 0.3), 'rage');
  assert.equal(fillBand(0.1, 0.3), 'critical');
  assert.equal(fillBand(0, 0.3), 'critical');
  assert.ok(inRage(0.2, 0.3) && !inRage(0.3, 0.3));
});

test('colour crossfade runs from the old band to the new one', () => {
  assert.equal(fillColors('high', 'rage', 0).body, FILL.high.body);
  assert.equal(fillColors('high', 'rage', FILL.crossfadeMs).body, FILL.rage.body);
  assert.equal(fillColors('high', 'rage', 9999).top, FILL.rage.top);
});

test('cream drain chunk holds, then shrinks to the new health', () => {
  assert.equal(drainFrac(1, 0.8, 0), 1);
  assert.equal(drainFrac(1, 0.8, DRAIN.holdMs), 1);
  assert.ok(drainFrac(1, 0.8, DRAIN.holdMs + 100) < 1);
  assert.equal(drainFrac(1, 0.8, DRAIN.holdMs + DRAIN.shrinkMs), 0.8);
  assert.equal(drainFrac(0.5, 0.8, 0), 0.8); // healing: no chunk
  assert.equal(drainFrac(0.2, 0, 0, true), 0.2);
  assert.equal(drainFrac(0.2, 0, DRAIN.lethalShrinkMs, true), 0);
});

test('hit jolt decays to zero', () => {
  assert.equal(joltOffset(5, 0), 5);
  assert.equal(joltOffset(5, 110), 0);
  assert.ok(joltOffset(5, 40) < 5 && joltOffset(5, 40) > 0);
});

test('intro: wipe first, name, fill, then done', () => {
  const a = introState(0), z = introState(INTRO.totalMs);
  assert.equal(a.wipe, 0); assert.equal(a.fill, 0); assert.equal(a.done, false);
  assert.equal(z.wipe, 1); assert.equal(z.fill, 1); assert.equal(z.nameScale, 1); assert.equal(z.tab, 1); assert.equal(z.readout, 1); assert.equal(z.done, true);
  assert.ok(introState(INTRO.name.atMs).nameScale > 2);
});

test('pulse stays in 0..1 and is static for reduced motion', () => {
  for (let t = 0; t < 2000; t += 50) { const p = pulse(t, 1.6); assert.ok(p >= 0 && p <= 1); }
  assert.equal(pulse(123, 1.6, true), 0.5);
});

test('rage crossing flashes, pops the tab, shakes the plate, then settles', () => {
  const m0 = rageMoment(0), end = rageMoment(1000);
  assert.ok(m0.flash > 0.8 && m0.tabScale > 1.5);
  assert.equal(end.flash, 0); assert.equal(end.tabScale, 1); assert.equal(end.plateShake, 0); assert.equal(end.tagK, 1);
  const r = rageMoment(0, true);
  assert.equal(r.tabScale, 1); assert.equal(r.plateShake, 0);
});

test('death: shatters at 250 ms and is done at 700 ms; reduced motion just fades', () => {
  assert.equal(deathState(100).shattered, false);
  assert.equal(deathState(DEATH.shatterAtMs).shattered, true);
  assert.equal(deathState(DEATH.totalMs).done, true);
  const r = deathState(100, true);
  assert.equal(r.shattered, false); assert.equal(r.bar, 1);
  assert.equal(deathState(10000, true).done, true);
});

test('layout maths and readout', () => {
  assert.equal(fillX(0), BAR.fill.x);
  assert.equal(fillX(1), BAR.fill.x + BAR.fill.w);
  assert.equal(fillX(5), BAR.fill.x + BAR.fill.w);
  assert.equal(readoutText(98, 150, false), '98/150');
  assert.equal(readoutText(12.2, 150, true), '13/150 !');
  assert.equal(readoutText(-3, 150, false), '0/150');
  assert.ok(BAR.frame.x === BAR.block.x && BAR.frame.w === BAR.block.w);
});
