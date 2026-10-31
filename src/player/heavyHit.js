// Pure: decides whether a damage-applied result should trigger Zed's hit sound.
// `armed` is truthy only while Zed's hit-request is being resolved (see Zed._emitHit).
export const HEAVY_HIT_SOUND_KEY = 'zed-heavy-hit';
export const HEAVY_HIT_SOUND_PATH = 'assets/sound/punch-hard-1-small.wav';
export const LIGHT_HIT_SOUND_KEY = 'zed-light-hit';
export const LIGHT_HIT_SOUND_PATH = 'assets/sound/560325__jakeeaton__punch-2.wav';

export const KICK_HIT_SOUND_KEY = 'zed-kick-hit';
export const KICK_HIT_SOUND_PATH = 'assets/sound/158920__carlmartin__cajun-kick-hit-3.wav';

export const SWING_SOUND_KEY = 'zed-swing-whoosh';
export const SWING_SOUND_PATH = 'assets/sound/swing-woosh-loud.wav';

export const RUN_SOUND_KEY = 'zed-run-loop';
export const RUN_SOUND_PATH = 'assets/sound/433725__disagree__running-on-ground.flac';

export const OWW_SOUND_KEY = 'zed-oww-hurt';
export const OWW_SOUND_PATH = 'assets/sound/743351__qubodup__short-oww.wav';
export const OWW_SOUND_VOLUME = 0.7;

export const DEATH_SOUND_KEY = 'zed-death';
export const DEATH_SOUND_PATH = 'assets/sound/554443__blankened__male-death-sound.mp3';
export const DEATH_SOUND_VOLUME = 0.8;

// Whoosh key for a move (data-driven: moves opt in with `swingSound`), or null for silent swings.
export function swingSoundKey(move) {
  return (move && move.swingSound) || null;
}

export function isHeavyHit(armed, d, playerId) {
  return !!armed && d.attackerId === playerId && d.targetId !== playerId && d.amount > 0;
}

// Sound key for a move: heavy moves use the heavy sound, every other attack move counts as light.
export function hitSoundKey(move) {
  if (move && move.hitSound) return move.hitSound; // per-move override (e.g. light3 kick)
  return move && move.heavy ? HEAVY_HIT_SOUND_KEY : LIGHT_HIT_SOUND_KEY;
}
