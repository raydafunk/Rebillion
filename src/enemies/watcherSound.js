// Pure: Rust Watcher voices. Zed's own punch/kick impact already plays on any enemy (player/heavyHit.js); this adds the Watcher's side:
// a grunt when he takes a hit and a death cry when he falls. No new files: the grunt and death-cry wavs the plain grunts use are loaded
// already (ArenaScene). The Watcher is tougher than a grunt but quicker than a Breaker, so he sits between them: a touch lower than a
// grunt (rate 0.95 / 0.93), and below the Ranger's higher, sharper voice.
import { GRUNT_HIT_SOUND_KEY, GRUNT_DEATH_SOUND_KEY } from './gruntSound.js';

export const WATCHER_SKIN = 'rust-watcher';
export const WATCHER_HIT_SOUND_KEY = GRUNT_HIT_SOUND_KEY;
export const WATCHER_HIT_SOUND_VOLUME = 0.62;
export const WATCHER_HIT_SOUND_RATE = 0.95;
export const WATCHER_HIT_SOUND_COOLDOWN_MS = 180; // per Watcher, so rapid hits / crowds do not stack
export const WATCHER_DEATH_SOUND_KEY = GRUNT_DEATH_SOUND_KEY;
export const WATCHER_DEATH_SOUND_VOLUME = 0.72;
export const WATCHER_DEATH_SOUND_RATE = 0.93;

export const isWatcherEnemy = (enemy) => !!enemy && enemy.skin === WATCHER_SKIN;

export function watcherSoundReady(lastMs, nowMs, cooldownMs = WATCHER_HIT_SOUND_COOLDOWN_MS) {
  return lastMs === undefined || nowMs - lastMs >= cooldownMs;
}

// Same rule as grunts: killing blow = death cry only, once; hits on the corpse are silent.
export function watcherVoiceFor(killed, alreadyDied) {
  if (alreadyDied) return null;
  return killed ? 'death' : 'hit';
}
