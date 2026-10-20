import test from 'node:test';
import assert from 'node:assert/strict';
import { tiledXs, readAmbient } from './ambientData.js';

test('tiledXs repeats positions every period and stops at the world edge', () => {
  assert.deepEqual(tiledXs([100, 900], 1000, 2500), [100, 900, 1100, 1900, 2100]);
  assert.deepEqual(tiledXs([100], 1000, 100), []);
  assert.deepEqual(tiledXs(null, 1000, 2000), []);
  assert.deepEqual(tiledXs([1], 0, 2000), []);
});

test('readAmbient needs a period and fills defaults', () => {
  assert.equal(readAmbient(undefined), null);
  assert.equal(readAmbient({ ambient: {} }), null);
  const a = readAmbient({ ambient: { period: 3840, lit: [350], dustPerBeam: 99 } });
  assert.equal(a.period, 3840);
  assert.deepEqual(a.lit, [350]);
  assert.deepEqual(a.dark, []);
  assert.equal(a.dustPerBeam, 12);
  assert.equal(a.windowH, 170);
});
