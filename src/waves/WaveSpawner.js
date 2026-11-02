// Wave sequencing. No Phaser. Talks to the world through injected callbacks and an emitter.
//   events:  { on, off, emit }  (game.events)
//   spawn:   (spec {id, enemy, x, y, waveIndex}) => void   (creates the enemy)
// Emits wave-started / wave-cleared / arena-cleared; consumes entity-died (team 'rust') and retry.
import { EVENTS } from '../shared/events.js';
import { WAVES } from './waveData.js';
import { pickSpawn, pickLeaderSpawn } from './spawnPatterns.js';
import { kindFor, elitePositions } from '../enemies/enemyKinds.js';

// A wave with a `leader` (a mini-boss, e.g. Level 1's Brick Dugan) sends it in first; the wave's own enemies follow this much later.
export const LEADER_LEAD_MS = 1800;
// leader.crewAfter 'first-move': the grunts hold back until the leader has finished his first move (leaderEngaged says so),
// then follow after crewDelayMs. CREW_MAX_WAIT_MS is the safety net: the crew always comes, so the wave can never stall.
export const CREW_AFTER = Object.freeze(['first-move']);
export const CREW_DELAY_MS = 900;
export const CREW_MAX_WAIT_MS = 9000;

export class WaveSpawner {
  // holdBetweenWaves (side-scrolling levels): a cleared wave is followed by phase 'hold' until advance() is
  // called, and clearing the last wave does NOT emit arena-cleared (the scene emits it at the level exit).
  // getPlayer (optional): () => ({ x, facing }) of Zed; waves with a spawnPattern use it to pick where enemies enter.
  // leaderEngaged (optional): (id) => true once that leader has finished his first move (or is gone). Without it, crewAfter is ignored.
  constructor({ events, spawn, waves = WAVES, idPrefix = 'grunt', holdBetweenWaves = false, getPlayer = null, leaderEngaged = null, rng = Math.random }) {
    this.getPlayer = getPlayer; this.rng = rng; this.leaderEngaged = leaderEngaged;
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
    this.crewWait = 0;            // ms left of the crewAfter hold (0 = not holding)
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
    this.leaderSpawned = false; this.crewWait = 0;
    this.phase = 'delay'; this.timer = this.waves[i].startDelayMs;
    const hint = this.waves[i].hint;
    this.events.emit(EVENTS.WAVE_STARTED, { index: i, total: this.waves.length, ...(hint ? { hint } : {}) });
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
    this.spawnFn({ id, enemy: L.enemy, x: pt.x, y: pt.y, waveIndex: this.waveIndex, skin: L.skin || null, hpMult: L.hpMult || 1, speedMult: L.speedMult || 1, leader: true });
  }

  _spawnOne() {
    const w = this.currentWave;
    const player = w.spawnPattern && this.getPlayer ? this.getPlayer() : null;
    const pt = player
      ? pickSpawn({ pattern: w.spawnPattern, lockX: w.lockX, index: this.spawned, count: w.count, waveIndex: this.waveIndex, player, anchorSide: this.surgeSide, rng: this.rng })
      : w.spawnPoints[this.spawnPointCursor++ % w.spawnPoints.length];
    const id = `${this.idPrefix}-${++this.idCounter}`;
    if (player && (w.spawnPattern === 'surge' || w.spawnPattern === 'pincer') && this.spawned === 0) this.surgeSide = pt.side; // surge: the wall keeps to its edge; pincer: pairs stay split across both edges
    this.alive.add(id);
    const idx = this.spawned++;
    // Elites are Breakers (skin eliteSkin, default 'rust-breaker'; Level 2 uses 'rust-breaker-2'): tougher. By default the last `elites` spawns
    // of a wave, so it opens on grunts and ends on the heavy; with mixElites they are scattered through the back of the wave.
    // A wave with `mix` cycles those kinds (grunt, rust-watcher, ...) for the other spawns; speedMult makes the whole wave move faster.
    const elite = elitePositions(w.count, w.elites || 0, !!w.mixElites).has(idx);
    const kind = w.mix && w.mix.length ? kindFor(w.mix[idx % w.mix.length]) : null;
    const wave = w.speedMult || 1;
    this.spawnFn({
      id, enemy: w.enemy, x: pt.x, y: pt.y, waveIndex: this.waveIndex,
      skin: elite ? (w.eliteSkin || 'rust-breaker') : kind ? kind.skin : w.sourceEnemy,
      hpMult: elite ? (w.eliteHpMult || 3) : kind ? kind.hpMult : (w.hpMult || 1),
      speedMult: elite ? wave * 0.9 : kind ? wave * kind.speedMult : wave, // heavies are a touch slower than the crowd
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
      if (w.leader && !this.leaderSpawned) {
        this._spawnLeader(); this.timer = w.leader.leadMs ?? LEADER_LEAD_MS;
        if (w.leader.crewAfter === 'first-move' && this.leaderEngaged) this.crewWait = w.leader.crewMaxWaitMs ?? CREW_MAX_WAIT_MS;
      }
      if (this.crewWait > 0) {
        // The leader fights alone until his first move is done (or he is down, or the safety net runs out); then the crew follows.
        this.crewWait -= dtMs;
        const engaged = [...this.leaderIds].some((id) => !this.alive.has(id) || this.leaderEngaged(id));
        if (!engaged && this.crewWait > 0) return;
        this.crewWait = 0;
        this.timer = w.leader.crewDelayMs ?? CREW_DELAY_MS;
        return;
      }
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
