import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from './glitchSound.js';

test('Glitch sounds are slowed down (deep)', () => {
  for (const r of [S.GLITCH_HIT_VOICE_RATE, S.GLITCH_HIT_THUD_RATE, S.GLITCH_DEATH_SOUND_RATE, S.GLITCH_DEATH_BOOM_RATE]) assert.ok(r > 0 && r < 0.7);
});
test('isGlitchEnemy matches only the decoy-casting mini-boss', () => {
  assert.equal(S.isGlitchEnemy({ miniBoss: true, decoys: [] }), true);
  assert.equal(S.isGlitchEnemy({ miniBoss: true }), false);
  assert.equal(S.isGlitchEnemy({ isBoss: true }), false);
  assert.equal(S.isGlitchEnemy(null), false);
});
test('voice: death once, hit otherwise, corpse silent', () => {
  assert.equal(S.glitchVoiceFor(true, false), 'death');
  assert.equal(S.glitchVoiceFor(false, false), 'hit');
  assert.equal(S.glitchVoiceFor(true, true), null);
});
test('hit voice cooldown', () => {
  assert.equal(S.glitchSoundReady(undefined, 0), true);
  assert.equal(S.glitchSoundReady(1000, 1100), false);
  assert.equal(S.glitchSoundReady(1000, 1000 + S.GLITCH_HIT_VOICE_COOLDOWN_MS), true);
});
