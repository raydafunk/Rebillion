import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as S from './raptorSound.js';

test('Raptor sounds are sped up (light and quick) and reuse files on disk', () => {
  for (const r of [S.RAPTOR_HIT_VOICE_RATE, S.RAPTOR_HIT_THUD_RATE, S.RAPTOR_DEATH_SOUND_RATE]) assert.ok(r > 1 && r < 1.6);
  for (const p of [S.RAPTOR_HIT_VOICE_PATH, S.RAPTOR_HIT_THUD_PATH, S.RAPTOR_DEATH_SOUND_PATH, S.RAPTOR_SLAM_PATH]) assert.ok(fs.existsSync(p), p);
});
test('isRaptorEnemy matches only the Raptor mini-boss', () => {
  assert.equal(S.isRaptorEnemy({ miniBoss: true, skin: 'rust-raptor' }), true);
  assert.equal(S.isRaptorEnemy({ miniBoss: true, decoys: [] }), false);
  assert.equal(S.isRaptorEnemy({ isBoss: true }), false);
  assert.equal(S.isRaptorEnemy(null), false);
});
test('voice: death once, hit otherwise, corpse silent', () => {
  assert.equal(S.raptorVoiceFor(true, false), 'death');
  assert.equal(S.raptorVoiceFor(false, false), 'hit');
  assert.equal(S.raptorVoiceFor(true, true), null);
});
test('hit voice cooldown', () => {
  assert.equal(S.raptorSoundReady(undefined, 0), true);
  assert.equal(S.raptorSoundReady(1000, 1100), false);
  assert.equal(S.raptorSoundReady(1000, 1000 + S.RAPTOR_HIT_VOICE_COOLDOWN_MS), true);
});
