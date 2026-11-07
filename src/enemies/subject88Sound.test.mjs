import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as S from './subject88Sound.js';

test('Subject 88 sounds are slowed (heavy) but not growls', () => {
  for (const r of [S.SUBJECT88_HIT_VOICE_RATE, S.SUBJECT88_HIT_THUD_RATE, S.SUBJECT88_DEATH_SOUND_RATE, S.SUBJECT88_DEATH_BOOM_RATE]) assert.ok(r > 0.3 && r < 0.9);
});
test('only existing audio files are used', () => {
  for (const p of [S.SUBJECT88_HIT_VOICE_PATH, S.SUBJECT88_HIT_THUD_PATH, S.SUBJECT88_DEATH_SOUND_PATH]) assert.ok(fs.existsSync(p), p);
});
test('isSubject88Enemy matches only the hazard-laying mini-boss', () => {
  assert.equal(S.isSubject88Enemy({ miniBoss: true, hazards: [] }), true);
  assert.equal(S.isSubject88Enemy({ miniBoss: true, decoys: [] }), false);
  assert.equal(S.isSubject88Enemy({ isBoss: true }), false);
  assert.equal(S.isSubject88Enemy(null), false);
});
test('voice: death once, hit otherwise, corpse silent', () => {
  assert.equal(S.subject88VoiceFor(true, false), 'death');
  assert.equal(S.subject88VoiceFor(false, false), 'hit');
  assert.equal(S.subject88VoiceFor(true, true), null);
});
test('hit voice cooldown', () => {
  assert.equal(S.subject88SoundReady(undefined, 0), true);
  assert.equal(S.subject88SoundReady(1000, 1100), false);
  assert.equal(S.subject88SoundReady(1000, 1000 + S.SUBJECT88_HIT_VOICE_COOLDOWN_MS), true);
});
