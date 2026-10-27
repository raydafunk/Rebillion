// Level data: turns content/levels/*.json into the wave tables the arena consumes. No Phaser.
// Level files list expansion enemies (rust-watcher, rust-breaker, ...) that are not built yet; until they
// exist every spawn is a grunt (STAND_IN) and the original id is kept in level.standIns for later.
import { WAVES } from '../waves/waveData.js';
import { ROUND_TIME_SECONDS } from '../state/config.js';

export const LEVEL_FILES = Object.freeze([
  'content/levels/levels.json',
  'content/levels/rust-gdd-levels.json',
]);
export const STYLE_DIR = 'content/levels/styles/';
export const STAND_IN = 'grunt';
export const MIN_SPAWN_INTERVAL_MS = 300;

const VIEW_W = 1280;
// Side-scrolling layout: wave i locks the camera at i * WAVE_SPACING. After the last wave the player runs
// END_RUN further right to the exit gate, which sits EXIT_INSET from the right edge of the world.
export const WAVE_SPACING = 800;
export const END_RUN = 700;
export const EXIT_INSET = 110;
export const worldWidthFor = (waveCount) => (waveCount - 1) * WAVE_SPACING + VIEW_W + END_RUN;
// Same four edge positions waveData.js uses, relative to the locked camera.
const spawnPointsFor = (lockX) => [
  { x: lockX + 60, y: 520 },
  { x: lockX + VIEW_W - 60, y: 580 },
  { x: lockX + 60, y: 640 },
  { x: lockX + VIEW_W - 60, y: 500 },
];

// Used when a level has no style file yet. Style agents fill content/levels/styles/<id>.json.
export const DEFAULT_STYLE = Object.freeze({
  background: Object.freeze({ path: null, overlay: null }),
});

export const styleUrl = (id) => `${STYLE_DIR}${id}.json`;

/** Wave from level JSON -> the shape WaveSpawner/ArenaBounds use (adds lockX + spawnPoints). */
export function buildWave(raw, i) {
  const lockX = i * WAVE_SPACING;
  return {
    enemy: STAND_IN,
    sourceEnemy: raw.enemy,
    count: raw.count,
    maxAlive: Math.min(raw.maxAlive, raw.count),
    spawnIntervalMs: raw.spawnIntervalMs,
    startDelayMs: raw.startDelayMs,
    lockX,
    spawnPoints: spawnPointsFor(lockX),
    // Optional pacing fields: hpMult (every enemy of the wave), attackerCap (enemies swinging at once), elites (Breakers closing the wave),
    // restPickup ({ heal }: health item dropped on the walk to the next wave).
    ...(raw.hpMult ? { hpMult: raw.hpMult } : {}),
    ...(raw.attackerCap ? { attackerCap: raw.attackerCap } : {}),
    ...(raw.elites ? { elites: Math.min(raw.elites, raw.count), eliteHpMult: raw.eliteHpMult || 3 } : {}),
    ...(raw.restPickup ? { restPickup: { heal: raw.restPickup.heal } } : {}),
  };
}

/** Problems that would break the spawner or the timer. Empty array = playable. */
export function levelErrors(raw) {
  const errs = [];
  if (!raw || typeof raw.id !== 'string') return ['missing id'];
  if (!Number.isFinite(raw.timeLimitSec) || raw.timeLimitSec <= 0) errs.push('timeLimitSec must be > 0');
  if (!Array.isArray(raw.waves) || raw.waves.length === 0) errs.push('needs at least one wave');
  else raw.waves.forEach((w, i) => {
    if (!Number.isInteger(w.count) || w.count < 1) errs.push(`wave ${i + 1}: count must be an integer >= 1`);
    if (!Number.isInteger(w.maxAlive) || w.maxAlive < 1) errs.push(`wave ${i + 1}: maxAlive must be an integer >= 1`);
    if (!(w.spawnIntervalMs >= MIN_SPAWN_INTERVAL_MS)) errs.push(`wave ${i + 1}: spawnIntervalMs must be >= ${MIN_SPAWN_INTERVAL_MS}`);
    if (!(w.startDelayMs >= 0)) errs.push(`wave ${i + 1}: startDelayMs must be >= 0`);
    if (w.hpMult !== undefined && !(w.hpMult >= 1 && w.hpMult <= 10)) errs.push(`wave ${i + 1}: hpMult must be 1-10`);
    if (w.attackerCap !== undefined && !(Number.isInteger(w.attackerCap) && w.attackerCap >= 1)) errs.push(`wave ${i + 1}: attackerCap must be an integer >= 1`);
    if (w.elites !== undefined && !(Number.isInteger(w.elites) && w.elites >= 0 && w.elites <= w.count)) errs.push(`wave ${i + 1}: elites must be 0..count`);
    if (w.restPickup !== undefined && !(w.restPickup && w.restPickup.heal > 0 && w.restPickup.heal <= 100)) errs.push(`wave ${i + 1}: restPickup.heal must be 1-100`);
  });
  return errs;
}

export function buildLevel(raw, style) {
  const waves = raw.waves.map(buildWave);
  return Object.freeze({
    id: raw.id,
    name: raw.name || raw.id,
    order: raw.order ?? 0,
    district: raw.district || '',
    theme: raw.theme || '',
    palette: raw.palette || [],
    timeLimitSec: raw.timeLimitSec,
    intro: raw.intro || '',
    outro: raw.outro || '',
    waves,
    scrolling: true,
    worldWidth: worldWidthFor(waves.length),
    exitX: worldWidthFor(waves.length) - EXIT_INSET,
    totalEnemies: waves.reduce((n, w) => n + w.count, 0),
    standIns: [...new Set(waves.map((w) => w.sourceEnemy).filter((e) => e && e !== STAND_IN))],
    style: { ...DEFAULT_STYLE, ...style, background: { ...DEFAULT_STYLE.background, ...(style && style.background) } },
  });
}

/** rawLists: array of level arrays (one per file). styles: { [levelId]: styleJson }. Invalid levels are skipped. */
export function buildLevels(rawLists, styles = {}, onSkip = () => {}) {
  const seen = new Set();
  const out = [];
  for (const raw of rawLists.flat()) {
    const errs = levelErrors(raw);
    if (!errs.length && seen.has(raw.id)) errs.push('duplicate id');
    if (errs.length) { onSkip(raw && raw.id, errs); continue; }
    seen.add(raw.id);
    out.push(buildLevel(raw, styles[raw.id]));
  }
  return out.sort((a, b) => a.order - b.order);
}

/** The Tier 0 round (waveData.js + config.js) as a level; fallback when level files cannot be loaded. */
export function legacyLevel() {
  return Object.freeze({
    id: 'level-00-tier0', name: 'The Arena', order: 0, district: '', theme: '', palette: [],
    timeLimitSec: ROUND_TIME_SECONDS, intro: '', outro: '',
    waves: WAVES, scrolling: false, worldWidth: 1920, exitX: null, totalEnemies: WAVES.reduce((n, w) => n + w.count, 0), standIns: [],
    style: { ...DEFAULT_STYLE },
  });
}

/** fetchJson(path) -> Promise<json>. Style files are optional (a missing one means the default style). */
export async function loadLevelContent(fetchJson, { onSkip } = {}) {
  const lists = await Promise.all(LEVEL_FILES.map((f) => fetchJson(f).catch(() => [])));
  const ids = lists.flat().map((l) => l && l.id).filter(Boolean);
  const styles = {};
  await Promise.all(ids.map(async (id) => {
    try { styles[id] = await fetchJson(styleUrl(id)); } catch { /* default style */ }
  }));
  const levels = buildLevels(lists, styles, onSkip);
  return levels.length ? levels : [legacyLevel()];
}

/** Index of the level after `index`; null after the last. */
export const nextLevelIndex = (levels, index) => (index + 1 < levels.length ? index + 1 : null);
