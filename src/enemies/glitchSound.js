// Pure: Glitch's hit and death sounds (Level 4 mini-boss). No new audio files: the existing grunt / death cry / punch samples are
// played slowed right down, which makes them deep. Same shape as duganSound.js.
export const GLITCH_HIT_VOICE_KEY = 'glitch-hit-voice';
export const GLITCH_HIT_VOICE_PATH = 'assets/sound/262279__dirtjm__grunts-male.wav';
export const GLITCH_HIT_VOICE_VOLUME = 0.9;
export const GLITCH_HIT_VOICE_RATE = 0.5;      // an octave down: a deep, machine-heavy grunt
export const GLITCH_HIT_VOICE_COOLDOWN_MS = 400;

export const GLITCH_HIT_THUD_KEY = 'glitch-hit-thud';
export const GLITCH_HIT_THUD_PATH = 'assets/sound/524950__magnuswaker__punch-hard-1.wav';
export const GLITCH_HIT_THUD_VOLUME = 0.8;
export const GLITCH_HIT_THUD_RATE = 0.55;      // low boom under every hit

export const GLITCH_DEATH_SOUND_KEY = 'glitch-death-voice';
export const GLITCH_DEATH_SOUND_PATH = 'assets/sound/695388__fmaudio__male-death-cry-5.wav';
export const GLITCH_DEATH_SOUND_VOLUME = 1;
export const GLITCH_DEATH_SOUND_RATE = 0.5;    // long, deep death cry

export const GLITCH_DEATH_BOOM_RATE = 0.4;     // the thud sample again, lower and louder, as the final crash
export const GLITCH_DEATH_BOOM_VOLUME = 1;

export const isGlitchEnemy = (enemy) => !!enemy && enemy.miniBoss === true && !!enemy.decoys;

export function glitchSoundReady(lastMs, nowMs, cooldownMs = GLITCH_HIT_VOICE_COOLDOWN_MS) {
  return lastMs === undefined || nowMs - lastMs >= cooldownMs;
}

// Killing blow = death sounds only, once; hits on the corpse are silent.
export function glitchVoiceFor(killed, alreadyDied) {
  if (alreadyDied) return null;
  return killed ? 'death' : 'hit';
}
