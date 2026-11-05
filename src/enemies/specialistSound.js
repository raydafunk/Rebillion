// Pure: Rust Specialist ("The Copper Fangs") sounds. Zed's own punch/kick impact already plays on any enemy (player/heavyHit.js); this adds
// the Specialist's side: a grunt when he takes a hit, a death cry when he falls, and a heavier boot step when he walks.
// No new files: the grunt voice, death-cry and concrete-step wavs the plain grunts use are loaded already (ArenaScene). Played slower so the
// tougher, armoured Copper Fang (hp x1.3) sounds deeper and heavier than a plain grunt (hit rate 0.88, death rate 0.9, step rate x0.82).
// Applies to skin 'rust-specialist' only, so the grunt, Ranger and Watcher decisions never double-voice him.
import { GRUNT_HIT_SOUND_KEY, GRUNT_DEATH_SOUND_KEY, GRUNT_STEP_SOUND_KEY } from './gruntSound.js';
import { SPECIALIST_SKIN } from './specialistData.js';

export const SPECIALIST_HIT_SOUND_KEY = GRUNT_HIT_SOUND_KEY;
export const SPECIALIST_HIT_SOUND_VOLUME = 0.65;
export const SPECIALIST_HIT_SOUND_RATE = 0.88;
export const SPECIALIST_HIT_SOUND_COOLDOWN_MS = 150; // per Specialist, so rapid hits / crowds do not stack
export const SPECIALIST_DEATH_SOUND_KEY = GRUNT_DEATH_SOUND_KEY;
export const SPECIALIST_DEATH_SOUND_VOLUME = 0.75;
export const SPECIALIST_DEATH_SOUND_RATE = 0.9;

// Walking: the scene's shared step voice (see gruntSound.pickStepper, one step at a time scene-wide) with a heavier boot character.
export const SPECIALIST_STEP_SOUND_KEY = GRUNT_STEP_SOUND_KEY;
export const SPECIALIST_STEP_VOLUME_MULT = 1.2;
export const SPECIALIST_STEP_RATE_MULT = 0.82;

export const isSpecialistEnemy = (enemy) => !!enemy && enemy.skin === SPECIALIST_SKIN;

export function specialistSoundReady(lastMs, nowMs, cooldownMs = SPECIALIST_HIT_SOUND_COOLDOWN_MS) {
  return lastMs === undefined || nowMs - lastMs >= cooldownMs;
}

// Same rule as grunts: killing blow = death cry only, once; hits on the corpse are silent.
export function specialistVoiceFor(killed, alreadyDied) {
  if (alreadyDied) return null;
  return killed ? 'death' : 'hit';
}

// pickStepper's { volume, rate } for a Specialist: same step wav, lower and a little louder.
export function specialistStep({ volume, rate }) {
  return { volume: volume * SPECIALIST_STEP_VOLUME_MULT, rate: rate * SPECIALIST_STEP_RATE_MULT };
}
