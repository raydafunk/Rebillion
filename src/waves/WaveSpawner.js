// Wave sequencing. No Phaser. Talks to the world through injected callbacks and an emitter.
//   events:  { on, off, emit }  (game.events)
//   spawn:   (spec {id, enemy, x, y, waveIndex}) => void   (creates the enemy)
// Emits wave-started / wave-cleared / arena-cleared; consumes entity-died (team 'rust') and retry.
import { EVENTS } from '../shared/events.js';
import { WAVES } from './waveData.js';
import { pickSpawn } from './spawnPatterns.js';

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
  }

  get aliveCount() { return this.alive.size; }
  get finished() { return this.phase === 'done'; }
  get holding() { return this.phase === 'hold'; }
  get nextWave() { return this.waves[this.waveIndex + 1] || null; }
  get currentWave() { return this.waves[this.waveIndex] || null; }

  /** Begin wave 1. Call when the round starts. */
  start() { this._reset(); this._beginWave(0); }
  restart() { this.start(); }

  _beginWave(i) {
    this.waveIndex = i; this.spawned = 0; this.spawnPointCursor = 0; this.surgeSide = null;
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
      this.timer -= dtMs;
      while (this.timer <= 0 && this.spawned < w.count && this.alive.size < w.maxAlive) {
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
