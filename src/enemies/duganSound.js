// Pure: Brick Dugan's hit sounds. Zed's own punch/kick impact already plays on any enemy (see player/heavyHit.js), so this adds
// Dugan's side: a deep grunt when he takes a hit, a death cry when he falls, and a heavy thud when one of his blows lands on Zed.
export const DUGAN_HIT_VOICE_KEY = 'dugan-hit-voice';
export const DUGAN_HIT_VOICE_PATH = 'assets/sound/262279__dirtjm__grunts-male.wav'; // same file as the grunt voice, played slower = deeper
export const DUGAN_HIT_VOICE_VOLUME = 0.8;
export const DUGAN_HIT_VOICE_RATE = 0.72;
export const DUGAN_HIT_VOICE_COOLDOWN_MS = 450; // he is hit often; a grunt on every blow would drown the fight

export const DUGAN_DEATH_SOUND_KEY = 'dugan-death-voice';
export const DUGAN_DEATH_SOUND_PATH = 'assets/sound/695388__fmaudio__male-death-cry-5.wav';
export const DUGAN_DEATH_SOUND_VOLUME = 0.95;
export const DUGAN_DEATH_SOUND_RATE = 0.85;

export const DUGAN_IMPACT_SOUND_KEY = 'dugan-impact';
export const DUGAN_IMPACT_SOUND_PATH = 'assets/sound/524950__magnuswaker__punch-hard-1.wav';
export const DUGAN_IMPACT_VOLUME = 0.9;
export const DUGAN_IMPACT_BLOCKED_VOLUME = 0.45; // Zed guarding: the blow still thuds, softer
export const DUGAN_IMPACT_COOLDOWN_MS = 120;     // a stomp wave re-sends hit-requests; one thud per burst

export function isDugan(enemy) { return !!enemy && enemy.isBoss === true; }

// lastMs: last play time (or undefined); nowMs: current time.
export function duganSoundReady(lastMs, nowMs, cooldownMs) {
  return lastMs === undefined || nowMs - lastMs >= cooldownMs;
}

// Same rule as grunts: killing blow = death cry only, once; hits on the corpse are silent.
export function duganVoiceFor(killed, alreadyDied) {
  if (alreadyDied) return null;
  return killed ? 'death' : 'hit';
}

// Volume for a Dugan blow landing on Zed: null when nothing connects (parried = negated), softer when blocked.
export function duganImpactVolume(guardType) {
  if (guardType === 'parry') return null;
  return guardType === 'block' ? DUGAN_IMPACT_BLOCKED_VOLUME : DUGAN_IMPACT_VOLUME;
}
