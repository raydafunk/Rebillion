// Pure: Subject 88's hit and death sounds (Level 6 mini-boss). No new audio files: the existing grunt / death cry / punch samples are
// played slowed a little, which makes them heavy but still human: he is a person in distress, not a monster. Same shape as glitchSound.js.
export const SUBJECT88_HIT_VOICE_KEY = 'subject88-hit-voice';
export const SUBJECT88_HIT_VOICE_PATH = 'assets/sound/262279__dirtjm__grunts-male.wav';
export const SUBJECT88_HIT_VOICE_VOLUME = 0.9;
export const SUBJECT88_HIT_VOICE_RATE = 0.65;     // lower and strained, not an octave-down growl
export const SUBJECT88_HIT_VOICE_COOLDOWN_MS = 400;

export const SUBJECT88_HIT_THUD_KEY = 'subject88-hit-thud';
export const SUBJECT88_HIT_THUD_PATH = 'assets/sound/524950__magnuswaker__punch-hard-1.wav';
export const SUBJECT88_HIT_THUD_VOLUME = 0.8;
export const SUBJECT88_HIT_THUD_RATE = 0.6;

export const SUBJECT88_DEATH_SOUND_KEY = 'subject88-death-voice';
export const SUBJECT88_DEATH_SOUND_PATH = 'assets/sound/695389__fmaudio__male-death-cry-6.wav';
export const SUBJECT88_DEATH_SOUND_VOLUME = 1;
export const SUBJECT88_DEATH_SOUND_RATE = 0.6;    // a long, weary cry

export const SUBJECT88_DEATH_BOOM_RATE = 0.5;     // the thud sample again, lower, as he collapses
export const SUBJECT88_DEATH_BOOM_VOLUME = 0.9;

/** Only Subject 88 carries a hazards list among the mini-bosses (Glitch has decoys, the others neither). */
export const isSubject88Enemy = (enemy) => !!enemy && enemy.miniBoss === true && !!enemy.hazards;

export function subject88SoundReady(lastMs, nowMs, cooldownMs = SUBJECT88_HIT_VOICE_COOLDOWN_MS) {
  return lastMs === undefined || nowMs - lastMs >= cooldownMs;
}

// Killing blow = death sounds only, once; hits on the corpse are silent.
export function subject88VoiceFor(killed, alreadyDied) {
  if (alreadyDied) return null;
  return killed ? 'death' : 'hit';
}
