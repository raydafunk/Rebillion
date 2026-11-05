import test from 'node:test';
import assert from 'node:assert/strict';
import { RAGE_IMPACT_FX as FX } from './rageImpactFxData.js';

const nums = (o, path = '') => Object.entries(o).flatMap(([k, v]) =>
  typeof v === 'number' ? [[path + k, v]] : (v && typeof v === 'object') ? nums(v, path + k + '.') : []);

test('all numbers finite', () => {
  for (const [k, v] of nums(FX)) assert.ok(Number.isFinite(v), k);
});

test('shake and kill dust numbers positive', () => {
  for (const [k, v] of nums({ shake: FX.shake, killDust: FX.killDust })) {
    if (k.endsWith('gravity')) continue; // may be negative
    if (k.endsWith('alphaEnd')) continue; // fades to 0
    if (/colors\.\d+$/.test(k)) continue; // colour ints
    assert.ok(v > 0, k);
  }
});

test('flash alpha within photosensitivity cap', () => {
  for (const m of Object.values(FX.shake)) assert.ok(m.flash.alpha <= 0.55);
  assert.ok(FX.reduced.flashAlphaMax <= 0.25);
});

test('uppercut >= kick on every strength axis', () => {
  const k = FX.shake.rageKick, u = FX.shake.rageUppercut;
  for (const key of ['durationMs', 'intensity', 'hitStopMs']) assert.ok(u[key] >= k[key], key);
  assert.ok(u.flash.alpha >= k.flash.alpha);
});

test('ranges ordered and colour lists match', () => {
  const d = FX.killDust;
  assert.ok(d.radiusMax >= d.radiusMin && d.speedMax >= d.speedMin && d.lifetimeMaxMs >= d.lifetimeMinMs);
  assert.equal(d.colors.length, d.colorWeights.length);
});
