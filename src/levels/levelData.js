// Level data: turns content/levels/*.json into the wave tables the arena consumes. No Phaser.
// Level files list expansion enemies (rust-watcher, rust-breaker, ...) that are not built yet; until they
// exist every spawn is a grunt (STAND_IN) and the original id is kept in level.standIns for later.
import { WAVES } from '../waves/waveData.js';
import { ROUND_TIME_SECONDS } from '../state/config.js';
import { SPAWN_PATTERNS, LEADER_ENTRANCES } from '../waves/spawnPatterns.js';
import { CREW_AFTER } from '../waves/WaveSpawner.js';
import { SPEED_MULT_RANGE } from '../enemies/enemyKinds.js';

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
    // Optional pacing fields: spawnPattern (where enemies enter), hpMult (every enemy of the wave), attackerCap (enemies swinging at once), elites (Breakers closing the wave),
    // restPickup ({ heal }: health item dropped on the walk to the next wave).
    ...(raw.hpMult ? { hpMult: raw.hpMult } : {}),
    ...(raw.spawnPattern ? { spawnPattern: raw.spawnPattern } : {}),
    ...(raw.attackerCap ? { attackerCap: raw.attackerCap } : {}),
    ...(raw.elites ? { elites: Math.min(raw.elites, raw.count), eliteHpMult: raw.eliteHpMult || 3, ...(raw.eliteSkin ? { eliteSkin: raw.eliteSkin } : {}) } : {}),
    // mix: kind ids cycled in spawn order (grunt, rust-watcher, ...); speedMult: how much faster the wave's enemies move; mixElites: scatter the elites instead of ending on them.
    ...(raw.mix ? { mix: [...raw.mix] } : {}),
    ...(raw.speedMult ? { speedMult: raw.speedMult } : {}),
    ...(raw.mixElites ? { mixElites: true } : {}),
    ...(raw.mixRandom ? { mixRandom: true } : {}), // mixRandom: pick each spawn's kind from `mix` at random instead of cycling
    ...(raw.restPickup ? { restPickup: { heal: raw.restPickup.heal } } : {}),
    // finishDrop (last wave only): level-end loot, { heals: [heal, ...], weapons: n } health items and throwable weapons scattered over the cleared screen.
    ...(raw.finishDrop ? { finishDrop: { heals: [...(raw.finishDrop.heals || [])], weapons: raw.finishDrop.weapons || 0 } } : {}),
    // hint: one line of coaching shown under the wave banner (the HUD reads it from wave-started).
    ...(raw.hint ? { hint: String(raw.hint) } : {}),
    // leader: a mini-boss that walks in first and fights alongside the wave's grunts (does not count against maxAlive, or toward `count`).
    // crewAfter 'first-move': the wave's grunts wait until the leader has made his first move (crewDelayMs after it, crewMaxWaitMs safety net).
    ...(raw.leader ? { leader: { enemy: raw.leader.enemy, entrance: raw.leader.entrance || 'far-side', gate: !!raw.leader.gate, ...(raw.leader.hpMult ? { hpMult: raw.leader.hpMult } : {}), ...(raw.leader.speedMult ? { speedMult: raw.leader.speedMult } : {}),
      ...(raw.leader.crewAfter ? { crewAfter: raw.leader.crewAfter } : {}), ...(raw.leader.crewDelayMs !== undefined ? { crewDelayMs: raw.leader.crewDelayMs } : {}), ...(raw.leader.crewMaxWaitMs !== undefined ? { crewMaxWaitMs: raw.leader.crewMaxWaitMs } : {}) } } : {}),
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
    if (w.spawnPattern !== undefined && !SPAWN_PATTERNS.includes(w.spawnPattern)) errs.push(`wave ${i + 1}: spawnPattern must be one of ${SPAWN_PATTERNS.join('|')}`);
    if (w.hpMult !== undefined && !(w.hpMult >= 1 && w.hpMult <= 10)) errs.push(`wave ${i + 1}: hpMult must be 1-10`);
    if (w.attackerCap !== undefined && !(Number.isInteger(w.attackerCap) && w.attackerCap >= 1)) errs.push(`wave ${i + 1}: attackerCap must be an integer >= 1`);
    if (w.elites !== undefined && !(Number.isInteger(w.elites) && w.elites >= 0 && w.elites <= w.count)) errs.push(`wave ${i + 1}: elites must be 0..count`);
    if (w.mix !== undefined && !(Array.isArray(w.mix) && w.mix.length > 0 && w.mix.every((k) => typeof k === 'string' && k))) errs.push(`wave ${i + 1}: mix must be a non-empty list of enemy ids`);
    if (w.speedMult !== undefined && !(w.speedMult >= SPEED_MULT_RANGE[0] && w.speedMult <= SPEED_MULT_RANGE[1])) errs.push(`wave ${i + 1}: speedMult must be ${SPEED_MULT_RANGE[0]}-${SPEED_MULT_RANGE[1]}`);
    if (w.leader && w.leader.speedMult !== undefined && !(w.leader.speedMult >= SPEED_MULT_RANGE[0] && w.leader.speedMult <= SPEED_MULT_RANGE[1])) errs.push(`wave ${i + 1}: leader.speedMult must be ${SPEED_MULT_RANGE[0]}-${SPEED_MULT_RANGE[1]}`);
    if (w.eliteSkin !== undefined && !(typeof w.eliteSkin === 'string' && w.eliteSkin.length > 0)) errs.push(`wave ${i + 1}: eliteSkin must be a non-empty string`);
    if (w.leader !== undefined && !(w.leader && typeof w.leader.enemy === 'string' && (w.leader.entrance === undefined || LEADER_ENTRANCES.includes(w.leader.entrance)))) errs.push(`wave ${i + 1}: leader needs an enemy id and an entrance of ${LEADER_ENTRANCES.join('|')}`);
    if (w.leader && w.leader.crewAfter !== undefined && !CREW_AFTER.includes(w.leader.crewAfter)) errs.push(`wave ${i + 1}: leader.crewAfter must be one of ${CREW_AFTER.join('|')}`);
    if (w.leader && w.leader.crewMaxWaitMs !== undefined && !(w.leader.crewMaxWaitMs > 0 && w.leader.crewMaxWaitMs <= 20000)) errs.push(`wave ${i + 1}: leader.crewMaxWaitMs must be 1-20000`);
    if (w.hint !== undefined && !(typeof w.hint === 'string' && w.hint.length > 0 && w.hint.length <= 80)) errs.push(`wave ${i + 1}: hint must be 1-80 characters`);
    if (w.finishDrop !== undefined && !(w.finishDrop && (w.finishDrop.heals === undefined || (Array.isArray(w.finishDrop.heals) && w.finishDrop.heals.every((h) => h > 0 && h <= 100))) && (w.finishDrop.weapons === undefined || (Number.isInteger(w.finishDrop.weapons) && w.finishDrop.weapons >= 0 && w.finishDrop.weapons <= 8)))) errs.push(`wave ${i + 1}: finishDrop needs heals (each 1-100) and weapons (0-8)`);
    if (w.restPickup !== undefined &&!(w.restPickup && w.restPickup.heal > 0 && w.restPickup.heal <= 100)) errs.push(`wave ${i + 1}: restPickup.heal must be 1-100`);
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
    restartTimerOnBoss: !!raw.restartTimerOnBoss, // the clock resets to full when a leader (boss) wave starts
    intro: raw.intro || '',
    outro: raw.outro || '',
    waves,
    scrolling: true,
    worldWidth: worldWidthFor(waves.length),
    exitX: worldWidthFor(waves.length) - EXIT_INSET,
    totalEnemies: waves.reduce((n, w) => n + w.count + (w.leader ? 1 : 0), 0),
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

/** The fallback round (Level 1 table in waveData.js + config.js) as a level; fallback when level files cannot be loaded. */
export function legacyLevel() {
  return Object.freeze({
    id: 'level-00-tier0', name: 'The Arena', order: 0, district: '', theme: '', palette: [],
    timeLimitSec: ROUND_TIME_SECONDS, intro: '', outro: '',
    waves: WAVES, scrolling: false, worldWidth: 1920, exitX: null, totalEnemies: WAVES.reduce((n, w) => n + w.count + (w.leader ? 1 : 0), 0), standIns: [],
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
