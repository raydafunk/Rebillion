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

// Footsteps: one concrete step (mono 44.1kHz wav, ~0.35s). A crowd stepping at once sounds like a glitch, so the whole
// scene shares ONE step voice: at most one step per GRUNT_STEP_GAP_MS, taken by whichever near walker stepped longest ago.
export const GRUNT_STEP_SOUND_KEY = 'grunt-step';
export const GRUNT_STEP_SOUND_PATH = 'assets/sound/76190__movingplaid__concrete_step_4.wav';
export const GRUNT_STEP_VOLUME = 0.3;       // at point blank; fades with distance
export const GRUNT_STEP_GAP_MS = 380;       // scene-wide minimum between any two steps
export const GRUNT_STEP_RANGE_PX = 700;     // walkers farther than this from Zed are silent
export const GRUNT_STEP_NEAR_COUNT = 3;     // only the nearest few walkers can take the step, so it follows the closest ones

/**
 * candidates: walking enemies [{ id, dist, lastStepMs }] (lastStepMs undefined = never stepped). Returns the walker that
 * steps now as { id, volume, rate } (rate varies a little so repeats don't machine-gun), or null (too soon / nobody near).
 * rand: 0..1 source, injectable for tests.
 */
export function pickStepper(candidates, nowMs, lastGlobalMs, rand = Math.random) {
  if (lastGlobalMs !== undefined && nowMs - lastGlobalMs < GRUNT_STEP_GAP_MS) return null;
  const near = candidates.filter((c) => c.dist <= GRUNT_STEP_RANGE_PX).sort((a, b) => a.dist - b.dist).slice(0, GRUNT_STEP_NEAR_COUNT);
  if (!near.length) return null;
  const c = near.reduce((best, x) => ((x.lastStepMs ?? -Infinity) < (best.lastStepMs ?? -Infinity) ? x : best));
  return { id: c.id, volume: GRUNT_STEP_VOLUME * (1 - 0.7 * (c.dist / GRUNT_STEP_RANGE_PX)), rate: 0.94 + 0.12 * rand() };
}
