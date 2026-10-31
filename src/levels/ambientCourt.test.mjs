import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readAmbient, roofDots, lerp } from './ambientData.js';

test('readAmbient has no court block unless the style asks for one', () => {
  assert.equal(readAmbient({ ambient: { period: 1920 } }).court, null);
  assert.equal(readAmbient({ ambient: { period: 1920, court: { hoop: [1, 2] } } }).court, null);
});

test('readAmbient reads a court block, drops malformed points and clamps counts', () => {
  const c = readAmbient({ ambient: { period: 1920, court: {
    hoop: [1, 2, 3, 4], screen: [5, 6, 7, 8], dish: [9, 10], sun: [11, 12],
    banners: [[1, 2], 'x'], lamps: [[3, NaN]], drones: 99, birds: -3,
  } } }).court;
  assert.deepEqual(c.banners, [[1, 2]]);
  assert.deepEqual(c.lamps, []);
  assert.equal(c.drones, 4);
  assert.equal(c.birds, 0);
});

test('roofDots spreads dots along the polyline, ends included', () => {
  const d = roofDots([[0, 0], [10, 0], [10, 10]], 5);
  assert.equal(d.length, 5);
  assert.deepEqual(d[0], [0, 0]);
  assert.deepEqual(d[4], [10, 10]);
  assert.deepEqual(roofDots([[0, 0]], 5), []);
  assert.equal(lerp(0, 10, 0.5), 5);
});

test('the Level 7 court animation stays above the lane (y 460 and below)', () => {
  const style = JSON.parse(readFileSync(new URL('../../content/levels/styles/level-07-copper-fang-courts.json', import.meta.url), 'utf8'));
  const c = readAmbient(style).court;
  assert.ok(c && c.roof.length === 3 && c.lamps.length === 2 && c.banners.length === 2);
  const lowest = Math.max(c.hoop[1], c.hoop[3], c.screen[1] + c.screen[3], c.dish[1], c.sun[1], ...c.roof.map((p) => p[1]), ...c.banners.map((p) => p[1] + 16), ...c.lamps.map((p) => p[1]));
  assert.ok(lowest <= 460);
});
