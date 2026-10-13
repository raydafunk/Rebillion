// Facade for ArenaScene. One object wires enemies, waves, bounds, camera lock and failsafe.
//
//   const arena = new Arena({ events: this.game.events,
//                             getTarget: () => ({ x: player.x, y: player.y }),
//                             getScrollX: () => this.cameras.main.scrollX });
//   arena.start();                         // on round start / after retry (retry also auto-restarts)
//   update(time, delta): arena.update(delta); arena.applyToCamera(this.cameras.main, player.x);
//   render: for (const g of arena.enemies.list()) { sprite per g.id at g.x,g.y; g.state; g.telegraphing }
//   arena.enemies.onRemoved = (id) => destroy sprite id
//   arena.bounds.clamp({x,y}) for the player position
//   shutdown: arena.dispose()
import { EnemyManager } from '../enemies/EnemyManager.js';
import { WaveSpawner } from '../waves/WaveSpawner.js';
import { ArenaBounds } from './ArenaBounds.js';
import { ArenaFailsafe } from './ArenaFailsafe.js';
import { WAVES } from '../waves/waveData.js';

export class Arena {
  constructor({ events, getTarget, getScrollX = () => 0, waves = WAVES, onFailsafe = null }) {
    this.events = events; this.getTarget = getTarget;
    this.scrollX = 0;
    this.getScrollX = getScrollX;
    this.enemies = new EnemyManager({ events });
    this.bounds = new ArenaBounds({ events, waves });
    this.spawner = new WaveSpawner({ events, waves, spawn: (spec) => this.enemies.spawn(spec) });
    this.failsafe = new ArenaFailsafe({
      bounds: this.bounds, manager: this.enemies, spawner: this.spawner,
      getScrollX: () => this.getScrollX(), onAction: onFailsafe,
    });
  }

  start() { this.enemies.destroyAll(); this.spawner.start(); }

  update(dtMs) {
    const target = this.getTarget();
    this.spawner.update(dtMs);
    this.enemies.update(dtMs, target);
    this.failsafe.update(dtMs, target);
  }

  applyToCamera(cam, followX) { this.bounds.applyToCamera(cam, followX); }

  get finished() { return this.spawner.finished; }

  dispose() {
    this.spawner.destroy(); this.bounds.dispose(); this.enemies.dispose();
  }
}
