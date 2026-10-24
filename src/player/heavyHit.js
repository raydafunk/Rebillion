// Pure: decides whether a damage-applied result should trigger Zed's hit sound.
// `armed` is truthy only while Zed's hit-request is being resolved (see Zed._emitHit).
export const HEAVY_HIT_SOUND_KEY = 'zed-heavy-hit';
export const HEAVY_HIT_SOUND_PATH = 'assets/sound/punch-hard-1-small.wav';
export const LIGHT_HIT_SOUND_KEY = 'zed-light-hit';
export const LIGHT_HIT_SOUND_PATH = 'assets/sound/560325__jakeeaton__punch-2.wav';

export function isHeavyHit(armed, d, playerId) {
  return !!armed && d.attackerId === playerId && d.targetId !== playerId && d.amount > 0;
}

// Sound key for a move: heavy moves use the heavy sound, every other attack move counts as light.
export function hitSoundKey(move) {
  return move && move.heavy ? HEAVY_HIT_SOUND_KEY : LIGHT_HIT_SOUND_KEY;
}
