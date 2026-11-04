import assert from 'node:assert/strict';
import { isRangerEnemy, rangerSoundReady, rangerVoiceFor, RANGER_HIT_SOUND_COOLDOWN_MS, RANGER_HIT_SOUND_KEY, RANGER_DEATH_SOUND_KEY } from './rangerSound.js';
import { isPlainGrunt, GRUNT_HIT_SOUND_KEY, GRUNT_DEATH_SOUND_KEY } from './gruntSound.js';
import { isBreaker2Enemy } from './breaker2Sound.js';
import { isDugan } from './duganSound.js';

assert.equal(isRangerEnemy({ skin: 'rust-ranger' }), true);
assert.equal(isRangerEnemy({ skin: 'rust-watcher' }), false);
assert.equal(isRangerEnemy({ skin: 'grunt' }), false);
assert.equal(isRangerEnemy(null), false);
assert.equal(isPlainGrunt({ skin: 'rust-ranger' }), false); // never double-voiced by the grunt path
assert.equal(isBreaker2Enemy({ skin: 'rust-ranger' }), false);
assert.equal(isDugan({ skin: 'rust-ranger' }), false);
assert.equal(RANGER_HIT_SOUND_KEY, GRUNT_HIT_SOUND_KEY);     // reuses the already loaded grunt voices
assert.equal(RANGER_DEATH_SOUND_KEY, GRUNT_DEATH_SOUND_KEY);
assert.equal(rangerVoiceFor(false, false), 'hit');
assert.equal(rangerVoiceFor(true, false), 'death');
assert.equal(rangerVoiceFor(true, true), null);
assert.equal(rangerVoiceFor(false, true), null);
assert.equal(rangerSoundReady(undefined, 0), true);
assert.equal(rangerSoundReady(1000, 1000 + RANGER_HIT_SOUND_COOLDOWN_MS - 1), false);
assert.equal(rangerSoundReady(1000, 1000 + RANGER_HIT_SOUND_COOLDOWN_MS), true);
console.log('rangerSound ok');
