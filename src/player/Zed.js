// Zed: Phaser Arcade sprite wrapper. Movement + state machine. Uses global Phaser.
import { ZED_CONFIG, isLaunchHit } from './config.js';
import { InputState, padToKeys } from './input.js';
import { JumpController } from './jump.js';
import { PlayerStateMachine } from './stateMachine.js';
import { EVENTS } from '../shared/events.js';
import { TEAMS, PLAYER_ID, COMBAT_DEFAULTS } from '../shared/combatData.js';
import { GUARD, PARRY } from './moves.js';
import { LANE } from '../arena/arenaData.js';
import { RageMeter } from './rage.js';
import { dir8FromInput } from './zedVisual.js';
import { RAGE_EVENTS } from './rageConfig.js';
import { GrabController } from './grab.js';
import { GRAB_CONFIG } from './grabConfig.js';
import { HEAVY_HIT_SOUND_KEY, isHeavyHit, hitSoundKey, swingSoundKey, RUN_SOUND_KEY, runStepSound, RUN_STEP, OWW_SOUND_KEY, OWW_SOUND_VOLUME, DEATH_SOUND_KEY, DEATH_SOUND_VOLUME } from './heavyHit.js';

// Phaser KeyboardEvent.code values we care about; we feed raw codes into InputState.
const WATCHED = ['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyS', 'Space',
  'KeyJ', 'KeyZ', 'KeyK', 'KeyX', 'KeyL', 'KeyC', 'KeyI', 'KeyV', 'KeyT', 'KeyM', 'KeyU', 'KeyN'];

/** Emitted on game.events when `zed.carrying` changes: { carrying:boolean }. */
export const PLAYER_CARRYING_CHANGED = 'player-carrying-changed';
/** Emitted on game.events when Zed throws his carried weapon: { x, y, lane, facing }. */
export const PLAYER_THROW = 'player-throw';

export class Zed {
  constructor(scene, x, y, cfg = ZED_CONFIG) {
    this.scene = scene;
    this.cfg = cfg;
    if (!scene.textures.exists(cfg.spriteKey)) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xe3a92b, 1).fillRect(0, 0, cfg.bodySize.w, cfg.bodySize.h);
      g.generateTexture(cfg.spriteKey, cfg.bodySize.w, cfg.bodySize.h);
      g.destroy();
    }
    this.sprite = scene.physics.add.sprite(x, y, cfg.spriteKey);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setGravityY(cfg.gravity);
    // Depth: the physics body only handles jumping (its floor is the world bottom). laneY is where the feet stand on the floor band.
    this.floorY = y + cfg.bodySize.h / 2;
    this.laneY = this.floorY;
    this.facing = 1;
    this.hitKind = null; // 'launch' while the current hitstun came from an uppercut (visual only)
    this.dir8 = 'east'; // 8-way facing from movement input (visual only; hitboxes/combat use `facing`)
    this._carrying = false;
    if (globalThis.location?.search?.includes('carry')) this._carrying = true; // manual check: index.html?sandbox&carry
    this.input = new InputState();
    this.jump = new JumpController(cfg);
    this.events = scene.game.events;
    this.dead = false;
    // Rage meter (hidden until setLevel(>=2)). Meter events are re-emitted on game.events as RAGE_EVENTS.*.
    const rageNames = { change: RAGE_EVENTS.CHANGED, state: RAGE_EVENTS.STATE, gain: RAGE_EVENTS.GAIN, ready: RAGE_EVENTS.READY,
      activated: RAGE_EVENTS.ACTIVATED, ended: RAGE_EVENTS.ENDED, buffer: RAGE_EVENTS.BUFFER };
    this.rage = new RageMeter({ onEvent: (name, payload) => {
      if (name === 'ended') this.machine.endRage();
      this.events.emit(rageNames[name], payload);
    } });
    this.machine = new PlayerStateMachine({
      onMoveStart: (moveId, m) => this._playSwing(m),
      onActive: (moveId, m, swing) => this._emitHit(m, swing),
    });
    this.down = new Set();
    this.tapped = new Set(); // keys pressed since the last poll, so a tap shorter than one frame still counts
    this._pending = {};      // press edges waiting for a fixed step (render frames without a step must not eat them)
    this._acc = 0;
    this.getXRange = null; // set by ArenaScene: () => ({min, max}) of the walkable x span (locked screen or whole world)

    const kb = scene.input.keyboard;
    this._onDown = (e) => { this.down.add(e.code); this.tapped.add(e.code); };
    this._onUp = (e) => this.down.delete(e.code);
    kb.on('keydown', this._onDown);
    kb.on('keyup', this._onUp);
    kb.addCapture(WATCHED.filter((c) => c === 'Space' || c.startsWith('Arrow'))); // stop page scroll

    this._onDamage = (d) => this._handleDamage(d);
    this._onDied = (d) => {
      if (d.id !== PLAYER_ID) { this.releaseGrab(d.id, 'died'); return; } // Dugan died while holding Zed
      if (!this.dead && this.scene.cache.audio.exists(DEATH_SOUND_KEY)) this.scene.sound.play(DEATH_SOUND_KEY, { volume: DEATH_SOUND_VOLUME });
      this.dead = true;
      this.rage.onKnockout(); // ends Rage (a knockdown does not)
    };
    this._onRetry = () => this.respawn(x, y);
    // Grab and Wall Slam (Dugan's side is wired by the scene/enemy; see design/team/contracts.md).
    this.grab = new GrabController(GRAB_CONFIG, (n, p) => this._onGrabEvent(n, p));
    this._grabAnchor = null;
    this._slamEmitting = false; // true only while the synthetic slam hit-request is being resolved
    this._slamHit = null;
    this._slamSeq = 0;
    this._onGrab = (r) => { if (r && r.targetId === PLAYER_ID) this.startGrab(r); };
    this._onGrabSlam = (r) => { if (this.grab.held && r.attackerId === this.grab.info.attackerId) this.grab.slam(); };
    this._onGrabRelease = (r) => this.releaseGrab(r.attackerId, r.reason);
    this.events.on(EVENTS.GRAB, this._onGrab);
    this.events.on(EVENTS.GRAB_SLAM, this._onGrabSlam);
    this.events.on(EVENTS.GRAB_RELEASE, this._onGrabRelease);
    this.events.on(EVENTS.DAMAGE_APPLIED, this._onDamage);
    this.events.on(EVENTS.ENTITY_DIED, this._onDied);
    this.events.on(EVENTS.RETRY, this._onRetry);
    this._register();

    // Footstep loop: plays only while running on the ground; follows the scene's pause/resume.
    this._runSound = null;
    this._onScenePause = () => { if (this._runSound && this._runSound.isPlaying) this._runSound.pause(); };
    this._onSceneResume = () => { if (this._runSound && this._runSound.isPaused) this._runSound.resume(); };
    scene.events.on('pause', this._onScenePause);
    scene.events.on('resume', this._onSceneResume);
  }

  _setRunSound(on, moveX = 1, moveY = 0) {
    if (on) {
      if (!this.scene.cache.audio.exists(RUN_SOUND_KEY)) return;
      if (!this._runSound) this._runSound = this.scene.sound.add(RUN_SOUND_KEY, { loop: true, volume: RUN_STEP.volume });
      const { volume, rate } = runStepSound(moveX, moveY); // depth-only running is softer/slower than side running
      this._runSound.setVolume?.(volume); this._runSound.setRate?.(rate);
      if (!this._runSound.isPlaying && !this._runSound.isPaused) this._runSound.play();
    } else if (this._runSound && (this._runSound.isPlaying || this._runSound.isPaused)) {
      this._runSound.stop();
    }
  }

  _register() {
    const { w, h } = this.cfg.bodySize;
    this.events.emit(EVENTS.ENTITY_REGISTERED, {
      id: PLAYER_ID,
      team: TEAMS.PLAYER,
      maxHp: COMBAT_DEFAULTS.PLAYER_MAX_HP,
      hurtbox: { x: -w / 2, y: -h / 2, w, h },
      // guardType is an extra, optional field: 'parry' | 'block' | null
      getState: () => ({ x: this.sprite.x, y: this.sprite.y + this.depthOffset, lane: this.laneY, facing: this.facing, guard: this.machine.guardType, lift: this._hitLift() }),
    });
  }

  /** Shift from the physics floor to the current floor line (px). Add to sprite.y for any world-space position. */
  get depthOffset() { return this.laneY - this.floorY; }

  /**
   * Lift reported to combat. While the grab makes Zed untouchable (held, down, getting up, break window) it reads as
   * "airborne", so the existing resolver skips every ordinary hit-request with no combat change. The slam request itself
   * is resolved with the real lift.
   */
  _hitLift() { return this.grab.invulnerable && !this._slamEmitting ? COMBAT_DEFAULTS.AIR_DODGE_LIFT : this._lift(); }

  /** Feet height above the floor (px); 0 on the ground. */
  _lift() {
    const b = this.scene.physics.world.bounds;
    return Math.max(0, b.bottom - (this.sprite.y + this.cfg.bodySize.h / 2));
  }

  _playSwing(m) {
    const key = swingSoundKey(m);
    if (key && this.scene.cache.audio.exists(key)) this.scene.sound.play(key);
    if (m && m.heavy) {
      // Burst on the last active frame, when the fist is fully extended.
      const endMs = (m.startup + m.active - 1) * (1000 / 60);
      this.scene.time.delayedCall(endMs, () => { if (this.sprite && this.sprite.active) this._windFx(m); });
    }
  }

  // Procedural air-rush streaks at the fist, same moment as the swing whoosh. Visual only.
  _windFx(m) {
    const s = this.scene, f = this.facing, hb = m.hitbox;
    if (!s.textures.exists('fx.wind-streak')) {
      const g = s.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xf2ead8, 1).fillRect(0, 0, 40, 3); // pale warm white (style guide neutral)
      g.generateTexture('fx.wind-streak', 40, 3);
      g.destroy();
    }
    const cx = this.sprite.x + f * (hb.x + hb.w / 2), cy = this.sprite.y + this.depthOffset + hb.y + hb.h / 2;
    for (let i = 0; i < 7; i++) {
      const life = Phaser.Math.Between(150, 280);
      const p = s.add.image(cx - f * Phaser.Math.Between(10, 30), cy + Phaser.Math.Between(-18, 18), 'fx.wind-streak')
        .setDepth(5500).setAlpha(0.7).setFlipX(f < 0).setScale(Phaser.Math.FloatBetween(0.6, 1.3), 1);
      s.tweens.add({ targets: p, x: p.x + f * Phaser.Math.Between(50, 90), alpha: 0, scaleX: p.scaleX * 0.4,
        duration: life, ease: 'Cubic.easeOut', onComplete: () => p.destroy() });
    }
  }

  _emitHit(m, swing) {
    // The resolver answers synchronously, so DAMAGE_APPLIED for this request arrives before emit returns.
    this._hitSoundArmed = hitSoundKey(m); // heavy or light key; one sound per swing
    this._emitHitRequest(m, swing);
    this._hitSoundArmed = null;
  }

  _emitHitRequest(m, swing) {
    this.events.emit(EVENTS.HIT_REQUEST, {
      attackerId: PLAYER_ID,
      attackId: `${PLAYER_ID}:${swing}`, // same id on every active frame: one hit per target per swing
      team: TEAMS.PLAYER,
      hitbox: { ...m.hitbox },
      origin: { x: this.sprite.x, y: this.sprite.y + this.depthOffset },
      lane: this.laneY,
      facing: this.facing,
      damage: m.damage,
      knockback: m.knockback,
      hitstun: m.hitstun * (1000 / 60),
      // Rage Special only: combat may cap damage vs bosses (extra optional fields, absent on normal moves).
      ...(m.rage ? { rage: true, moveId: this.machine.moveId } : {}), // Rage moves: arena fires the mega shake / kill dust
      ...(m.special ? { special: true, bossDamageCap: m.bossDamageCap, neverKills: !!m.neverKills } : {}),
    });
  }

  // Big white screen flash plus an expanding shockwave ring at Zed. Visual only.
  _parryFlash() {
    const s = this.scene, x = this.sprite.x, y = this.sprite.y + this.depthOffset - 20;
    s.cameras.main.flash(160, 255, 255, 255, true);
    const ring = s.add.graphics().setDepth(6000).setPosition(x, y);
    const o = { r: 20, a: 1 };
    s.tweens.add({
      targets: o, r: 195, a: 0, duration: 260, ease: 'Cubic.easeOut',
      onUpdate: () => {
        ring.clear().lineStyle(8, 0xffffff, o.a).strokeCircle(0, 0, o.r)
          .lineStyle(3, 0xffe9a8, o.a).strokeCircle(0, 0, o.r * 0.7);
      },
      onComplete: () => ring.destroy(),
    });
  }

  // No dedicated asset: the heavy punch sample pitched up for the impact, plus a synthesized metallic ping.
  _parrySound() {
    const s = this.scene;
    if (s.cache.audio.exists(HEAVY_HIT_SOUND_KEY)) s.sound.play(HEAVY_HIT_SOUND_KEY, { rate: 1.5, volume: 0.9 });
    const ctx = s.sound.context; // only the WebAudio manager has one
    if (!ctx) return;
    const t = ctx.currentTime, gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    gain.connect(ctx.destination);
    for (const [f, mult] of [[1320, 1], [1980, 0.6], [3170, 0.35]]) { // inharmonic partials read as metal
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f; g.gain.value = mult;
      o.connect(g); g.connect(gain);
      o.start(t); o.stop(t + 0.5);
    }
  }

  _onParrySuccess(attackerId) {
    this.events.emit(EVENTS.PARRY_STUN, { attackerId, hitstun: PARRY.stunMs });
    this.machine.parrySucceeded(); // opens the counter-attack cancel
    this._parryFlash();
    this._parrySound();
  }

  _handleDamage(d) {
    // Hit-confirm: the current move connected, so autoChain moves (heavy combo) may continue.
    if (d.attackerId === PLAYER_ID && d.targetId !== PLAYER_ID && d.amount > 0 && this.machine.state === 'attack') this.machine.hitConfirmed = true;
    if (isHeavyHit(this._hitSoundArmed, d, PLAYER_ID)) {
      const key = this._hitSoundArmed;
      this._hitSoundArmed = null; // once per swing, even if it connects with several enemies
      if (this.scene.cache.audio.exists(key)) this.scene.sound.play(key);
    }
    if (d.attackerId === PLAYER_ID && d.targetId !== PLAYER_ID && (d.landed ?? d.amount > 0)) this.rage.onBlowLanded(); // any Rust enemy, boss included
    if (d.targetId !== PLAYER_ID || this.dead) return;
    if (this._slamEmitting) { // the slam's own damage: no hitstun, the slammed state takes over
      this._slamHit = d;
      this.rage.onHitTaken();
      if (d.hpAfter > 0 && this.scene.cache.audio.exists(OWW_SOUND_KEY)) this.scene.sound.play(OWW_SOUND_KEY, { volume: OWW_SOUND_VOLUME });
      return;
    }
    if (this.grab.invulnerable) return; // held / down / getting up: nothing else touches Zed
    const guard = this.machine.guardType;
    if (guard === 'parry') { this._onParrySuccess(d.attackerId); return; } // punch landed in the parry window: negated + counter window
    if (guard === 'block') {
      this.sprite.body.setVelocityX(d.knockback * GUARD.blockKnockbackFactor);
      return; // no hitstun while blocking
    }
    this.rage.onHitTaken(); // ends the clean streak, cancels a buffered L press (blocked/parried hits return above)
    this.hitKind = isLaunchHit(d) ? 'launch' : null; // visual only: which clip the hitstun shows
    this.machine.hit(Math.ceil(d.hitstun / this.cfg.fixedStepMs));
    if (d.hpAfter > 0 && this.scene.cache.audio.exists(OWW_SOUND_KEY)) this.scene.sound.play(OWW_SOUND_KEY, { volume: OWW_SOUND_VOLUME });
    this.sprite.body.setVelocityX(d.knockback);
    this.sprite.setTint(0xff6666);
    this.scene.time.delayedCall(d.hitstun, () => this.sprite.clearTint());
  }

  /**
   * Dugan's grab connected. req: { attackerId, holdMs, slamDamage, slamKnockback, slamDir, anchor }.
   * anchor: () => ({ x, y, facing, lane? }) Dugan's world position, polled every frame (a plain object also works).
   * Returns false (and emits GRAB_RESULT accepted:false) if Zed is dead, already held/down, or in a post-break/get-up
   * invulnerability window. A jump does not avoid the grab; block and parry do not apply.
   */
  startGrab(req) {
    const ok = !this.dead && !!req && this.grab.start(req);
    if (ok) {
      this._grabAnchor = req.anchor ?? null;
      this._pinToAnchor();
    }
    this.events.emit(EVENTS.GRAB_RESULT, { attackerId: req?.attackerId, targetId: PLAYER_ID, accepted: ok });
    return ok;
  }

  /** Let go of a held Zed (Dugan died / stunned). No-op unless held by attackerId. */
  releaseGrab(attackerId, reason = 'stunned') {
    if (!this.grab.held || this.grab.info.attackerId !== attackerId) return false;
    return this.grab.release(reason);
  }

  _anchor() {
    const a = typeof this._grabAnchor === 'function' ? this._grabAnchor() : this._grabAnchor;
    return a && Number.isFinite(a.x) && Number.isFinite(a.y) ? a : null;
  }

  // Hang Zed at the hand offset in front of Dugan, facing him. Called every frame while held.
  _pinToAnchor() {
    const a = this._anchor();
    const body = this.sprite.body;
    body.setVelocity(0, 0);
    if (!a) return;
    const af = a.facing < 0 ? -1 : 1;
    if (a.lane != null) this.laneY = Math.min(LANE.maxY, Math.max(LANE.minY, a.lane));
    this.facing = -af;
    const k = Math.min(1, this.grab.timer / Math.max(1, this.grab.info?.holdMs || 1)), lift = GRAB_CONFIG.liftPx * (k * k * (3 - 2 * k)); // smoothstep: carried up
    this.sprite.setPosition(a.x + af * GRAB_CONFIG.handOffset.x, a.y + GRAB_CONFIG.handOffset.y - lift - this.depthOffset);
  }

  _onGrabEvent(name, p) {
    const body = this.sprite.body;
    if (name === 'held') {
      this.machine.lock('held');
      body.setAllowGravity(false);
      body.setVelocity(0, 0);
    } else if (name === 'broken') {
      this.machine.lock('getup');
      body.setAllowGravity(true);
      const a = this._anchor();
      if (a) this.sprite.setPosition(a.x + (a.facing < 0 ? -1 : 1) * GRAB_CONFIG.breakDropDx, this.sprite.y);
      body.setVelocity(0, 0);
      this.events.emit(EVENTS.GRAB_BROKEN, { attackerId: p.attackerId });
    } else if (name === 'slam') {
      this._slam(p);
    } else if (name === 'getup') {
      this.machine.lock('getup');
    } else if (name === 'recovered' || name === 'released') {
      this.machine.unlock();
      body.setAllowGravity(true);
    }
  }

  // The hold ended without a break: the slam goes through the normal pipeline as a synthetic hit-request from Dugan.
  _slam(p) {
    this.machine.lock('slammed');
    this.sprite.body.setAllowGravity(true);
    const dir = p.slamDir < 0 ? -1 : 1;
    this.facing = -dir;   // he is thrown toward the wall, so he falls backwards: his back leads the way
    this.sprite.setPosition(this.sprite.x, this.floorY - this.cfg.bodySize.h / 2); // slammed onto the floor (the hand pin is airborne)
    const x = this.sprite.x, y = this.sprite.y + this.depthOffset;
    this._slamHit = null;
    this._slamEmitting = true;
    try {
      this.events.emit(EVENTS.HIT_REQUEST, {
        attackerId: p.attackerId,
        attackId: `${p.attackerId}:slam:${++this._slamSeq}`,
        team: TEAMS.RUST,
        hitbox: { ...GRAB_CONFIG.slamHitbox },
        origin: { x: x - dir * 24, y }, // behind Zed relative to the wall, so combat's knockback sign points at the wall
        lane: this.laneY,
        facing: 1,
        damage: p.slamDamage, knockback: p.slamKnockback, hitstun: 0,
        pierceInvuln: true, unblockable: true, nonLethal: true, // the slam hurts a lot but never kills Zed
      });
    } finally { this._slamEmitting = false; }
    this.sprite.body.setVelocityX(dir * p.slamKnockback);
    this.events.emit(EVENTS.PLAYER_SLAMMED, { attackerId: p.attackerId, damage: this._slamHit ? this._slamHit.amount : 0, slamDir: dir, x, y });
  }

  // Per-frame while any grab state is active (replaces movement/attack handling).
  _updateGrab(delta) {
    const g = this.grab, body = this.sprite.body;
    if (g.held) {
      const taps = (this._pending.light ? 1 : 0) + (this._pending.heavy ? 1 : 0);   // only the light (J) and heavy (K) attacks break a hold; jump does nothing
      if (taps) g.tap(taps);
    }
    if (g.held) this._pinToAnchor();
    g.update(delta);
    if (g.held) this._pinToAnchor();
    else if (g.state === 'slammed' || g.state === 'getup' || g.state === 'broken') body.setVelocityX(body.velocity.x * Math.pow(GRAB_CONFIG.slamPopFactor, delta / (1000 / 60)));
    else if (!g.active) body.setVelocityX(0);
    this._setRunSound(false);
    this.sprite.setFlipX(this.facing < 0);
  }

  respawn(x, y) {
    this.grab.reset(); this._grabAnchor = null; this.machine.locked = false; this.sprite.body.setAllowGravity(true);
    this.dead = false;
    this.carrying = false; // retry: empty-handed
    this.sprite.setPosition(x, y).setVelocity(0, 0).clearTint();
    this.laneY = this.floorY;
    this.machine.endRage(); this.rage.reset(this.rage.level); // retry: meter back to 0, nothing carries over
    this.machine.hitstunLeft = 0; this.machine.moveId = null; this.machine._set('idle');
    this._register();
  }

  /** True while Zed holds a weapon: plays the 8-way carry idle/walk clips. No pickup in the game grants one yet. */
  get carrying() { return this._carrying; }
  set carrying(v) {
    v = !!v;
    if (v === this._carrying) return;
    this._carrying = v;
    this.events.emit(PLAYER_CARRYING_CHANGED, { carrying: v });
  }

  /** Play the crouch-and-grab clip and lock input briefly. Call when an item is collected. Ignored if airborne/busy/dead. */
  startPickup() {
    const body = this.sprite.body;
    if (this.dead || !(body.blocked.down || body.touching.down)) return false;
    return this.machine.startPickup();
  }

  /** Set the 1-based level number (call at level start). Resets the meter; hidden below level 2. */
  setLevel(levelNumber) { this.rage.reset(levelNumber); }

  /** True when the held horizontal input points into a wall (world edge or camera-lock edge) Zed is already touching. */
  _pushingIntoWall(moveX, body = this.sprite.body) {
    if (!moveX) return false;
    if (moveX < 0 && body.blocked.left) return true;
    if (moveX > 0 && body.blocked.right) return true;
    const r = this.getXRange && this.getXRange();
    if (!r) return false;
    return (moveX < 0 && this.sprite.x <= r.min + 1) || (moveX > 0 && this.sprite.x >= r.max - 1);
  }

  _grounded() { const b = this.sprite.body; return b.blocked.down || b.touching.down; }

  _canStartSpecial() { return !this.dead && this.machine.canStartSpecial(this._grounded()); }

  _startRage() { this.machine.beginRage(); } // onMoveStart plays the swing sound

  /**
   * Advance the Rage clocks. Call every scene update with the real frame delta (ms).
   * hold = true while paused / wave transition / cutscene / round not running: nothing drains.
   */
  tickRage(deltaMs, hold = false) {
    if (this.rage.update(deltaMs / 1000, hold, { canStart: this._canStartSpecial() })) this._startRage();
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
  /** World y of Zed's feet right now: the floor line minus jump height. */
  get feetY() { return this.laneY - this._lift(); }
  get state() { return this.machine.state; }

  /** Call from scene.update(time, delta). */
  update(time, delta) {
    const cfg = this.cfg;
    const body = this.sprite.body;
    const grounded = body.blocked.down || body.touching.down;
    const pad = this.scene.input.gamepad && this.scene.input.gamepad.total ? this.scene.input.gamepad.getPad(0) : null;
    this.input.poll(new Set([...this.down, ...this.tapped, ...(pad ? padToKeys(pad) : [])]));
    this.tapped.clear();
    for (const a of Object.keys(this.input.pressed)) if (this.input.pressed[a]) this._pending[a] = true;
    const inp = this.input;
    if (this.dead && this.grab.active) { this.grab.reset(); this.machine.unlock(); body.setAllowGravity(true); }
    if (this.dead) { this._setRunSound(false); this.sprite.setFlipX(this.facing < 0); body.setVelocityX(0); return; }
    if (!this.grab.active) this.grab.update(delta); // free-state invulnerability after a break / release
    if (this.grab.active) { this._updateGrab(delta); this._pending = {}; return; } // held / slammed / getting up: controls locked
    const locked = this.machine.state === 'attack' || this.machine.state === 'hitstun' || this.machine.state === 'block' || this.machine.state === 'parry' || this.machine.state === 'pickup';

    // Jump (ground only, not during attack/hitstun/block)
    if (this.jump.update({ grounded, jumpPressed: inp.pressed.jump && !locked }, delta)) {
      body.setVelocityY(cfg.jumpVelocity);
    }
    if (inp.released.jump && body.velocity.y < 0) body.setVelocityY(body.velocity.y * cfg.jumpCutMultiplier);

    // L: start Rage now if READY and free, else buffer until Zed can (lands). Latched edge so a short tap counts.
    // U / N: hurl the carried weapon (the scene spawns the projectile); empty-handed it does nothing.
    if (this._pending.throw) {
      this._pending.throw = false;
      if (this._carrying && !locked && !this.machine.locked) {
        this.carrying = false;
        this.events.emit(PLAYER_THROW, { x: this.sprite.x, y: this.sprite.y + this.depthOffset, lane: this.laneY, facing: this.facing });
      }
    }

    if (this._pending.special) {
      this._pending.special = false;
      if (this.rage.pressSpecial(this._canStartSpecial()) === 'started') this._startRage();
    }

    // Pushing into an arena wall / screen lock edge: Zed isn't actually moving, so stop the run (idle pose, no footsteps)
    // instead of running on the spot. Turning away from the wall (or any other input) frees him immediately.
    const atWall = this._pushingIntoWall(inp.moveX, body);
    const moveX = atWall ? 0 : inp.moveX;

    // Fixed-step state machine (pressed edges delivered on first step of the frame)
    this._acc += delta;
    let pressed = this._pending;
    while (this._acc >= cfg.fixedStepMs) {
      this._acc -= cfg.fixedStepMs;
      this.machine.step({ pressed, held: inp.held, moveX: moveX || (inp.moveY !== 0 ? 1 : 0) }, { grounded }); // walking up/down counts as running
      pressed = {};
      this._pending = {};
    }

    // Horizontal movement
    const s = this.machine.state;
    if (this.dead) body.setVelocityX(0);
    else if (s === 'hitstun') body.setVelocityX(body.velocity.x * 0.9); // knockback set in _handleDamage, decays
    else if (s === 'parry' || s === 'pickup') body.setVelocityX(0);
    else {
      const f = s === 'attack' ? cfg.attackMoveFactor : s === 'block' ? cfg.blockMoveFactor : 1;
      if (inp.moveX !== 0 && s !== 'attack' && s !== 'block') this.facing = inp.moveX;
      body.setVelocityX(moveX * cfg.runSpeed * f);
    }
    // Depth movement: up/down the floor band, frozen while attacking, guarding, stunned or picking up.
    if (!this.dead && !locked && inp.moveY !== 0) {
      this.laneY = Math.min(LANE.maxY, Math.max(LANE.minY, this.laneY + inp.moveY * cfg.depthSpeed * delta / 1000));
    }
    if (!locked) this.dir8 = dir8FromInput(inp.moveX, inp.moveY, this.dir8);
    this.sprite.setFlipX(this.facing < 0);
    this._setRunSound(s === 'run' && grounded, moveX, inp.moveY);
  }

  destroy() {
    this._setRunSound(false);
    this.scene.events.off('pause', this._onScenePause);
    this.scene.events.off('resume', this._onSceneResume);
    this.events.off(EVENTS.DAMAGE_APPLIED, this._onDamage);
    this.events.off(EVENTS.ENTITY_DIED, this._onDied);
    this.events.off(EVENTS.RETRY, this._onRetry);
    this.events.off(EVENTS.GRAB, this._onGrab);
    this.events.off(EVENTS.GRAB_SLAM, this._onGrabSlam);
    this.events.off(EVENTS.GRAB_RELEASE, this._onGrabRelease);
    this.events.emit(EVENTS.ENTITY_UNREGISTERED, { id: PLAYER_ID });
    this.scene.input.keyboard.off('keydown', this._onDown);
    this.scene.input.keyboard.off('keyup', this._onUp);
    this.scene.input.keyboard.removeCapture(['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp']);
    this.sprite.destroy();
  }
}
