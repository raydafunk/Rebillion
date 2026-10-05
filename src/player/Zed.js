// Zed: Phaser Arcade sprite wrapper. Movement + state machine. Uses global Phaser.
import { ZED_CONFIG } from './config.js';
import { InputState } from './input.js';
import { JumpController } from './jump.js';
import { PlayerStateMachine } from './stateMachine.js';
import { EVENTS } from '../shared/events.js';
import { TEAMS, PLAYER_ID, COMBAT_DEFAULTS } from '../shared/combatData.js';
import { DODGE, GUARD } from './moves.js';

// Phaser KeyboardEvent.code values we care about; we feed raw codes into InputState.
const WATCHED = ['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD', 'ArrowUp', 'KeyW', 'Space',
  'KeyJ', 'KeyZ', 'KeyK', 'KeyX', 'KeyL', 'KeyC', 'ShiftLeft', 'KeyV'];

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
    this.facing = 1;
    this.input = new InputState();
    this.jump = new JumpController(cfg);
    this.events = scene.game.events;
    this.dead = false;
    this.machine = new PlayerStateMachine({
      onActive: (moveId, m, swing) => this._emitHit(m, swing),
    });
    this.down = new Set();
    this._acc = 0;

    const kb = scene.input.keyboard;
    this._onDown = (e) => this.down.add(e.code);
    this._onUp = (e) => this.down.delete(e.code);
    kb.on('keydown', this._onDown);
    kb.on('keyup', this._onUp);

    this._onDamage = (d) => this._handleDamage(d);
    this._onDied = (d) => { if (d.id === PLAYER_ID) this.dead = true; };
    this._onRetry = () => this.respawn(x, y);
    this.events.on(EVENTS.DAMAGE_APPLIED, this._onDamage);
    this.events.on(EVENTS.ENTITY_DIED, this._onDied);
    this.events.on(EVENTS.RETRY, this._onRetry);
    this._register();
  }

  _register() {
    const { w, h } = this.cfg.bodySize;
    this.events.emit(EVENTS.ENTITY_REGISTERED, {
      id: PLAYER_ID,
      team: TEAMS.PLAYER,
      maxHp: COMBAT_DEFAULTS.PLAYER_MAX_HP,
      hurtbox: { x: -w / 2, y: -h / 2, w, h },
      // guardType is an extra, optional field: 'dodge' | 'parry' | 'block' | null
      getState: () => ({ x: this.sprite.x, y: this.sprite.y, facing: this.facing, guard: this.machine.guardType }),
    });
  }

  _emitHit(m, swing) {
    this.events.emit(EVENTS.HIT_REQUEST, {
      attackerId: PLAYER_ID,
      attackId: `${PLAYER_ID}:${swing}`, // same id on every active frame: one hit per target per swing
      team: TEAMS.PLAYER,
      hitbox: { ...m.hitbox },
      origin: { x: this.sprite.x, y: this.sprite.y },
      facing: this.facing,
      damage: m.damage,
      knockback: m.knockback,
      hitstun: m.hitstun * (1000 / 60),
    });
  }

  _handleDamage(d) {
    if (d.targetId !== PLAYER_ID || this.dead) return;
    const guard = this.machine.guardType;
    if (guard === 'dodge' || guard === 'parry') return;  // negated (hp refund needs combat support)
    if (guard === 'block') {
      this.sprite.body.setVelocityX(d.knockback * GUARD.blockKnockbackFactor);
      return; // no hitstun while blocking
    }
    this.machine.hit(Math.ceil(d.hitstun / this.cfg.fixedStepMs));
    this.sprite.body.setVelocityX(d.knockback);
    this.sprite.setTint(0xff6666);
    this.scene.time.delayedCall(d.hitstun, () => this.sprite.clearTint());
  }

  respawn(x, y) {
    this.dead = false;
    this.sprite.setPosition(x, y).setVelocity(0, 0).clearTint();
    this.machine.hitstunLeft = 0; this.machine.moveId = null; this.machine._set('idle');
    this._register();
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
  get state() { return this.machine.state; }

  /** Call from scene.update(time, delta). */
  update(time, delta) {
    const cfg = this.cfg;
    const body = this.sprite.body;
    const grounded = body.blocked.down || body.touching.down;
    this.input.poll(this.down);
    const inp = this.input;
    if (this.dead) { this.sprite.setFlipX(this.facing < 0); body.setVelocityX(0); return; }
    const locked = this.machine.state === 'attack' || this.machine.state === 'dodge' || this.machine.state === 'hitstun' || this.machine.state === 'block';

    // Jump (ground only, not during attack/hitstun/block)
    if (this.jump.update({ grounded, jumpPressed: inp.pressed.jump && !locked }, delta)) {
      body.setVelocityY(cfg.jumpVelocity);
    }
    if (inp.released.jump && body.velocity.y < 0) body.setVelocityY(body.velocity.y * cfg.jumpCutMultiplier);

    // Fixed-step state machine (pressed edges delivered on first step of the frame)
    this._acc += delta;
    let pressed = inp.pressed;
    while (this._acc >= cfg.fixedStepMs) {
      this._acc -= cfg.fixedStepMs;
      this.machine.step({ pressed, held: inp.held, moveX: inp.moveX }, { grounded });
      pressed = {};
    }

    // Horizontal movement
    const s = this.machine.state;
    if (this.dead) body.setVelocityX(0);
    else if (s === 'hitstun') body.setVelocityX(body.velocity.x * 0.9); // knockback set in _handleDamage, decays
    else if (s === 'dodge') body.setVelocityX(this.facing * DODGE.speed);
    else {
      const f = s === 'attack' ? cfg.attackMoveFactor : s === 'block' ? cfg.blockMoveFactor : 1;
      if (inp.moveX !== 0 && s !== 'attack' && s !== 'block') this.facing = inp.moveX;
      body.setVelocityX(inp.moveX * cfg.runSpeed * f);
    }
    this.sprite.setFlipX(this.facing < 0);
  }

  destroy() {
    this.events.off(EVENTS.DAMAGE_APPLIED, this._onDamage);
    this.events.off(EVENTS.ENTITY_DIED, this._onDied);
    this.events.off(EVENTS.RETRY, this._onRetry);
    this.events.emit(EVENTS.ENTITY_UNREGISTERED, { id: PLAYER_ID });
    this.scene.input.keyboard.off('keydown', this._onDown);
    this.scene.input.keyboard.off('keyup', this._onUp);
    this.sprite.destroy();
  }
}
