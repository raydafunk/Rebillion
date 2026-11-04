import assert from 'node:assert/strict';
import { isWatcherEnemy, watcherSoundReady, watcherVoiceFor, WATCHER_HIT_SOUND_COOLDOWN_MS, WATCHER_HIT_SOUND_KEY, WATCHER_DEATH_SOUND_KEY } from './watcherSound.js';
import { isRangerEnemy } from './rangerSound.js';
import { isPlainGrunt, GRUNT_HIT_SOUND_KEY, GRUNT_DEATH_SOUND_KEY } from './gruntSound.js';
import { isBreaker2Enemy } from './breaker2Sound.js';
import { isDugan } from './duganSound.js';

assert.equal(isWatcherEnemy({ skin: 'rust-watcher' }), true);
assert.equal(isWatcherEnemy({ skin: 'rust-ranger' }), false);
assert.equal(isWatcherEnemy({ skin: 'grunt' }), false);
assert.equal(isWatcherEnemy(null), false);
assert.equal(isPlainGrunt({ skin: 'rust-watcher' }), false); // never double-voiced by the grunt path
assert.equal(isRangerEnemy({ skin: 'rust-watcher' }), false);
assert.equal(isBreaker2Enemy({ skin: 'rust-watcher' }), false);
assert.equal(isDugan({ skin: 'rust-watcher' }), false);
assert.equal(WATCHER_HIT_SOUND_KEY, GRUNT_HIT_SOUND_KEY);     // reuses the already loaded grunt voices
assert.equal(WATCHER_DEATH_SOUND_KEY, GRUNT_DEATH_SOUND_KEY);
assert.equal(watcherVoiceFor(false, false), 'hit');
assert.equal(watcherVoiceFor(true, false), 'death');
assert.equal(watcherVoiceFor(true, true), null);
assert.equal(watcherVoiceFor(false, true), null);
assert.equal(watcherSoundReady(undefined, 0), true);
assert.equal(watcherSoundReady(1000, 1000 + WATCHER_HIT_SOUND_COOLDOWN_MS - 1), false);
assert.equal(watcherSoundReady(1000, 1000 + WATCHER_HIT_SOUND_COOLDOWN_MS), true);
console.log('watcherSound ok');
