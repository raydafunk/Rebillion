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

import { rowShops, rowBulbs } from './ambientData.js';
import { readAmbient as readAmb } from './ambientData.js';

test('rowShops tiles shops across the world and flags chained ones', () => {
  const row = { period: 3840, shopX0: 8, shopPitch: 477, shopCount: 8, chainedCount: 4 };
  const s = rowShops(row, 4380);
  assert.equal(s[0].x, 8);
  assert.equal(s[0].chained, true);
  assert.equal(s[4].chained, false);
  assert.equal(s[8].x, 3840 + 8);
  assert.ok(s.every((q) => q.x < 4380));
  assert.deepEqual(rowShops(null, 4380), []);
});

test('rowBulbs follows the wire sag and tiles', () => {
  const row = { period: 3840, bulbX0: 34, bulbStep: 68, bulbCount: 56, bulbY: 14, bulbSag: 22, bulbSpan: 960 };
  const b = rowBulbs(row, 3840);
  assert.equal(b.length, 56);
  assert.ok(b.every((q) => q.y >= 14 && q.y <= 14 + 22));
  assert.deepEqual(rowBulbs({}, 3840), []);
});

test('readAmbient keeps a row block and clamps crazy', () => {
  const a = readAmb({ ambient: { period: 3840, row: { shopPitch: 477, crazy: 9 } } });
  assert.equal(a.row.crazy, 3);
  assert.equal(readAmb({ ambient: { period: 3840 } }).row, null);
});
