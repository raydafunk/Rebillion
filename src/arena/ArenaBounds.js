// World bounds + camera lock logic. Pure (no Phaser); ArenaScene applies the result to the camera.
// Consumes wave-started / wave-cleared / arena-cleared / retry.
import { EVENTS } from '../shared/events.js';
import { VIEW, WORLD, LANE, LOCK_MARGIN } from './arenaData.js';
import { WAVES } from '../waves/waveData.js';

export class ArenaBounds {
  constructor({ events, waves = WAVES, view = VIEW, world = WORLD, lane = LANE, margin = LOCK_MARGIN }) {
    this.events = events; this.waves = waves; this.view = view; this.world = world;
    this.lane = lane; this.margin = margin;
    this.locked = false;
    this.lockX = 0;
    this._onStart = ({ index }) => {
      const w = this.waves[index];
      this.locked = true; this.lockX = w ? w.lockX : this.lockX;
    };
    this._onClear = () => { this.locked = false; };
    this._onArena = () => { this.locked = false; this.released = true; };
    this._onRetry = () => { this.locked = false; this.released = false; this.lockX = 0; };
    this.released = false;
    events.on(EVENTS.WAVE_STARTED, this._onStart);
    events.on(EVENTS.WAVE_CLEARED, this._onClear);
    events.on(EVENTS.ARENA_CLEARED, this._onArena);
    events.on(EVENTS.RETRY, this._onRetry);
  }

  /** Horizontal fighting range right now: the locked screen, or the whole world. */
  get xRange() {
    if (this.locked) return { min: this.lockX + this.margin, max: this.lockX + this.view.w - this.margin };
    return { min: 0, max: this.world.w };
  }

  /** Clamp a position into the walkable area (use for player and enemies). */
  clamp(p) {
    const r = this.xRange;
    return {
      x: Math.min(r.max, Math.max(r.min, p.x)),
      y: Math.min(this.lane.maxY, Math.max(this.lane.minY, p.y)),
    };
  }

  /** True if inside the whole world (regardless of lock). */
  inWorld(p) {
    return p.x >= 0 && p.x <= this.world.w && p.y >= this.lane.minY - 200 && p.y <= this.world.h;
  }

  /**
   * Desired camera scrollX. While locked: fixed at the wave's lockX.
   * Otherwise follows followX (player) clamped to the world.
   */
  cameraScrollX(followX = 0) {
    if (this.locked) return this.lockX;
    const x = followX - this.view.w / 2;
    return Math.min(this.world.w - this.view.w, Math.max(0, x));
  }

  /** The currently visible x span, given the actual camera scroll. */
  viewRect(scrollX) { return { x: scrollX, y: 0, w: this.view.w, h: this.view.h }; }

  /**
   * Phaser glue (call each frame from ArenaScene.update):
   *   arenaBounds.applyToCamera(this.cameras.main, player.x)
   * Camera uses world bounds and eases to the target scroll so locks pan instead of snapping.
   */
  applyToCamera(cam, followX, lerp = 0.12) {
    cam.setBounds(0, 0, this.world.w, this.world.h);
    const target = this.cameraScrollX(followX);
    cam.scrollX += (target - cam.scrollX) * lerp;
    if (Math.abs(target - cam.scrollX) < 0.5) cam.scrollX = target;
  }

  dispose() {
    this.events.off(EVENTS.WAVE_STARTED, this._onStart);
    this.events.off(EVENTS.WAVE_CLEARED, this._onClear);
    this.events.off(EVENTS.ARENA_CLEARED, this._onArena);
    this.events.off(EVENTS.RETRY, this._onRetry);
  }
}
