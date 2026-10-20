// ArenaScene: lead-owned integration. Wires Zed + Arena (enemies/waves/bounds) + combat + round state
// together over game.events and renders them. HudScene and ResultScene run on top.
import { EVENTS } from '../shared/events.js';
import { PLAYER_ID } from '../shared/combatData.js';
import { createHitResolver } from '../combat/hitResolver.js';
import { hitStopMs, mergeHitStop } from '../combat/hitStop.js';
import { createRoundState, RoundStatus } from '../state/roundState.js';
import { Zed } from '../player/Zed.js';
import { ZedVisual, loadZedSprites } from '../player/zedVisual.js';
import { Arena } from '../arena/Arena.js';
import { WORLD, LANE, VIEW } from '../arena/arenaData.js';
import { legacyLevel, nextLevelIndex } from '../levels/levelData.js';
import showLevelCard from '../ui/LevelCard.js';
import addAmbient from '../levels/ambient.js';
import { ASSET_KEYS, ASSET_PATHS, COLORS, CSS, FONTS } from '../config/assetKeys.js';
import { GRUNT_SPRITE_KEY, TELEGRAPH_FX_KEY } from '../enemies/gruntData.js';

const GROUND_Y = LANE.maxY - 40;      // Zed's feet line (physics floor)
const END_DELAY_MS = 700;             // let the KO / final hit play before the result screen
const FINISHER_DAMAGE = 12;           // damage at/above which a hit gets screen shake

export default class ArenaScene extends Phaser.Scene {
  constructor() { super('ArenaScene'); }

  // data.levelIndex picks the level (ResultScene's NEXT LEVEL passes it); ?level=N does the same for testing.
  init(data) {
    this.levels = this.game.registry.get('levels') || [legacyLevel()];
    const q = Number(new URLSearchParams(globalThis.location?.search).get('level')) - 1;
    const want = data && Number.isInteger(data.levelIndex) ? data.levelIndex : Number.isInteger(q) && q >= 0 ? q : 0;
    this.levelIndex = Math.min(Math.max(0, want), this.levels.length - 1);
    this.level = this.levels[this.levelIndex];
    this.bgKey = ASSET_KEYS.BG_ARENA;
  }

  preload() {
    this.load.on('loaderror', () => {});
    this.load.svg(ASSET_KEYS.BG_ARENA, ASSET_PATHS[ASSET_KEYS.BG_ARENA], { width: WORLD.w, height: WORLD.h });
    // Per-level background from content/levels/styles/<id>.json; the shared placeholder is the fallback.
    const bgPath = this.level.style.background.path;
    if (bgPath) {
      this.bgKey = `bg.${this.level.id}`;
      if (/.svg$/i.test(bgPath)) this.load.svg(this.bgKey, bgPath, { scale: 1 }); // intrinsic size: art may be 1920x720 or a wider multiple
      else this.load.image(this.bgKey, bgPath);
    }
    loadZedSprites(this, ['Idle', 'Jumping']);
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
    this.hitStopLeft = 0;      // ms of hit-stop remaining; only the attacker and target freeze, the round timer keeps ticking
    this.hitStopIds = new Set();

    this.roundStarted = false;
    const bgKey = this.textures.exists(this.bgKey) ? this.bgKey : ASSET_KEYS.BG_ARENA;
    // The level is wider than one screen: the background art (1920x720, or a wider multiple) repeats along it.
    this.world = { w: this.level.worldWidth, h: WORLD.h };
    this.scrolling = !!this.level.scrolling;
    this.add.tileSprite(0, 0, this.world.w, this.world.h, bgKey).setOrigin(0, 0).setDepth(-1000);
    const ov = this.level.style.background.overlay;
    if (ov && ov.alpha > 0) {
      this.add.rectangle(0, 0, this.world.w, this.world.h, Phaser.Display.Color.HexStringToColor(ov.color).color, ov.alpha).setOrigin(0, 0).setDepth(-999);
    }
    addAmbient(this, this.level.style, this.world.w);
    this.physics.world.setBounds(0, 0, this.world.w, GROUND_Y);
    this.cameras.main.setBounds(0, 0, this.world.w, this.world.h);
    this.levelDone = false;
    if (this.scrolling) this._buildExit();
    this.cameras.main.fadeIn(250, 0, 0, 0);

    // Order matters: combat and state listen before anything emits.
    this.resolver = createHitResolver(ev, () => this.simNow);
    this.state = createRoundState(ev, { seconds: this.level.timeLimitSec });
    this.zed = new Zed(this, 200, GROUND_Y - 36);
    this.zed.sprite.setAlpha(0);                       // physics body only; the visual below is the art
    this.zedShadow = this.add.ellipse(0, 0, 54, 14, 0x000000, 0.25);
    this.zedVisual = new ZedVisual(this);
    this.gfx = this.add.graphics().setDepth(5000);

    this.arena = new Arena({
      events: ev,
      waves: this.level.waves,
      world: this.world,
      hold: this.scrolling,
      getTarget: () => ({ x: this.zed.x, y: GROUND_Y }),   // enemies chase the ground line, so jumping dodges
      getScrollX: () => this.cameras.main.scrollX,
    });
    this.arena.enemies.onRemoved = (id) => this._removeEnemyView(id);

    this._listen(EVENTS.HIT_REQUEST, (r) => this._onHitRequest(r));
    this._listen(EVENTS.DAMAGE_APPLIED, (d) => this._onDamage(d));
    this._listen(EVENTS.ENTITY_DIED, (d) => { if (d.team === 'rust') this.stats.defeated++; });
    this._listen(EVENTS.WAVE_CLEARED, ({ index }) => {
      this.stats.wavesCleared++;
      if (this.scrolling && index + 1 >= this.level.waves.length) this._showExit();
    });
    this._listen(EVENTS.ROUND_WON, (p) => this._endRound('win', p.reason));
    this._listen(EVENTS.ROUND_LOST, (p) => this._endRound('lose', p.reason));
    this._listen(EVENTS.RETRY, () => { this.ended = false; this.levelDone = false; this._hideExit(); this.stats = this._freshStats(); this.swings.length = 0; this._clearHitStop(); });

    // Start the round only once the HUD exists, or it misses the first wave-started / timer-tick.
    this.scene.launch('HudScene', { level: this.level, number: this.levelIndex + 1, total: this.levels.length });
    // ?sandbox: empty arena for testing Zed's moves; no waves, timer or lose condition.
    this.sandbox = new URLSearchParams(globalThis.location?.search).has('sandbox');
    // The round begins when both the HUD exists and the level intro card is dismissed.
    let hudReady = false, introDone = this.sandbox;
    const begin = () => {
      if (!hudReady || !introDone || this.sandbox) return;
      this.roundStarted = true; this.arena.start(); this.state.start();
    };
    this.scene.get('HudScene').events.once('create', () => { hudReady = true; begin(); });
    if (!this.sandbox) {
      showLevelCard(this, { number: this.levelIndex + 1, total: this.levels.length, name: this.level.name, text: this.level.intro },
        () => { introDone = true; begin(); });
    }

    this.keys = this.input.keyboard.addKeys({ esc: 'ESC', p: 'P' });
    // Pause spec: auto-pause on tab blur, gamepad Start opens pause.
    this._onBlur = () => { if (!this.ended && this.scene.isActive()) this._pause(); };
    this.game.events.on('blur', this._onBlur);
    this.padStartPrev = false;
    this.events.once('shutdown', () => { this.game.events.off('blur', this._onBlur); this._teardown(); });
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
    const pad = this.input.gamepad && this.input.gamepad.total ? this.input.gamepad.getPad(0) : null;
    const start = !!(pad && pad.buttons[9] && pad.buttons[9].pressed);
    if (start && !this.padStartPrev && !this.ended) { this.padStartPrev = true; return this._pause(); }
    this.padStartPrev = start;
    this.simNow += dt;
    this._tickHitStop(dt);
    const zedFrozen = this.hitStopIds.has(PLAYER_ID);
    if (!zedFrozen && (this.roundStarted || this.sandbox)) this.zed.update(this.simNow, dt);
    const c = this.arena.bounds.clamp({ x: this.zed.x, y: GROUND_Y });
    if (c.x !== this.zed.x) { this.zed.sprite.x = c.x; this.zed.sprite.body.setVelocityX(0); }

    if (!this.ended && !this.sandbox && this.roundStarted) {
      this.arena.update(dt, this.hitStopIds);
      this.state.tick(dt);
    }
    if (this.scrolling && this.roundStarted && !this.ended) this._scrollProgress();
    this.arena.applyToCamera(this.cameras.main, this.zed.x);
    this._render(dt, zedFrozen);
  }

  // ---- side-scroller progress: clear a wave, walk right, next wave locks the screen; after the last, reach the exit ----
  _scrollProgress() {
    const next = this.arena.nextLockX;
    // The camera follows Zed once a wave is cleared; when it reaches the next lock position the wave begins.
    if (this.arena.holding && next !== null && this.zed.x >= next + VIEW.w / 2) this.arena.advance();
    if (this.arena.finished && !this.levelDone && this.zed.x >= this.level.exitX - 30) {
      this.levelDone = true;
      this.ev.emit(EVENTS.ARENA_CLEARED, {}); // round state turns this into round-won
    }
  }

  _buildExit() {
    const x = this.level.exitX, top = LANE.minY - 150, bottom = LANE.maxY + 10;
    const post = (px) => this.add.rectangle(px, (top + bottom) / 2, 14, bottom - top, COLORS.mustard).setDepth(LANE.minY);
    const glow = this.add.rectangle(x, (top + bottom) / 2, 120, bottom - top, COLORS.mustardLight, 0.22).setDepth(LANE.minY - 1);
    const label = this.add.text(x, top - 24, 'EXIT', { fontFamily: FONTS.button, fontSize: '40px', color: CSS.mustard, stroke: CSS.darkBrown, strokeThickness: 6 })
      .setOrigin(0.5).setDepth(LANE.minY);
    this.exitGate = [post(x - 60), post(x + 60), glow, label];
    this.tweens.add({ targets: glow, alpha: 0.4, yoyo: true, repeat: -1, duration: 600 });
    this._hideExit();
  }
  _showExit() { (this.exitGate || []).forEach((o) => o.setVisible(true)); }
  _hideExit() { (this.exitGate || []).forEach((o) => o.setVisible(false)); }

  // ---- hit-stop: freeze the attacker and target for a few ms; everything else (timer, waves, other enemies) keeps running ----
  _startHitStop(type, ids) {
    const ms = mergeHitStop(this.hitStopLeft, type);
    if (ms <= 0) return;
    this.hitStopLeft = ms;
    for (const id of ids) this.hitStopIds.add(id);
    if (this.hitStopIds.has(PLAYER_ID)) this.zed.sprite.body.moves = false; // no gravity or drift while frozen
  }

  _tickHitStop(dt) {
    if (this.hitStopLeft <= 0) return;
    this.hitStopLeft -= dt;
    if (this.hitStopLeft <= 0) this._clearHitStop();
  }

  _clearHitStop() {
    this.hitStopLeft = 0;
    this.hitStopIds.clear();
    if (this.zed?.sprite?.body) this.zed.sprite.body.moves = true;
  }

  _pause() {
    this.scene.launch('ResultScene', { mode: 'pause' });
    this.scene.pause();
  }

  _endRound(mode, reason) {
    if (this.ended) return;
    this.ended = true;
    // round-won fires inside the final entity-died dispatch, before our own counters update.
    const total = this.level.totalEnemies, waves = this.level.waves;
    if (mode === 'win') { this.stats.defeated = total; this.stats.wavesCleared = waves.length; }
    const payload = {
      mode, reason,
      wavesCleared: this.stats.wavesCleared, totalWaves: waves.length,
      levelName: this.level.name, levelNumber: this.levelIndex + 1, totalLevels: this.levels.length,
      outro: this.level.outro, nextLevelIndex: nextLevelIndex(this.levels, this.levelIndex),
      defeated: this.stats.defeated,
      secondsLeft: this.state.secondsLeft, totalSeconds: this.level.timeLimitSec,
      enemiesLeft: total - this.stats.defeated,
      hp: this.resolver.getHealth(PLAYER_ID)?.hp ?? 0,
    };
    this.time.delayedCall(END_DELAY_MS, () => {
      this.scene.launch('ResultScene', payload);
      this.scene.pause();
    });
  }

  // ---- rendering ----
  _render(dt, zedFrozen = false) {
    const z = this.zed;
    const feetY = GROUND_Y;
    const airborne = Math.max(0, feetY - (z.y + 36));
    this.zedVisual.update(z, zedFrozen ? 0 : dt, z.x, z.y + 36, z.y + 36);
    this.zedShadow.setPosition(z.x, feetY).setDepth(feetY - 1).setScale(1 - Math.min(0.4, airborne / 400));

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

  // ---- hit feedback (hit-feedback-spec.md) ----
  _onHitRequest(r) {
    if (r.team === 'player') return; // no hitbox overlay on Zed's punches; the sprite shows the swing
    const x = r.origin.x + r.facing * r.hitbox.x - (r.facing < 0 ? r.hitbox.w : 0);
    this.swings.push({
      x, y: r.origin.y + r.hitbox.y, w: r.hitbox.w, h: r.hitbox.h, ttl: 120, life: 120,
      color: r.team === 'player' ? 0xf2c04d : 0xd13b2c,
    });
  }

  _onDamage(d) {
    if (d.amount <= 0) return;
    const guarded = d.targetId === PLAYER_ID && this.zed.machine.guardType;
    if (!guarded) {
      const type = d.targetId === PLAYER_ID ? 'playerHurt' : d.amount >= FINISHER_DAMAGE ? 'heavy' : 'light';
      this._startHitStop(type, [d.attackerId, d.targetId]);
    }
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
