// Applies the Options audio settings and the main-menu mute button to Phaser's sound manager, for every scene.
// Pure helpers are separate from the Phaser wiring so they can be unit tested. Owner: menu-ui-agent.
//
//   masterVolume  -> game.sound.volume (multiplies everything)
//   sfxVolume     -> multiplies the volume of every sound.play() one-shot (music uses sound.add, so it is untouched)
//   musicVolume   -> read by scenes that add a looping track (MenuScene, ResultScene) via musicLevel()
//   muteOnFocusLoss -> game.sound.pauseOnBlur
//   mute button   -> game.sound.mute (kept in its own storage key so it saves instantly, not through Apply)

import { loadSettings } from './optionsData.js';

export const MUTE_KEY = 'rebellion.muted.v1';

export const pct = (v, fallback) => Math.min(1, Math.max(0, (Number.isFinite(v) ? v : fallback) / 100));
export const musicLevel = (settings) => pct(settings?.musicVolume, 70);
export const sfxLevel = (settings) => pct(settings?.sfxVolume, 80);
export const masterLevel = (settings) => pct(settings?.masterVolume, 80);

export function loadMuted(storage) {
  try { return !!storage && storage.getItem(MUTE_KEY) === '1'; } catch (e) { return false; }
}
export function saveMuted(storage, muted) {
  try { if (!storage) return false; storage.setItem(MUTE_KEY, muted ? '1' : '0'); return true; } catch (e) { return false; }
}

const store = () => { try { return globalThis.localStorage; } catch (e) { return null; } };

/**
 * Install once per Phaser.Game (safe to call again from any scene). Reads the saved options and mute flag,
 * applies them, and wraps sound.play so effects obey the SFX slider. Returns the shared audio state.
 */
export function installAudio(game, settings) {
  const sm = game.sound;
  let st = game.__audio;
  if (!st) {
    st = game.__audio = { settings: settings || loadSettings(store()), muted: loadMuted(store()), listeners: new Set() };
    const rawPlay = sm.play.bind(sm);
    sm.play = (key, extra) => {
      const cfg = { ...(extra || {}) };
      cfg.volume = (cfg.volume ?? 1) * sfxLevel(st.settings);
      return rawPlay(key, cfg);
    };
  }
  if (settings) st.settings = settings;
  applyAudio(game);
  return st;
}

/** Push the current settings and mute flag into the sound manager. Call after Apply or after toggling mute. */
export function applyAudio(game) {
  const st = game.__audio;
  if (!st) return;
  game.sound.volume = masterLevel(st.settings);
  game.sound.mute = st.muted;
  game.sound.pauseOnBlur = st.settings.muteOnFocusLoss !== false;
  st.listeners.forEach((fn) => fn(st));
}

export const isMuted = (game) => !!(game.__audio && game.__audio.muted);

export function setMuted(game, muted) {
  const st = game.__audio || installAudio(game);
  st.muted = !!muted;
  saveMuted(store(), st.muted);
  applyAudio(game);
  return st.muted;
}
export const toggleMuted = (game) => setMuted(game, !isMuted(game));

/** Subscribe to audio changes (returns an unsubscribe function). */
export function onAudioChange(game, fn) {
  const st = game.__audio || installAudio(game);
  st.listeners.add(fn);
  return () => st.listeners.delete(fn);
}
