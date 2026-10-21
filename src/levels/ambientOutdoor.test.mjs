import test from 'node:test';
import assert from 'node:assert/strict';
import { tiledItems, canopyPuffs, spawnRange, laneSafeY, readAmbient, OUTDOOR_MAX_Y } from './ambientData.js';

test('tiledItems shifts the x of each item per copy and stops at the world edge', () => {
  assert.deepEqual(tiledItems([[100, 5], [900, 6]], 1000, 2500), [[100, 5], [900, 6], [1100, 5], [1900, 6], [2100, 5]]);
  assert.deepEqual(tiledItems(null, 1000, 2000), []);
  assert.deepEqual(tiledItems([[1]], 0, 2000), []);
});

test('canopyPuffs sit on the upper rim of the canopy', () => {
  const p = canopyPuffs([260, 324.5, 85], 3);
  assert.equal(p.length, 3);
  assert.ok(p.every((q) => q.y < 324.5 && Math.hypot(q.x - 260, q.y - 324.5) <= 85));
  assert.deepEqual(canopyPuffs(null, 3), []);
  assert.deepEqual(canopyPuffs([1, 1, 0], 3), []);
});

test('spawnRange follows the camera and stays inside the world', () => {
  assert.deepEqual(spawnRange(0, 1280, 4000), [0, 1520]);
  assert.deepEqual(spawnRange(3500, 1280, 4000), [3380, 4000]);
  assert.deepEqual(spawnRange(NaN, 1280, 4000), [0, 1520]);
});

test('laneSafeY never lets a piece into the lane', () => {
  assert.equal(laneSafeY(300), 300);
  assert.equal(laneSafeY(600), OUTDOOR_MAX_Y);
  assert.ok(OUTDOOR_MAX_Y < 460);
});

test('readAmbient reads and clamps an outdoor block', () => {
  assert.equal(readAmbient({ ambient: { period: 3840 } }).outdoor, null);
  const o = readAmbient({ ambient: { period: 3840, outdoor: { leaves: 99, birds: -3, trees: [[70, 347, 70]] } } }).outdoor;
  assert.equal(o.leaves, 14);
  assert.equal(o.birds, 0);
  assert.equal(o.trees.length, 1);
  assert.equal(o.puffsPerTree, 2);
  assert.ok(o.leafColors.length >= 2);
});

test('readAmbient reads a heights block and drops malformed points', () => {
  const a = readAmbient({ ambient: { period: 1920, heights: { windows: [[10, 20], 'x', [5]], laundry: [[1, 2]], notesPerWindow: 99 } } });
  assert.deepEqual(a.heights.windows, [[10, 20]]);
  assert.deepEqual(a.heights.laundry, [[1, 2]]);
  assert.equal(a.heights.notesPerWindow, 4);
  assert.equal(readAmbient({ ambient: { period: 1920 } }).heights, null);
});
