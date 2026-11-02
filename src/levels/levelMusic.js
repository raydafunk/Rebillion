// Per-level background music. No Phaser. Files live in assets/sound/. All tracks are CC0 (OpenGameArt), see design/audio/audio-manifest.md.
export const LEVEL_MUSIC_VOLUME = 0.55; // fraction of the player's music volume; keeps hits and voices on top
export const LEVEL_MUSIC = Object.freeze({
  'level-01-brick-red-alley':    { key: 'level.music.1', path: 'assets/sound/level-01-funky-disco-beats.ogg' },
  'level-02-mustard-row':        { key: 'level.music.2', path: 'assets/sound/level-02-rhythm-garden-loop.ogg' },
  'level-03-greenline-courts':   { key: 'level.music.3', path: 'assets/sound/level-03-action-music-loop.mp3' },
  'level-04-stewpot-gardens':    { key: 'level.music.4', path: 'assets/sound/level-04-black-diamond.mp3' },
  'level-05-songwindow-heights': { key: 'level.music.5', path: 'assets/sound/level-05-cynic-battle-loop.ogg' },
  'level-06-iron-line-push':     { key: 'level.music.6', path: 'assets/sound/level-06-final-hour.ogg' },
  'level-07-copper-fang-courts': { key: 'level.music.7', path: 'assets/sound/level-07-fast-fight-looped.mp3' },
  'level-08-overseer-tower':     { key: 'level.music.8', path: 'assets/sound/level-08-boss-battle-theme.mp3' },
});
export const levelMusicFor = (levelId) => LEVEL_MUSIC[levelId] || null;
export const levelMusicVolume = (musicVolumePct = 70) => (Math.max(0, Math.min(100, musicVolumePct)) / 100) * LEVEL_MUSIC_VOLUME;

// End-of-level boss music. The last wave of every level is its end boss wave. Levels 1-7 share one track; the
// final level (Varr, level 8) gets its own. Both CC0 (OpenGameArt), see design/audio/audio-manifest.md.
export const BOSS_MUSIC = Object.freeze({
  endLevel: { key: 'boss.music.end', path: 'assets/sound/boss-end-level-omg-big-bad.ogg' },
  final:    { key: 'boss.music.final', path: 'assets/sound/boss-final-dark-forces.mp3' },
});
export const FINAL_LEVEL_ID = 'level-08-overseer-tower';
export const BOSS_FADE_MS = 700;
export const bossMusicFor = (levelId) => (levelId === FINAL_LEVEL_ID ? BOSS_MUSIC.final : BOSS_MUSIC.endLevel);
/** True when wave `index` (0-based) of a `waveCount`-wave level is the end boss wave. */
export const isBossWave = (index, waveCount) => waveCount > 0 && index === waveCount - 1;
