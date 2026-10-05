// Standalone check of the grunt AI: one grunt vs a draggable dummy target. Not part of the game flow.
// Register in a throwaway page: scene: [GruntTestScene]. Arrow keys / WASD move the dummy.
// The grunt telegraphs (yellow flash + "!"), swings (red box), recovers. Press SPACE to hit it.
import { EVENTS } from '../shared/events.js';
import { EnemyManager } from './EnemyManager.js';
import { GRUNT_SPRITE_KEY } from './gruntData.js';

export default class GruntTestScene extends Phaser.Scene {
  constructor() { super('GruntTestScene'); }

  preload() {
    this.load.on('loaderror', () => {});
    this.load.svg(GRUNT_SPRITE_KEY, 'assets/sprites/rust-grunt-placeholder.svg');
  }

  create() {
    const ev = this.events; // scene-local emitter stands in for game.events
    this.manager = new EnemyManager({ events: ev });
    this.dummy = { x: 300, y: 500 };
    this.gfx = this.add.graphics();
    this.cursors = this.input.keyboard.createCursorKeys();
    this.space = this.input.keyboard.addKey('SPACE');
    this.sprites = new Map();
    this.hitBoxes = [];
    ev.on(EVENTS.HIT_REQUEST, (r) => {
      const x = r.origin.x + r.facing * r.hitbox.x - (r.facing < 0 ? r.hitbox.w : 0);
      this.hitBoxes.push({ x, y: r.origin.y + r.hitbox.y, w: r.hitbox.w, h: r.hitbox.h, ttl: 150 });
    });
    this.manager.onRemoved = (id) => { this.sprites.get(id)?.destroy(); this.sprites.delete(id); };
    this.manager.spawn({ id: 'grunt-test', x: 900, y: 500 });
    this.label = this.add.text(10, 10, '', { fontSize: '16px', color: '#fff' });
  }

  update(_t, dt) {
    const sp = 200 * dt / 1000;
    if (this.cursors.left.isDown) this.dummy.x -= sp;
    if (this.cursors.right.isDown) this.dummy.x += sp;
    if (this.cursors.up.isDown) this.dummy.y -= sp;
    if (this.cursors.down.isDown) this.dummy.y += sp;
    const g = this.manager.get('grunt-test');
    if (g && Phaser.Input.Keyboard.JustDown(this.space) && Math.abs(g.x - this.dummy.x) < 140) {
      this.events.emit(EVENTS.DAMAGE_APPLIED, { targetId: g.id, attackerId: 'dummy', amount: 5, hpAfter: 1, knockback: g.x > this.dummy.x ? 200 : -200, hitstun: 300 });
    }
    this.manager.update(dt, this.dummy);
    if (!g || !g.alive) { this.manager.spawn({ id: `grunt-test`, x: 900, y: 500 }); }

    this.gfx.clear();
    this.gfx.fillStyle(0x3377ff, 1).fillRect(this.dummy.x - 20, this.dummy.y - 80, 40, 80);
    for (const e of this.manager.list()) {
      this.gfx.fillStyle(e.telegraphing ? 0xffdd00 : e.state === 'hitstun' ? 0xffffff : 0xa8402e, 1)
        .fillRect(e.x - 20, e.y - 80, 40, 80);
      if (e.telegraphing) this.gfx.fillStyle(0xffdd00, 0.4).fillRect(e.attackHitbox().x, e.attackHitbox().y, e.attackHitbox().w, e.attackHitbox().h);
    }
    this.hitBoxes = this.hitBoxes.filter((b) => (b.ttl -= dt) > 0);
    for (const b of this.hitBoxes) this.gfx.fillStyle(0xff0000, 0.6).fillRect(b.x, b.y, b.w, b.h);
    this.label.setText(g ? `state: ${g.state}${g.circling ? ' (circling)' : ''}` : '');
  }
}
