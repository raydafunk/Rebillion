import assert from 'node:assert/strict';
import { isSpecialistEnemy, specialistSoundReady, specialistVoiceFor, specialistStep, SPECIALIST_HIT_SOUND_COOLDOWN_MS, SPECIALIST_HIT_SOUND_KEY, SPECIALIST_DEATH_SOUND_KEY,
  SPECIALIST_STEP_SOUND_KEY, SPECIALIST_HIT_SOUND_RATE, SPECIALIST_DEATH_SOUND_RATE } from './specialistSound.js';
import { isPlainGrunt, GRUNT_HIT_SOUND_KEY, GRUNT_DEATH_SOUND_KEY, GRUNT_STEP_SOUND_KEY, pickStepper } from './gruntSound.js';
import { isRangerEnemy } from './rangerSound.js';
import { isWatcherEnemy } from './watcherSound.js';
import { isBreaker2Enemy } from './breaker2Sound.js';
import { isDugan } from './duganSound.js';

assert.equal(isSpecialistEnemy({ skin: 'rust-specialist' }), true);
assert.equal(isSpecialistEnemy({ skin: 'rust-ranger' }), false);
assert.equal(isSpecialistEnemy({ skin: 'grunt' }), false);
assert.equal(isSpecialistEnemy(null), false);
const s = { skin: 'rust-specialist' };
assert.equal(isPlainGrunt(s), false); // never double-voiced by the other paths
assert.equal(isRangerEnemy(s), false);
assert.equal(isWatcherEnemy(s), false);
assert.equal(isBreaker2Enemy(s), false);
assert.equal(isDugan(s), false);
assert.equal(SPECIALIST_HIT_SOUND_KEY, GRUNT_HIT_SOUND_KEY); // reuses the already loaded grunt files
assert.equal(SPECIALIST_DEATH_SOUND_KEY, GRUNT_DEATH_SOUND_KEY);
assert.equal(SPECIALIST_STEP_SOUND_KEY, GRUNT_STEP_SOUND_KEY);
assert.ok(SPECIALIST_HIT_SOUND_RATE < 1 && SPECIALIST_DEATH_SOUND_RATE < 1); // deeper than a grunt
assert.equal(specialistVoiceFor(false, false), 'hit');
assert.equal(specialistVoiceFor(true, false), 'death');
assert.equal(specialistVoiceFor(true, true), null);
assert.equal(specialistVoiceFor(false, true), null);
assert.equal(specialistSoundReady(undefined, 0), true);
assert.equal(specialistSoundReady(1000, 1000 + SPECIALIST_HIT_SOUND_COOLDOWN_MS - 1), false);
assert.equal(specialistSoundReady(1000, 1000 + SPECIALIST_HIT_SOUND_COOLDOWN_MS), true);
const base = pickStepper([{ id: 1, dist: 100 }], 1000, undefined, () => 0.5);
const heavy = specialistStep(base);
assert.ok(heavy.rate < base.rate && heavy.volume > base.volume);
console.log('specialistSound ok');
