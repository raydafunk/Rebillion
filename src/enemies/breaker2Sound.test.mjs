import assert from 'node:assert/strict';
import { isBreaker2Enemy, breaker2SoundReady, breaker2VoiceFor, BREAKER2_HIT_SOUND_COOLDOWN_MS } from './breaker2Sound.js';
import { isPlainGrunt } from './gruntSound.js';

assert.equal(isBreaker2Enemy({ skin: 'rust-breaker-2' }), true);
assert.equal(isBreaker2Enemy({ skin: 'grunt' }), false);
assert.equal(isBreaker2Enemy(null), false);
assert.equal(isPlainGrunt({ skin: 'rust-breaker-2' }), false); // never double-voiced by the grunt path
assert.equal(breaker2VoiceFor(false, false), 'hit');
assert.equal(breaker2VoiceFor(true, false), 'death');
assert.equal(breaker2VoiceFor(true, true), null);
assert.equal(breaker2VoiceFor(false, true), null);
assert.equal(breaker2SoundReady(undefined, 0), true);
assert.equal(breaker2SoundReady(1000, 1000 + BREAKER2_HIT_SOUND_COOLDOWN_MS - 1), false);
assert.equal(breaker2SoundReady(1000, 1000 + BREAKER2_HIT_SOUND_COOLDOWN_MS), true);
console.log('breaker2Sound ok');
