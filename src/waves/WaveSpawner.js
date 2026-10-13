// Wave sequencing. No Phaser. Talks to the world through injected callbacks and an emitter.
//   events:  { on, off, emit }  (game.events)
//   spawn:   (spec {id, enemy, x, y, waveIndex}) => void   (creates the enemy)
// Emits wave-started / wave-cleared / arena-cleared; consumes entity-died (team 'rust') and retry.
import { EVENTS } from '../shared/events.js';
import { WAVES } from './waveData.js';

export class WaveSpawner {
  constructor({ events, spawn, waves = WAVES, idPrefix = 'grunt' }) {
    this.events = events; this.spawnFn = spawn; this.waves = waves; this.idPrefix = idPrefix;
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
  get currentWave() { return this.waves[this.waveIndex] || null; }

  /** Begin wave 1. Call when the round starts. */
  start() { this._reset(); this._beginWave(0); }
  restart() { this.start(); }

  _beginWave(i) {
    this.waveIndex = i; this.spawned = 0; this.spawnPointCursor = 0;
    this.phase = 'delay'; this.timer = this.waves[i].startDelayMs;
    this.events.emit(EVENTS.WAVE_STARTED, { index: i, total: this.waves.length });
  }

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
      this.events.emit(EVENTS.ARENA_CLEARED, {});
    } else {
      this.phase = 'delay'; // next wave starts after its own delay, announced via wave-started
      this._beginWave(i + 1);
    }
  }

  _spawnOne() {
    const w = this.currentWave;
    const pt = w.spawnPoints[this.spawnPointCursor++ % w.spawnPoints.length];
    const id = `${this.idPrefix}-${++this.idCounter}`;
    this.alive.add(id);
    this.spawned++;
    this.spawnFn({ id, enemy: w.enemy, x: pt.x, y: pt.y, waveIndex: this.waveIndex });
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
