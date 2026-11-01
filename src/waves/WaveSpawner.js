// Wave sequencing. No Phaser. Talks to the world through injected callbacks and an emitter.
//   events:  { on, off, emit }  (game.events)
//   spawn:   (spec {id, enemy, x, y, waveIndex}) => void   (creates the enemy)
// Emits wave-started / wave-cleared / arena-cleared; consumes entity-died (team 'rust') and retry.
import { EVENTS } from '../shared/events.js';
import { WAVES } from './waveData.js';
import { pickSpawn, pickLeaderSpawn } from './spawnPatterns.js';

// A wave with a `leader` (a mini-boss, e.g. Level 1's Brick Dugan) sends it in first; the wave's own enemies follow this much later.
export const LEADER_LEAD_MS = 1800;

export class WaveSpawner {
  // holdBetweenWaves (side-scrolling levels): a cleared wave is followed by phase 'hold' until advance() is
  // called, and clearing the last wave does NOT emit arena-cleared (the scene emits it at the level exit).
  // getPlayer (optional): () => ({ x, facing }) of Zed; waves with a spawnPattern use it to pick where enemies enter.
  constructor({ events, spawn, waves = WAVES, idPrefix = 'grunt', holdBetweenWaves = false, getPlayer = null, rng = Math.random }) {
    this.getPlayer = getPlayer; this.rng = rng;
    this.events = events; this.spawnFn = spawn; this.waves = waves; this.idPrefix = idPrefix;
    this.hold = holdBetweenWaves;
    this.idCounter = 0;
    this.alive = new Set();
    this._onDied = (p) => { if (p && p.team === 'rust') this.remove(p.id); };
    this._onRetry = () => this.restart();
    events.on(EVENTS.ENTITY_DIED, this._onDied);
    events.on(EVENTS.RETRY, this._onRetry);
    this._reset();
  }

  _reset() {
    this.waveIndex = -1;       // -1 = not started
    this.phase = 'idle';       // idle | delay | spawning | fighting | done
    this.timer = 0;
    this.spawned = 0;
    this.spawnPointCursor = 0;
    this.alive.clear();
    this.leaderIds = new Set();   // ids of wave leaders: they do not count against maxAlive
    this.leaderSpawned = false;
  }

  get aliveCount() { return this.alive.size; }
  get finished() { return this.phase === 'done'; }
  get holding() { return this.phase === 'hold'; }
  get nextWave() { return this.waves[this.waveIndex + 1] || null; }
  get currentWave() { return this.waves[this.waveIndex] || null; }

  /** Begin wave 1 (or wave `from`, 0-based, for testing a single wave). Call when the round starts. A retry restarts from the same wave. */
  start(from = 0) { this._reset(); this.startIndex = Math.min(Math.max(0, from), this.waves.length - 1); this._beginWave(this.startIndex); }
  restart() { this.start(this.startIndex || 0); }

  _beginWave(i) {
    this.waveIndex = i; this.spawned = 0; this.spawnPointCursor = 0; this.surgeSide = null;
    this.leaderSpawned = false;
    this.phase = 'delay'; this.timer = this.waves[i].startDelayMs;
    this.events.emit(EVENTS.WAVE_STARTED, { index: i, total: this.waves.length });
  }

  /** Hold mode: start the next wave (the player has walked up to it). */
  advance() { if (this.phase === 'hold') this._beginWave(this.waveIndex + 1); }

  /** Remove an enemy from the alive set (death, or failsafe removal). */
  remove(id) {
    if (!this.alive.delete(id)) return;
    this._checkCleared();
  }

  _checkCleared() {
    if (this.phase !== 'fighting' || this.alive.size > 0) return;
    const i = this.waveIndex;
    this.events.emit(EVENTS.WAVE_CLEARED, { index: i });
    if (i + 1 >= this.waves.length) {
      this.phase = 'done';
      if (!this.hold) this.events.emit(EVENTS.ARENA_CLEARED, {});
    } else if (this.hold) {
      this.phase = 'hold';
    } else {
      this.phase = 'delay'; // next wave starts after its own delay, announced via wave-started
      this._beginWave(i + 1);
    }
  }

  get regularAliveCount() { let n = 0; for (const id of this.alive) if (!this.leaderIds.has(id)) n++; return n; }

  _spawnLeader() {
    const w = this.currentWave, L = w.leader;
    const player = this.getPlayer ? this.getPlayer() : null;
    const pt = player ? pickLeaderSpawn({ entrance: L.entrance, lockX: w.lockX, player }) : w.spawnPoints[1 % w.spawnPoints.length];
    const id = `${String(L.enemy).replace(/^rust-/, '')}-${++this.idCounter}`;
    this.alive.add(id); this.leaderIds.add(id);
    this.leaderSpawned = true;
    this.spawnFn({ id, enemy: L.enemy, x: pt.x, y: pt.y, waveIndex: this.waveIndex, skin: L.skin || null, hpMult: L.hpMult || 1, leader: true });
  }

  _spawnOne() {
    const w = this.currentWave;
    const player = w.spawnPattern && this.getPlayer ? this.getPlayer() : null;
    const pt = player
      ? pickSpawn({ pattern: w.spawnPattern, lockX: w.lockX, index: this.spawned, count: w.count, waveIndex: this.waveIndex, player, anchorSide: this.surgeSide, rng: this.rng })
      : w.spawnPoints[this.spawnPointCursor++ % w.spawnPoints.length];
    const id = `${this.idPrefix}-${++this.idCounter}`;
    if (player && w.spawnPattern === 'surge' && this.spawned === 0) this.surgeSide = pt.side; // the wall keeps to the edge it started on
    this.alive.add(id);
    this.spawned++;
    // The last `elites` spawns of a wave are Breakers: tougher, so the wave opens on grunts and ends on the heavy.
    const elite = this.spawned > w.count - (w.elites || 0);
    this.spawnFn({
      id, enemy: w.enemy, x: pt.x, y: pt.y, waveIndex: this.waveIndex,
      skin: elite ? 'rust-breaker' : w.sourceEnemy, hpMult: elite ? (w.eliteHpMult || 3) : (w.hpMult || 1),
    });
  }

  update(dtMs) {
    const w = this.currentWave;
    if (!w) return;
    if (this.phase === 'delay') {
      this.timer -= dtMs;
      if (this.timer > 0) return;
      this.phase = 'spawning'; this.timer = 0;
    }
    if (this.phase === 'spawning') {
      if (w.leader && !this.leaderSpawned) { this._spawnLeader(); this.timer = w.leader.leadMs ?? LEADER_LEAD_MS; }
      this.timer -= dtMs;
      while (this.timer <= 0 && this.spawned < w.count && this.regularAliveCount < w.maxAlive) {
        this._spawnOne();
        this.timer += w.spawnIntervalMs;
      }
      if (this.timer < 0) this.timer = 0;
      if (this.spawned >= w.count) { this.phase = 'fighting'; this._checkCleared(); }
    }
  }

  destroy() {
    this.events.off(EVENTS.ENTITY_DIED, this._onDied);
    this.events.off(EVENTS.RETRY, this._onRetry);
  }
}
