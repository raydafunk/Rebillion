// Unreachable-enemy failsafe: guarantees the arena can always be cleared.
// Per frame: clamp live enemies into the bounds. On a slow check: an enemy that is off-screen
// too long, or chasing without moving, is repositioned to a wave spawn point; after
// `maxTeleports` repositions it is removed (spawner.remove + manager.destroy), which counts
// toward the wave clear. No Phaser.
import { FAILSAFE } from './arenaData.js';

export class ArenaFailsafe {
  /**
   * @param {object} o
   * @param {import('./ArenaBounds.js').ArenaBounds} o.bounds
   * @param {import('../enemies/EnemyManager.js').EnemyManager} o.manager
   * @param {import('../waves/WaveSpawner.js').WaveSpawner} o.spawner
   * @param {() => number} o.getScrollX actual camera scrollX
   * @param {(info:{id:string, reason:string, removed:boolean}) => void} [o.onAction]
   */
  constructor({ bounds, manager, spawner, getScrollX, cfg = FAILSAFE, onAction = null }) {
    this.bounds = bounds; this.manager = manager; this.spawner = spawner;
    this.getScrollX = getScrollX; this.cfg = cfg; this.onAction = onAction;
    this.track = new Map(); // id -> { offMs, stuckMs, ax, ay, teleports }
    this.sinceCheck = 0;
    this.cursor = 0;
  }

  _entry(g) {
    let t = this.track.get(g.id);
    if (!t) { t = { offMs: 0, stuckMs: 0, ax: g.x, ay: g.y, teleports: 0 }; this.track.set(g.id, t); }
    return t;
  }

  update(dtMs, target) {
    const grunts = this.manager.list().filter((g) => g.alive);
    // hard clamp every frame (knockback, bad spawns)
    for (const g of grunts) {
      const world = this.bounds.world;
      const c = this.bounds.locked ? this.bounds.clamp(g) : {
        x: Math.min(world.w, Math.max(0, g.x)), y: this.bounds.clamp(g).y,
      };
      if (c.x !== g.x || c.y !== g.y) g.teleport(c.x, c.y);
    }
    for (const id of [...this.track.keys()]) if (!this.manager.get(id)?.alive) this.track.delete(id);

    this.sinceCheck += dtMs;
    if (this.sinceCheck < this.cfg.checkEveryMs) return;
    const step = this.sinceCheck; this.sinceCheck = 0;

    const sx = this.getScrollX(), m = this.cfg.offscreenMargin, vw = this.bounds.view.w;
    for (const g of grunts) {
      const t = this._entry(g);
      const off = g.x < sx - m || g.x > sx + vw + m;
      t.offMs = off ? t.offMs + step : 0;

      const dist = target ? Math.hypot(target.x - g.x, target.y - g.y) : 0;
      const chasing = g.state === 'approach' && !g.circling && target && dist > g.data.attackRange;
      if (chasing) {
        if (Math.hypot(g.x - t.ax, g.y - t.ay) > this.cfg.stuckMinMove) { t.ax = g.x; t.ay = g.y; t.stuckMs = 0; }
        else t.stuckMs += step;
      } else { t.ax = g.x; t.ay = g.y; t.stuckMs = 0; }

      let reason = null;
      if (t.offMs >= this.cfg.offscreenMs) reason = 'offscreen';
      else if (t.stuckMs >= this.cfg.stuckMs) reason = 'stuck';
      if (reason) this._recover(g, t, reason);
    }
  }

  _recover(g, t, reason) {
    t.offMs = 0; t.stuckMs = 0; t.teleports++;
    if (t.teleports > this.cfg.maxTeleports) {
      this.spawner.remove(g.id);
      this.manager.destroy(g.id);
      this.track.delete(g.id);
      if (this.onAction) this.onAction({ id: g.id, reason, removed: true });
      return;
    }
    const w = this.spawner.currentWave;
    const pts = w ? w.spawnPoints : [{ x: this.getScrollX() + this.bounds.view.w / 2, y: this.bounds.lane.minY + 40 }];
    const p = this.bounds.clamp(pts[this.cursor++ % pts.length]);
    g.teleport(p.x, p.y);
    t.ax = p.x; t.ay = p.y;
    if (this.onAction) this.onAction({ id: g.id, reason, removed: false });
  }
}
