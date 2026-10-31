import assert from 'node:assert/strict';
import { isPlainGrunt, gruntSoundReady, GRUNT_HIT_SOUND_COOLDOWN_MS, gruntVoiceFor, pickStepper, GRUNT_STEP_GAP_MS, GRUNT_STEP_RANGE_PX } from './gruntSound.js';

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

// footsteps: one shared voice, never a crowd
const W = (id, dist, lastStepMs) => ({ id, dist, lastStepMs });
assert.equal(pickStepper([], 0, undefined), null);
assert.equal(pickStepper([W(1, GRUNT_STEP_RANGE_PX + 1)], 0, undefined), null); // out of earshot
assert.equal(pickStepper([W(1, 100)], 1000, 1000 + 0 - GRUNT_STEP_GAP_MS + 1), null); // too soon after any step
const first = pickStepper([W(1, 100), W(2, 200)], 1000, 1000 - GRUNT_STEP_GAP_MS, () => 0);
assert.equal(first.id, 1); assert.ok(first.volume > 0 && first.rate >= 0.94 && first.rate <= 1.06);
assert.equal(pickStepper([W(1, 100, 900), W(2, 200, 500)], 2000, 0, () => 0).id, 2); // the one that stepped longest ago
assert.equal(pickStepper([W(1, 100, 1), W(2, 200, 2), W(3, 300, 3), W(4, 400, 0)], 2000, 0).id, 1); // only the 3 nearest compete
assert.ok(pickStepper([W(1, 600)], 0, undefined).volume < pickStepper([W(1, 50)], 0, undefined).volume); // quieter when far

console.log('gruntSound tests passed');
