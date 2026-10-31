import test from 'node:test';
import assert from 'node:assert/strict';
import { readAmbient, flagPhase, tiledItems } from './ambientData.js';

test('readAmbient has no market block unless the style asks for one', () => {
  assert.equal(readAmbient({ ambient: { period: 1920 } }).market, null);
});

test('readAmbient reads a market block, drops malformed points and clamps counts', () => {
  const m = readAmbient({ ambient: { period: 1920, market: {
    steam: [[258, 352], 'x', [5]], puffsPerPot: 99, flags: [[30, 52, 1], [NaN, 2]],
    hangers: [[158, 246, 22, 0], [1, 2]], neighbours: [[170, 300, 2]], visors: [[4, 318]],
  } } }).market;
  assert.deepEqual(m.steam, [[258, 352]]);
  assert.equal(m.puffsPerPot, 8);
  assert.deepEqual(m.flags, [[30, 52, 1]]);
  assert.deepEqual(m.hangers, [[158, 246, 22, 0]]);
  assert.deepEqual(m.neighbours, [[170, 300, 2]]);
  assert.deepEqual(m.visors, [[4, 318]]);
  assert.ok(m.flagColors.length >= 3);
});

test('flagPhase staggers flags along the wire and stays finite', () => {
  assert.equal(flagPhase(0, 1920), 0);
  assert.ok(flagPhase(960, 1920) > flagPhase(120, 1920));
  assert.equal(flagPhase(NaN, 1920), 0);
  assert.equal(flagPhase(10, 0), 0);
});

test('the Level 6 market stays above the lane (y 460 and below) in every copy', async () => {
  const { readFileSync } = await import('node:fs');
  const style = JSON.parse(readFileSync(new URL('../../content/levels/styles/level-06-iron-line-push.json', import.meta.url), 'utf8'));
  const m = readAmbient(style).market;
  assert.ok(m && m.steam.length === 5 && m.flags.length === 20 && m.hangers.length === 15 && m.neighbours.length === 4);
  const top = (list) => Math.max(...list.map((p) => p[1]));
  assert.ok(top(m.steam) < 440 && top(m.neighbours) + 80 < 440 && top(m.visors) < 440);
  assert.ok(tiledItems(m.steam, 1920, 3840).length === 10);
});
