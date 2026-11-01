import test from 'node:test';
import assert from 'node:assert/strict';
import { LOADING_LINES, loadingLine } from './loadingData.js';

test('loadingLine walks through every line as progress fills, clamped to 0..1', () => {
  assert.equal(loadingLine(0), LOADING_LINES[0]);
  assert.equal(loadingLine(1), LOADING_LINES[LOADING_LINES.length - 1]);
  assert.equal(loadingLine(-5), LOADING_LINES[0]);
  assert.equal(loadingLine(7), LOADING_LINES[LOADING_LINES.length - 1]);
  assert.equal(loadingLine(NaN), LOADING_LINES[0]);
  const seen = new Set();
  for (let p = 0; p <= 1; p += 0.01) seen.add(loadingLine(p));
  assert.equal(seen.size, LOADING_LINES.length);
});
