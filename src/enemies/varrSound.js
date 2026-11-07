// Pure: Overseer Halden Varr's sounds (Level 8 final boss). No new audio files: the existing grunt / death cry / punch / woosh / kick samples are
// played at other rates (the same trick glitchSound.js and subject88Sound.js use), so he sounds cold and heavy. Phase 2 drops the pitch a little more.
// VARR_CUES is the table VarrFx plays from: one entry per move beat, { key, volume, rate }. Keys are loaded by ArenaScene only on the level that has him.
export const VARR_HIT_VOICE_KEY = 'varr-hit-voice';
export const VARR_HIT_VOICE_PATH = 'assets/sound/262279__dirtjm__grunts-male.wav';
export const VARR_HIT_VOICE_VOLUME = 0.85;
export const VARR_HIT_VOICE_RATE = 0.7;
export const VARR_HIT_VOICE_RATE_P2 = 0.55;
export const VARR_HIT_VOICE_COOLDOWN_MS = 450;

export const VARR_HIT_THUD_KEY = 'varr-hit-thud';
export const VARR_HIT_THUD_PATH = 'assets/sound/524950__magnuswaker__punch-hard-1.wav';
export const VARR_HIT_THUD_VOLUME = 0.75;
export const VARR_HIT_THUD_RATE = 0.65;

export const VARR_DEATH_SOUND_KEY = 'varr-death-voice';
export const VARR_DEATH_SOUND_PATH = 'assets/sound/695388__fmaudio__male-death-cry-5.wav';
export const VARR_DEATH_SOUND_VOLUME = 1;
export const VARR_DEATH_SOUND_RATE = 0.55;
export const VARR_DEATH_BOOM_RATE = 0.4;
export const VARR_DEATH_BOOM_VOLUME = 1;

export const VARR_WOOSH_KEY = 'varr-cue-woosh';
export const VARR_WOOSH_PATH = 'assets/sound/swing-woosh-loud.wav';
export const VARR_KICK_KEY = 'varr-cue-kick';
export const VARR_KICK_PATH = 'assets/sound/158920__carlmartin__cajun-kick-hit-3.wav';

/** Samples the scene must load for him (key + path). */
export const VARR_AUDIO = Object.freeze([
  { key: VARR_HIT_VOICE_KEY, path: VARR_HIT_VOICE_PATH },
  { key: VARR_HIT_THUD_KEY, path: VARR_HIT_THUD_PATH },
  { key: VARR_DEATH_SOUND_KEY, path: VARR_DEATH_SOUND_PATH },
  { key: VARR_WOOSH_KEY, path: VARR_WOOSH_PATH },
  { key: VARR_KICK_KEY, path: VARR_KICK_PATH },
]);

const cue = (key, volume, rate) => Object.freeze({ key, volume, rate });
export const VARR_CUES = Object.freeze({
  shieldRaise: cue(VARR_WOOSH_KEY, 0.7, 0.55),
  shieldBreak: cue(VARR_KICK_KEY, 0.9, 0.6),
  summon: cue(VARR_WOOSH_KEY, 0.6, 0.45),
  counter: cue(VARR_WOOSH_KEY, 0.5, 0.8),
  transform: cue(VARR_HIT_THUD_KEY, 1, 0.35),
  slam: cue(VARR_HIT_THUD_KEY, 0.95, 0.5),
  taser: cue(VARR_WOOSH_KEY, 0.6, 1.7),
  combo: cue(VARR_KICK_KEY, 0.55, 1.2),
  pulse: cue(VARR_WOOSH_KEY, 0.8, 0.4),
  drones: cue(VARR_WOOSH_KEY, 0.5, 2.0),
  collapseCharge: cue(VARR_HIT_THUD_KEY, 0.8, 0.3),
  collapseBlast: cue(VARR_HIT_THUD_KEY, 1, 0.25),
  wallZap: cue(VARR_KICK_KEY, 0.7, 1.8),
});

/** Only Varr carries both a shield and a collapse flag among the mini-bosses. */
export const isVarrEnemy = (enemy) => !!enemy && enemy.miniBoss === true && enemy.shieldHp !== undefined && enemy.collapseDone !== undefined;

export function varrSoundReady(lastMs, nowMs, cooldownMs = VARR_HIT_VOICE_COOLDOWN_MS) {
  return lastMs === undefined || nowMs - lastMs >= cooldownMs;
}

export const varrHitVoiceRate = (phase) => (phase === 2 ? VARR_HIT_VOICE_RATE_P2 : VARR_HIT_VOICE_RATE);

// Killing blow = death sounds only, once; hits on the corpse are silent.
export function varrVoiceFor(killed, alreadyDied) {
  if (alreadyDied) return null;
  return killed ? 'death' : 'hit';
}
