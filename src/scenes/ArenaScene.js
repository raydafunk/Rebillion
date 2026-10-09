// ArenaScene: lead-owned integration. Wires Zed + Arena (enemies/waves/bounds) + combat + round state
// together over game.events and renders them. HudScene and ResultScene run on top.
import { EVENTS } from '../shared/events.js';
import { PLAYER_ID } from '../shared/combatData.js';
import { createHitResolver } from '../combat/hitResolver.js';
import { createRoundState, RoundStatus } from '../state/roundState.js';
import { ROUND_TIME_SECONDS } from '../state/config.js';
import { Zed } from '../player/Zed.js';
import { Arena } from '../arena/Arena.js';
import { WORLD, LANE } from '../arena/arenaData.js';
import { WAVES } from '../waves/waveData.js';
import { ASSET_KEYS, ASSET_PATHS, COLORS } from '../config/assetKeys.js';
import { GRUNT_SPRITE_KEY, TELEGRAPH_FX_KEY } from '../enemies/gruntData.js';

const GROUND_Y = LANE.maxY - 40;      // Zed's feet line (physics floor)
const END_DELAY_MS = 700;             // let the KO / final hit play before the result screen
const FINISHER_DAMAGE = 12;           // damage at/above which a hit gets screen shake

export default class ArenaScene extends Phaser.Scene {
  constructor() { super('ArenaScene'); }

  preload() {
    this.load.on('loaderror', () => {});
    this.load.svg(ASSET_KEYS.BG_ARENA, ASSET_PATHS[ASSET_KEYS.BG_ARENA], { width: WORLD.w, height: WORLD.h });
    this.load.svg('zed.visual', 'assets/sprites/zed-placeholder.svg', { width: 128, height: 128 });
    this.load.svg(GRUNT_SPRITE_KEY, 'assets/sprites/rust-grunt-placeholder.svg', { width: 128, height: 128 });
    this.load.svg(TELEGRAPH_FX_KEY, 'assets/fx/telegraph-icon-placeholder.svg', { width: 48, height: 48 });
    this.load.svg('fx.spark', 'assets/fx/spark-placeholder.svg', { width: 48, height: 48 });
  }

  create() {
    const ev = this.game.events;
    this.ev = ev;
    this.simNow = 0;           // scene clock (ms); stops while the scene is paused
    this.ended = false;
    this.stats = this._freshStats();
    this.sprites = new Map();  // enemy id -> { body, shadow, tele }
    this.swings = [];

    this.add.image(0, 0, ASSET_KEYS.BG_ARENA).setOrigin(0, 0).setDepth(-1000);
    this.physics.world.setBounds(0, 0, WORLD.w, GROUND_Y);
    this.cameras.main.setBounds(0, 0, WORLD.w, WORLD.h);
    this.cameras.main.fadeIn(250, 0, 0, 0);

    // Order matters: combat and state listen before anything emits.
    this.resolver = createHitResolver(ev, () => this.simNow);
    this.state = createRoundState(ev);
    this.zed = new Zed(this, 200, GROUND_Y - 36);
    this.zed.sprite.setAlpha(0);                       // physics body only; the visual below is the art
    this.zedShadow = this.add.ellipse(0, 0, 54, 14, 0x000000, 0.25);
    this.zedVisual = this.add.image(0, 0, 'zed.visual').setOrigin(0.5, 0.94).setDisplaySize(112, 112);
    this.gfx = this.add.graphics().setDepth(5000);

    this.arena = new Arena({
      events: ev,
      getTarget: () => ({ x: this.zed.x, y: GROUND_Y }),   // enemies chase the ground line, so jumping dodges
      getScrollX: () => this.cameras.main.scrollX,
    });
    this.arena.enemies.onRemoved = (id) => this._removeEnemyView(id);

    this._listen(EVENTS.HIT_REQUEST, (r) => this._onHitRequest(r));
    this._listen(EVENTS.DAMAGE_APPLIED, (d) => this._onDamage(d));
    this._listen(EVENTS.ENTITY_DIED, (d) => { if (d.team === 'rust') this.stats.defeated++; });
    this._listen(EVENTS.WAVE_CLEARED, () => { this.stats.wavesCleared++; });
    this._listen(EVENTS.ROUND_WON, (p) => this._endRound('win', p.reason));
    this._listen(EVENTS.ROUND_LOST, (p) => this._endRound('lose', p.reason));
    this._listen(EVENTS.RETRY, () => { this.ended = false; this.stats = this._freshStats(); this.swings.length = 0; });

    // Start the round only once the HUD exists, or it misses the first wave-started / timer-tick.
    this.scene.launch('HudScene');
    this.scene.get('HudScene').events.once('create', () => { this.arena.start(); this.state.start(); });

    this.keys = this.input.keyboard.addKeys({ esc: 'ESC', p: 'P' });
    this.events.once('shutdown', () => this._teardown());
  }

  _freshStats() { return { defeated: 0, wavesCleared: 0 }; }

  _listen(name, fn) {
    this.ev.on(name, fn);
    (this._listeners ||= []).push([name, fn]);
  }

  _teardown() {
    for (const [n, f] of this._listeners || []) this.ev.off(n, f);
    this._listeners = [];
    this.state.destroy(); this.resolver.destroy(); this.arena.dispose(); this.zed.destroy();
    this.sprites.clear();
    this.scene.stop('HudScene'); this.scene.stop('ResultScene');
  }

  update(_t, dt) {
    if (Phaser.Input.Keyboard.JustDown(this.keys.esc) || Phaser.Input.Keyboard.JustDown(this.keys.p)) {
      if (!this.ended) return this._pause();
    }
    this.simNow += dt;
    this.zed.update(this.simNow, dt);
    const c = this.arena.bounds.clamp({ x: this.zed.x, y: GROUND_Y });
    if (c.x !== this.zed.x) { this.zed.sprite.x = c.x; this.zed.sprite.body.setVelocityX(0); }

    if (!this.ended) {
      this.arena.update(dt);
      this.state.tick(dt);
    }
    this.arena.applyToCamera(this.cameras.main, this.zed.x);
    this._render(dt);
  }

  _pause() {
    this.scene.launch('ResultScene', { mode: 'pause' });
    this.scene.pause();
  }

  _endRound(mode, reason) {
    if (this.ended) return;
    this.ended = true;
    // round-won fires inside the final entity-died dispatch, before our own counters update.
    const total = WAVES.reduce((n, w) => n + w.count, 0);
    if (mode === 'win') { this.stats.defeated = total; this.stats.wavesCleared = WAVES.length; }
    const payload = {
      mode, reason,
      wavesCleared: this.stats.wavesCleared, totalWaves: WAVES.length,
      defeated: this.stats.defeated,
      secondsLeft: this.state.secondsLeft, totalSeconds: ROUND_TIME_SECONDS,
      enemiesLeft: total - this.stats.defeated,
      hp: this.resolver.getHealth(PLAYER_ID)?.hp ?? 0,
    };
    this.time.delayedCall(END_DELAY_MS, () => {
      this.scene.launch('ResultScene', payload);
      this.scene.pause();
    });
  }

  // ---- rendering ----
  _render(dt) {
    const z = this.zed;
    const feetY = GROUND_Y;
    const airborne = Math.max(0, feetY - (z.y + 36));
    this.zedVisual.setPosition(z.x, z.y + 36).setDepth(z.y + 36).setFlipX(z.facing < 0);
    this.zedShadow.setPosition(z.x, feetY).setDepth(feetY - 1).setScale(1 - Math.min(0.4, airborne / 400));
    const st = z.state;
    this.zedVisual.setAlpha(z.dead ? 0.35 : 1);
    if (st === 'hitstun') this.zedVisual.setTintFill(0xffffff);
    else if (st === 'block') this.zedVisual.setTint(0x88aaff);
    else if (st === 'dodge') this.zedVisual.setAlpha(0.5).clearTint();
    else this.zedVisual.clearTint();
    this.zedVisual.setAngle(z.dead ? 80 * z.facing : 0);

    for (const g of this.arena.enemies.list()) {
      let v = this.sprites.get(g.id);
      if (!v) {
        v = {
          shadow: this.add.ellipse(0, 0, 54, 14, 0x000000, 0.25),
          body: this.add.image(0, 0, GRUNT_SPRITE_KEY).setOrigin(0.5, 0.94).setDisplaySize(112, 112),
          tele: this.add.image(0, 0, TELEGRAPH_FX_KEY).setVisible(false).setDepth(4000),
        };
        this.sprites.set(g.id, v);
      }
      v.body.setPosition(g.x, g.y).setDepth(g.y).setFlipX(g.facing < 0);
      v.shadow.setPosition(g.x, g.y).setDepth(g.y - 1);
      v.tele.setPosition(g.x, g.y - 130).setVisible(g.telegraphing && g.alive);
      v.body.clearTint();
      if (g.state === 'hitstun') v.body.setTintFill(0xffffff);
      else if (g.telegraphing) v.body.setTint(Phaser.Display.Color.GetColor(255, 130 - 80 * g.telegraphProgress, 120 - 80 * g.telegraphProgress));
      if (!g.alive) { v.body.setAlpha(0.4).setAngle(80 * g.facing); v.shadow.setAlpha(0.1); }
    }

    // Swing boxes (brief, so Zed's reach and the grunt strike are readable)
    this.gfx.clear();
    this.swings = this.swings.filter((s) => (s.ttl -= dt) > 0);
    for (const s of this.swings) this.gfx.fillStyle(s.color, 0.35 * (s.ttl / s.life)).fillRect(s.x, s.y, s.w, s.h);
    for (const g of this.arena.enemies.list()) {
      if (g.telegraphing) {
        const b = g.attackHitbox();
        this.gfx.fillStyle(0xd13b2c, 0.15 + 0.25 * g.telegraphProgress).fillRect(b.x, b.y, b.w, b.h);
      }
    }
  }

  _removeEnemyView(id) {
    const v = this.sprites.get(id);
    if (!v) return;
    v.body.destroy(); v.shadow.destroy(); v.tele.destroy();
    this.sprites.delete(id);
  }

  // ---- hit feedback (hit-feedback-spec.md, minus hit-stop for Tier 0) ----
  _onHitRequest(r) {
    const x = r.origin.x + r.facing * r.hitbox.x - (r.facing < 0 ? r.hitbox.w : 0);
    this.swings.push({
      x, y: r.origin.y + r.hitbox.y, w: r.hitbox.w, h: r.hitbox.h, ttl: 120, life: 120,
      color: r.team === 'player' ? 0xf2c04d : 0xd13b2c,
    });
  }

  _onDamage(d) {
    if (d.amount <= 0) return;
    let x, y;
    if (d.targetId === PLAYER_ID) { x = this.zed.x; y = this.zed.y - 10; this.cameras.main.shake(100, 0.0023); }
    else {
      const g = this.arena.enemies.get(d.targetId);
      if (!g) return;
      x = g.x; y = g.y - 50;
      if (d.attackerId === PLAYER_ID && d.amount >= FINISHER_DAMAGE) this.cameras.main.shake(120, 0.003);
    }
    const heavy = d.amount >= FINISHER_DAMAGE;
    const s = this.add.image(x, y, 'fx.spark').setDepth(6000).setScale(heavy ? 1 : 0.6).setAngle(Phaser.Math.Between(0, 90));
    this.tweens.add({ targets: s, alpha: 0, scale: s.scale * 1.5, duration: heavy ? 180 : 120, onComplete: () => s.destroy() });
  }
}
