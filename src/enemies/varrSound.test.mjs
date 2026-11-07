import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as S from './varrSound.js';
import { VarrBoss } from './VarrBoss.js';
import { GlitchBoss } from './GlitchBoss.js';
import { RaptorBoss } from './RaptorBoss.js';
import { Subject88Boss } from './Subject88Boss.js';
import { isGlitchEnemy } from './glitchSound.js';
import { isRaptorEnemy } from './raptorSound.js';
import { isSubject88Enemy } from './subject88Sound.js';

test('Varr sounds are slowed (heavy), phase 2 lower', () => {
  for (const r of [S.VARR_HIT_VOICE_RATE, S.VARR_HIT_THUD_RATE, S.VARR_DEATH_SOUND_RATE, S.VARR_DEATH_BOOM_RATE]) assert.ok(r > 0.2 && r < 0.9);
  assert.ok(S.varrHitVoiceRate(2) < S.varrHitVoiceRate(1));
});
test('only existing audio files are used, every cue key is loaded', () => {
  for (const a of S.VARR_AUDIO) assert.ok(fs.existsSync(a.path), a.path);
  const loaded = new Set(S.VARR_AUDIO.map((a) => a.key));
  for (const [name, c] of Object.entries(S.VARR_CUES)) {
    assert.ok(loaded.has(c.key), `${name} uses a loaded sample`);
    assert.ok(c.rate > 0 && c.volume > 0 && c.volume <= 1, name);
  }
});
test('isVarrEnemy matches only Varr', () => {
  assert.equal(S.isVarrEnemy(new VarrBoss({ id: 'v' })), true);
  assert.equal(S.isVarrEnemy(new GlitchBoss({ id: 'g' })), false);
  assert.equal(S.isVarrEnemy(new RaptorBoss({ id: 'r' })), false);
  assert.equal(S.isVarrEnemy(new Subject88Boss({ id: 's' })), false);
  assert.equal(S.isVarrEnemy(null), false);
  // and no other boss voice claims him
  const v = new VarrBoss({ id: 'v' });
  assert.ok(!isGlitchEnemy(v) && !isRaptorEnemy(v) && !isSubject88Enemy(v));
});
test('voice: death once, hit otherwise, corpse silent; cooldown', () => {
  assert.equal(S.varrVoiceFor(true, false), 'death');
  assert.equal(S.varrVoiceFor(false, false), 'hit');
  assert.equal(S.varrVoiceFor(true, true), null);
  assert.equal(S.varrSoundReady(undefined, 0), true);
  assert.equal(S.varrSoundReady(1000, 1100), false);
  assert.equal(S.varrSoundReady(1000, 1000 + S.VARR_HIT_VOICE_COOLDOWN_MS), true);
});
