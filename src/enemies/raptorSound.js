// Pure: Raptor's hit and death sounds (Level 5 mini-boss). No new audio files: the existing grunt / death cry / punch samples are
// played slightly sped up, which makes him sound light and quick (the opposite of the slowed-down heavy bosses). Same shape as glitchSound.js.
export const RAPTOR_HIT_VOICE_KEY = 'raptor-hit-voice';
export const RAPTOR_HIT_VOICE_PATH = 'assets/sound/262279__dirtjm__grunts-male.wav';
export const RAPTOR_HIT_VOICE_VOLUME = 0.85;
export const RAPTOR_HIT_VOICE_RATE = 1.3;      // higher and sharper: a lean, fast fighter
export const RAPTOR_HIT_VOICE_COOLDOWN_MS = 350;

export const RAPTOR_HIT_THUD_KEY = 'raptor-hit-thud';
export const RAPTOR_HIT_THUD_PATH = 'assets/sound/560325__jakeeaton__punch-2.wav';
export const RAPTOR_HIT_THUD_VOLUME = 0.75;
export const RAPTOR_HIT_THUD_RATE = 1.1;       // light crack, not a boom

export const RAPTOR_DEATH_SOUND_KEY = 'raptor-death-voice';
export const RAPTOR_DEATH_SOUND_PATH = 'assets/sound/695389__fmaudio__male-death-cry-6.wav';
export const RAPTOR_DEATH_SOUND_VOLUME = 1;
export const RAPTOR_DEATH_SOUND_RATE = 1.1;

export const RAPTOR_SLAM_KEY = 'raptor-slam';  // Falcon Drop / Dive Kick landing: the heavy punch sample, played low
export const RAPTOR_SLAM_PATH = 'assets/sound/524950__magnuswaker__punch-hard-1.wav';
export const RAPTOR_SLAM_VOLUME = 0.9;
export const RAPTOR_SLAM_RATE = 0.7;

export const isRaptorEnemy = (enemy) => !!enemy && enemy.miniBoss === true && enemy.skin === 'rust-raptor';

export function raptorSoundReady(lastMs, nowMs, cooldownMs = RAPTOR_HIT_VOICE_COOLDOWN_MS) {
  return lastMs === undefined || nowMs - lastMs >= cooldownMs;
}

// Killing blow = death sounds only, once; hits on the corpse are silent.
export function raptorVoiceFor(killed, alreadyDied) {
  if (alreadyDied) return null;
  return killed ? 'death' : 'hit';
}
