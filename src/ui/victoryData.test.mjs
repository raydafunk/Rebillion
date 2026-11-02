import assert from 'node:assert/strict';
import { test } from 'node:test';
import { VICTORY, VICTORY_LINES, victoryFor, victoryProblems } from './victoryData.js';
import { DUGAN_ID } from '../enemies/duganData.js';

test('Dugan has a victory line and the shipped table is valid', () => {
  const v = victoryFor(DUGAN_ID);
  assert.ok(v && v.lines.length >= 1);
  assert.match(v.lines.join(' '), /fallen/i);
  assert.deepEqual(victoryProblems(), []);
});

test('a boss with no entry gets no card; blank lines are dropped', () => {
  assert.equal(victoryFor('nobody'), null);
  assert.equal(victoryFor('x', { x: { lines: ['  ', ''] } }), null);
  assert.deepEqual(victoryFor('x', { x: { lines: ['a', ' ', 'b'] } }).lines, ['a', 'b']);
});

test('header defaults to VICTORY and a boss can override it', () => {
  assert.equal(victoryFor(DUGAN_ID).header, VICTORY.header);
  assert.equal(victoryFor('x', { x: { header: 'BOSS DOWN', lines: ['a'] } }).header, 'BOSS DOWN');
});

test('problems are reported for empty or oversized entries', () => {
  assert.ok(victoryProblems({ a: { lines: [] } }).length);
  assert.ok(victoryProblems({ a: { lines: ['1', '2', '3', '4'] } }).length);
  assert.ok(victoryProblems({ a: { lines: ['ok', ''] } }).length);
});

test('every key in the table is a string id with copy', () => {
  for (const [id, e] of Object.entries(VICTORY_LINES)) assert.ok(id && e.lines.length);
});
