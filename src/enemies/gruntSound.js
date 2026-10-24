// Pure: grunt voice played when a Rust Grunt takes damage. The wav is a single short grunt (~0.44s), played whole.
export const GRUNT_HIT_SOUND_KEY = 'grunt-hit-voice';
export const GRUNT_HIT_SOUND_PATH = 'assets/sound/262279__dirtjm__grunts-male.wav';
export const GRUNT_HIT_SOUND_VOLUME = 0.6;
export const GRUNT_HIT_SOUND_COOLDOWN_MS = 150; // per grunt, so rapid hits / crowds do not stack

// True for plain grunts only. Level files tag them skin 'grunt'; stand-ins for other enemies carry their own
// skin (rust-breaker, rust-watcher, ...) and are excluded.
export function isPlainGrunt(grunt) {
  return !!grunt && (grunt.skin == null || grunt.skin === 'grunt' || grunt.skin === 'rust-grunt');
}

// lastMs: last play time for this grunt (or undefined); nowMs: current time.
export function gruntSoundReady(lastMs, nowMs, cooldownMs = GRUNT_HIT_SOUND_COOLDOWN_MS) {
  return lastMs === undefined || nowMs - lastMs >= cooldownMs;
}

// Death cry (mono 96kHz 24-bit wav, ~0.94s), played whole once when a plain grunt is killed.
export const GRUNT_DEATH_SOUND_KEY = 'grunt-death-voice';
export const GRUNT_DEATH_SOUND_PATH = 'assets/sound/695389__fmaudio__male-death-cry-6.wav';
export const GRUNT_DEATH_SOUND_VOLUME = 0.7;

// Which voice a damage event should trigger: 'death' on the killing blow (once per grunt, replaces the hit voice),
// 'hit' on non-lethal hits, null otherwise (a corpse hit again plays nothing).
export function gruntVoiceFor(killed, alreadyDied) {
  if (alreadyDied) return null;
  return killed ? 'death' : 'hit';
}
