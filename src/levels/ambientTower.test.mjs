import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readAmbient } from './ambientData.js';

test('readAmbient has no tower block unless the style asks for one', () => {
  assert.equal(readAmbient({ ambient: { period: 1920 } }).tower, null);
  assert.equal(readAmbient({ ambient: { period: 1920, tower: { eye: [1] } } }).tower, null);
});

test('readAmbient reads a tower block, drops malformed points and clamps counts', () => {
  const t = readAmbient({ ambient: { period: 1920, tower: { eye: [1, 2], beacons: [[1, 2], 'x', [3, NaN]], embers: 99, motes: -3 } } }).tower;
  assert.deepEqual(t.eye, [1, 2]);
  assert.deepEqual(t.beacons, [[1, 2]]);
  assert.equal(t.embers, 24);
  assert.equal(t.motes, 0);
});

test('the Level 8 tower animation stays above the lane (y 460 and below)', () => {
  const style = JSON.parse(readFileSync(new URL('../../content/levels/styles/level-08-overseer-tower.json', import.meta.url), 'utf8'));
  const t = readAmbient(style).tower;
  assert.ok(t && t.cone.length === 4 && t.beacons.length === 4);
  const lowest = Math.max(t.eye[1], ...t.cone.map((p) => p[1]), ...t.beacons.map((p) => p[1]), ...t.skylineBeacons.map((p) => p[1]));
  assert.ok(lowest <= 460);
});

test('the Level 8 extras (sun, slits, twinkles) are read and stay above the lane', () => {
  const style = JSON.parse(readFileSync(new URL('../../content/levels/styles/level-08-overseer-tower.json', import.meta.url), 'utf8'));
  const t = readAmbient(style).tower;
  assert.ok(t.sun && t.slits.length > 0 && t.twinkles.length > 0 && t.sweeps >= 1 && t.birds >= 1);
  assert.ok(Math.max(t.sun[1], ...t.slits.map((p) => p[1] + 13), ...t.twinkles.map((p) => p[1] + 8)) <= 460);
});
