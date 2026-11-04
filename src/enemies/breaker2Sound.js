// Pure: Type 2 Breaker ("Rust-BreakerType2") voices. Zed's own punch/kick impact already plays on any enemy (player/heavyHit.js); this adds the
// Breaker's side: a grunt when he takes a hit and a death cry when he falls. No new files: the grunt and death-cry wavs the plain grunts use are
// loaded already (ArenaScene), played slower so the elite sounds bigger than a grunt but lighter than Dugan (rate 0.72 / 0.85).
import { GRUNT_HIT_SOUND_KEY, GRUNT_DEATH_SOUND_KEY } from './gruntSound.js';
import { isBreaker2 } from './breakerType2Data.js';

export const BREAKER2_HIT_SOUND_KEY = GRUNT_HIT_SOUND_KEY;
export const BREAKER2_HIT_SOUND_VOLUME = 0.65;
export const BREAKER2_HIT_SOUND_RATE = 0.86;
export const BREAKER2_HIT_SOUND_COOLDOWN_MS = 220; // per Breaker; he is hit often and rapid hits would stack
export const BREAKER2_DEATH_SOUND_KEY = GRUNT_DEATH_SOUND_KEY;
export const BREAKER2_DEATH_SOUND_VOLUME = 0.75;
export const BREAKER2_DEATH_SOUND_RATE = 0.88;

export const isBreaker2Enemy = (enemy) => !!enemy && isBreaker2(enemy.skin);

export function breaker2SoundReady(lastMs, nowMs, cooldownMs = BREAKER2_HIT_SOUND_COOLDOWN_MS) {
  return lastMs === undefined || nowMs - lastMs >= cooldownMs;
}

// Same rule as grunts: killing blow = death cry only, once; hits on the corpse are silent.
export function breaker2VoiceFor(killed, alreadyDied) {
  if (alreadyDied) return null;
  return killed ? 'death' : 'hit';
}
