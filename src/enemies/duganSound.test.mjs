import assert from 'node:assert/strict';
import { isDugan, duganSoundReady, duganVoiceFor, duganImpactVolume, DUGAN_IMPACT_VOLUME, DUGAN_IMPACT_BLOCKED_VOLUME, DUGAN_HIT_VOICE_COOLDOWN_MS } from './duganSound.js';

assert.equal(isDugan({ isBoss: true }), true);
assert.equal(isDugan({ skin: 'grunt' }), false);
assert.equal(isDugan(null), false);

assert.equal(duganSoundReady(undefined, 0, DUGAN_HIT_VOICE_COOLDOWN_MS), true);
assert.equal(duganSoundReady(1000, 1000 + DUGAN_HIT_VOICE_COOLDOWN_MS - 1, DUGAN_HIT_VOICE_COOLDOWN_MS), false);
assert.equal(duganSoundReady(1000, 1000 + DUGAN_HIT_VOICE_COOLDOWN_MS, DUGAN_HIT_VOICE_COOLDOWN_MS), true);

assert.equal(duganVoiceFor(false, false), 'hit');
assert.equal(duganVoiceFor(true, false), 'death');
assert.equal(duganVoiceFor(true, true), null);
assert.equal(duganVoiceFor(false, true), null);

assert.equal(duganImpactVolume(null), DUGAN_IMPACT_VOLUME);
assert.equal(duganImpactVolume(undefined), DUGAN_IMPACT_VOLUME);
assert.equal(duganImpactVolume('block'), DUGAN_IMPACT_BLOCKED_VOLUME);
assert.equal(duganImpactVolume('parry'), null);
console.log('duganSound ok');
