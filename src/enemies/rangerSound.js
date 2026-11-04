// Pure: Rust Ranger voices. Zed's own punch/kick impact already plays on any enemy (player/heavyHit.js); this adds the Ranger's side:
// a grunt when he takes a hit and a death cry when he falls. No new files: the grunt and death-cry wavs the plain grunts use are loaded
// already (ArenaScene), played faster so the quick, lightly built Ranger sounds higher and sharper than a grunt (rate 1.12 / 1.06).
// Applies to skin 'rust-ranger' only; Watchers share the Ranger art but are a separate enemy and keep their own sound decisions.
import { GRUNT_HIT_SOUND_KEY, GRUNT_DEATH_SOUND_KEY } from './gruntSound.js';
import { RANGER_SKIN } from './rangerData.js';

export const RANGER_HIT_SOUND_KEY = GRUNT_HIT_SOUND_KEY;
export const RANGER_HIT_SOUND_VOLUME = 0.6;
export const RANGER_HIT_SOUND_RATE = 1.12;
export const RANGER_HIT_SOUND_COOLDOWN_MS = 150; // per Ranger, so rapid hits / crowds do not stack
export const RANGER_DEATH_SOUND_KEY = GRUNT_DEATH_SOUND_KEY;
export const RANGER_DEATH_SOUND_VOLUME = 0.7;
export const RANGER_DEATH_SOUND_RATE = 1.06;

export const isRangerEnemy = (enemy) => !!enemy && enemy.skin === RANGER_SKIN;

export function rangerSoundReady(lastMs, nowMs, cooldownMs = RANGER_HIT_SOUND_COOLDOWN_MS) {
  return lastMs === undefined || nowMs - lastMs >= cooldownMs;
}

// Same rule as grunts: killing blow = death cry only, once; hits on the corpse are silent.
export function rangerVoiceFor(killed, alreadyDied) {
  if (alreadyDied) return null;
  return killed ? 'death' : 'hit';
}
