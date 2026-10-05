// Pure, frame-stepped combat state machine. No Phaser, no events.
// States: idle, run, jump, attack, hitstun, block.
import { MOVES, OPENERS, PLAYER_TIMING, DODGE, GUARD } from './moves.js';

export class PlayerStateMachine {
  constructor({ moves = MOVES, openers = OPENERS, timing = PLAYER_TIMING, onActiveStart, onActive, onStateChange, dodge = DODGE, guard = GUARD } = {}) {
    this.dodgeCfg = dodge;
    this.guardCfg = guard;
    this.onActive = onActive || (() => {}); // every active frame: (moveId, move, swingId)
    this.swing = 0;          // increments per move start (unique attack id source)
    this.blockFrames = 0;
    this.dodgeFrame = 0;
    this.dodgeCooldown = 0;
    this.moves = moves;
    this.openers = openers;
    this.timing = timing;
    this.onActiveStart = onActiveStart || (() => {}); // (moveId, moveData) at first active frame
    this.onStateChange = onStateChange || (() => {});
    this.state = 'idle';
    this.moveId = null;
    this.frame = 0;          // frames since current move / hitstun began
    this.hitstunLeft = 0;
    this.buffered = null;    // 'light' | 'heavy'
    this.bufferLeft = 0;
  }

  get phase() {
    if (this.state !== 'attack') return null;
    const m = this.moves[this.moveId];
    if (this.frame < m.startup) return 'startup';
    if (this.frame < m.startup + m.active) return 'active';
    return 'recovery';
  }

  /** 'dodge' | 'parry' | 'block' | null : what the player is currently defending with. */
  get guardType() {
    if (this.state === 'dodge' && this.dodgeFrame < this.dodgeCfg.iframes) return 'dodge';
    if (this.state === 'block') return this.blockFrames < this.guardCfg.parryFrames ? 'parry' : 'block';
    return null;
  }

  _set(state) {
    if (state === this.state) return;
    const prev = this.state;
    this.state = state;
    this.onStateChange(state, prev);
  }

  _startMove(id) {
    this.moveId = id;
    this.swing++;
    this.frame = 0;
    this.buffered = null;
    this.bufferLeft = 0;
    this._set('attack');
    // Re-fire state change semantics for chained moves is handled by onActiveStart per move.
  }

  /** Enter hit stun (interrupts everything). */
  hit(frames) {
    this.hitstunLeft = Math.max(1, frames | 0);
    this.blockFrames = 0;
    this.moveId = null;
    this.buffered = null;
    this._set('hitstun');
  }

  /**
   * Advance one frame.
   * input: { pressed:{light,heavy,block...}, held:{block,...}, moveX }
   * ctx: { grounded:boolean }
   */
  step(input, ctx = { grounded: true }) {
    const pressed = input.pressed || {};
    const held = input.held || {};
    const moveX = input.moveX || 0;

    if (this.state === 'hitstun') {
      if (--this.hitstunLeft <= 0) this._set('idle');
      else return this.state;
    }

    // Buffer attack presses.
    const atk = pressed.heavy ? 'heavy' : pressed.light ? 'light' : null;
    if (atk) { this.buffered = atk; this.bufferLeft = this.timing.attackBufferFrames; }
    else if (this.bufferLeft > 0 && --this.bufferLeft === 0) this.buffered = null;

    if (this.state === 'attack') {
      const m = this.moves[this.moveId];
      // Chain cancel
      const next = this.buffered && m.chain[this.buffered];
      if (next && this.frame >= m.cancelFrom) {
        this._startMove(next);
      } else if (this.frame >= m.startup + m.active + m.recovery - 1) {
        this.moveId = null;
        this._set('idle');
        // fall through to neutral handling below so buffered input is not lost
      }
    }

    if (this.dodgeCooldown > 0) this.dodgeCooldown--;
    if (this.state === 'dodge') {
      if (++this.dodgeFrame >= this.dodgeCfg.duration) this._set('idle');
      else return this.state;
    }

    if (this.state !== 'attack') {
      if (!ctx.grounded) {
        this._set('jump');
      } else if (this.buffered && this.openers[this.buffered]) {
        this._startMove(this.openers[this.buffered]);
      } else if (pressed.dodge && this.dodgeCooldown <= 0) {
        this.dodgeFrame = 0;
        this.dodgeCooldown = this.dodgeCfg.cooldown;
        this._set('dodge');
      } else if (held.block) {
        if (this.state !== 'block') this.blockFrames = 0; else this.blockFrames++;
        this._set('block');
      } else {
        this._set(moveX !== 0 ? 'run' : 'idle');
      }
    }

    if (this.state === 'attack') {
      const m = this.moves[this.moveId];
      if (this.frame === m.startup) this.onActiveStart(this.moveId, m, this.swing);
      if (this.frame >= m.startup && this.frame < m.startup + m.active) this.onActive(this.moveId, m, this.swing);
      this.frame++;
    }
    return this.state;
  }
}
