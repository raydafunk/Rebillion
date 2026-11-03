import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RAGE_INTRO, RAGE_INTRO_ASSET, RAGE_INTRO_LEVEL, shouldShowRageIntro, rageIntroProblems } from './rageIntroData.js';
import { RAGE_CONFIG } from '../player/rageConfig.js';

test('the card shows on Level 2 only', () => {
  assert.equal(shouldShowRageIntro(1), false);
  assert.equal(shouldShowRageIntro(2), true);
  assert.equal(shouldShowRageIntro(3), false);
  assert.equal(shouldShowRageIntro(8), false);
  assert.equal(shouldShowRageIntro(undefined), false);
  assert.equal(shouldShowRageIntro('2'), false);
});

test('Level 2 is the first level with a Rage meter', () => {
  assert.equal(RAGE_INTRO_LEVEL, RAGE_CONFIG.enabledFromLevel);
});

test('copy is valid: title, 3 to 4 short lines, prompt', () => {
  assert.deepEqual(rageIntroProblems(), []);
  assert.equal(RAGE_INTRO.title, 'RAGE');
  assert.ok(RAGE_INTRO.lines.length >= 3 && RAGE_INTRO.lines.length <= 4);
  assert.ok(RAGE_INTRO.autoMs > 0 && RAGE_INTRO.inputGuardMs >= 1000);
});

test('copy numbers match the real rules', () => {
  const text = RAGE_INTRO.lines.join(' ');
  assert.match(text, new RegExp(`READY for ${RAGE_CONFIG.readyWindowSec} seconds`));
  assert.match(text, new RegExp(`Rage for ${RAGE_CONFIG.rageDurationSec} seconds`));
  assert.equal(RAGE_CONFIG.readyWindowSec, 4);
  assert.equal(RAGE_CONFIG.rageDurationSec, 9);
  assert.match(text, /Press L/);
  assert.match(text, /Clean streaks/);
  assert.match(text, /knockout/);
  assert.doesNotMatch(text, /father/i);
});

test('problems are reported for bad data', () => {
  assert.ok(rageIntroProblems({ ...RAGE_INTRO, lines: ['one'] }).length);
  assert.ok(rageIntroProblems({ ...RAGE_INTRO, lines: ['a', 'b', ' '] }).length);
  assert.ok(rageIntroProblems({ ...RAGE_INTRO, prompt: '' }).length);
});

test('frame asset is declared and the highlight line exists', () => {
  assert.equal(RAGE_INTRO_ASSET.key, RAGE_INTRO.frameKey);
  assert.match(RAGE_INTRO_ASSET.path, /\.svg$/);
  assert.ok(RAGE_INTRO.lines[RAGE_INTRO.highlightLine]);
});
