import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVEL_MUSIC, levelMusicFor, levelMusicVolume } from './levelMusic.js';

test('all 8 levels have distinct music keys and paths', () => {
  const v = Object.values(LEVEL_MUSIC);
  assert.equal(v.length, 8);
  assert.equal(new Set(v.map((m) => m.key)).size, 8);
  assert.equal(new Set(v.map((m) => m.path)).size, 8);
  v.forEach((m) => assert.match(m.path, /^assets\/sound\/level-0[1-8]-.+\.(ogg|mp3)$/));
});
test('unknown level has no music', () => assert.equal(levelMusicFor('nope'), null));
test('volume scales with the music slider and is clamped', () => {
  assert.equal(levelMusicVolume(0), 0);
  assert.ok(levelMusicVolume(100) <= 0.55 + 1e-9);
  assert.equal(levelMusicVolume(500), levelMusicVolume(100));
});

import { bossMusicFor, isBossWave, BOSS_MUSIC, FINAL_LEVEL_ID } from './levelMusic.js';
test('boss music: final level gets Dark Forces, every other level the shared end-boss track', () => {
  assert.equal(bossMusicFor(FINAL_LEVEL_ID), BOSS_MUSIC.final);
  for (const id of Object.keys(LEVEL_MUSIC)) if (id !== FINAL_LEVEL_ID) assert.equal(bossMusicFor(id), BOSS_MUSIC.endLevel);
  assert.notEqual(BOSS_MUSIC.final.path, BOSS_MUSIC.endLevel.path);
});
test('boss wave is the last wave only', () => {
  assert.equal(isBossWave(4, 5), true);
  assert.equal(isBossWave(3, 5), false);
  assert.equal(isBossWave(0, 1), true);
  assert.equal(isBossWave(0, 0), false);
});
