import assert from 'node:assert/strict';
import { isPlainGrunt, gruntSoundReady, GRUNT_HIT_SOUND_COOLDOWN_MS, gruntVoiceFor } from './gruntSound.js';

// plain grunts only: no skin or 'rust-grunt'; Breakers and missing grunts are excluded
assert.equal(isPlainGrunt({ skin: null }), true);
assert.equal(isPlainGrunt({}), true);
assert.equal(isPlainGrunt({ skin: 'rust-grunt' }), true);
assert.equal(isPlainGrunt({ skin: 'grunt' }), true); // what level wave data actually passes
assert.equal(isPlainGrunt({ skin: 'rust-breaker' }), false);
assert.equal(isPlainGrunt({ skin: 'rust-watcher' }), false);
assert.equal(isPlainGrunt(null), false);
assert.equal(isPlainGrunt(undefined), false);

// per-grunt cooldown
assert.equal(gruntSoundReady(undefined, 0), true);
assert.equal(gruntSoundReady(1000, 1000 + GRUNT_HIT_SOUND_COOLDOWN_MS - 1), false);
assert.equal(gruntSoundReady(1000, 1000 + GRUNT_HIT_SOUND_COOLDOWN_MS), true);
assert.equal(gruntSoundReady(1000, 1100, 50), true);

// killing blow plays the death cry only, once; later hits on the corpse are silent
assert.equal(gruntVoiceFor(false, false), 'hit');
assert.equal(gruntVoiceFor(true, false), 'death');
assert.equal(gruntVoiceFor(true, true), null);
assert.equal(gruntVoiceFor(false, true), null);

console.log('gruntSound tests passed');
