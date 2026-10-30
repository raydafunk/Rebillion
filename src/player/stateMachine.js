// Pure, frame-stepped combat state machine. No Phaser, no events.
// States: idle, run, jump, attack, hitstun, block.
import { MOVES, OPENERS, RAGE_OPENERS, PLAYER_TIMING, GUARD, PARRY, PICKUP_POSE } from './moves.js';

export class PlayerStateMachine {
  constructor({ moves = MOVES, openers = OPENERS, timing = PLAYER_TIMING, onActiveStart, onActive, onStateChange, onMoveStart, guard = GUARD, parry = PARRY, pickup = PICKUP_POSE } = {}) {
    this.baseOpeners = openers;
    this.rage = false;       // Rage mode: attack set swapped for the Special
    this.pickupCfg = pickup;
    this.pickupFrame = 0;
    this.parryCfg = parry;
    this.parryFrame = 0;
    this.parryCooldown = 0;
    this.parrySuccess = false;
    this.guardCfg = guard;
    this.onActive = onActive || (() => {}); // every active frame: (moveId, move, swingId)
    this.swing = 0;          // increments per move start (unique attack id source)
    this.blockFrames = 0;
    this.moves = moves;
    this.openers = openers;
    this.timing = timing;
    this.onMoveStart = onMoveStart || (() => {}); // (moveId, moveData, swingId) once when a move begins (incl. chained)
    this.onActiveStart = onActiveStart || (() => {}); // (moveId, moveData) at first active frame
    this.onStateChange = onStateChange || (() => {});
    this.state = 'idle';
    this.moveId = null;
    this.frame = 0;          // frames since current move / hitstun began
    this.hitstunLeft = 0;
    this.airKickUsed = false; // one flying kick per jump; reset on landing
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

  /** 'parry' | 'block' | null : what the player is currently defending with. */
  get guardType() {
    if (this.state === 'parry' && this.parryFrame < this.parryCfg.window) return 'parry';
    if (this.state === 'block') return this.blockFrames < this.guardCfg.parryFrames ? 'parry' : 'block';
    return null;
  }

  /** A hit was negated by the parry: until recovery ends, an attack press cancels into a counter. */
  parrySucceeded() { this.parrySuccess = this.state === 'parry'; }

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
    this.onMoveStart(id, this.moves[id], this.swing);
    // Re-fire state change semantics for chained moves is handled by onActiveStart per move.
  }

  /** Start the pick-up animation lock. Only from a free grounded state (not mid-attack/hitstun/parry/pickup). */
  startPickup() {
    if (!['idle', 'run', 'block'].includes(this.state)) return false;
    this.pickupFrame = 0;
    this.buffered = null;
    this.bufferLeft = 0;
    this._set('pickup');
    return true;
  }

  /** Can the Rage special start right now? Grounded and free (idle/run/block) or in attack recovery. */
  canStartSpecial(grounded) {
    if (!grounded) return false;
    return ['idle', 'run', 'block'].includes(this.state) || (this.state === 'attack' && this.phase === 'recovery');
  }

  /** Enter Rage mode and unleash the Special. Call only when canStartSpecial() is true. */
  beginRage() {
    this.rage = true;
    this.openers = RAGE_OPENERS;
    this._startMove('special');
  }

  /** Leave Rage mode: normal attack set returns. A Special already swinging finishes. */
  endRage() {
    this.rage = false;
    this.openers = this.baseOpeners;
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
    const atk = pressed.heavy ? 'heavy' : (pressed.light || (this.rage && pressed.special)) ? 'light' : null;
    // A press that would only replay the move already in progress (heavy during heavy1, which can't chain) is dropped,
    // otherwise it sits in the buffer and restarts the same animation the moment the move ends.
    const repeatsCurrent = atk && this.state === 'attack' && this.openers[atk] === this.moveId && !this.moves[this.moveId].chain[atk];
    if (atk && !repeatsCurrent) { this.buffered = atk; this.bufferLeft = this.timing.attackBufferFrames; }
    else if (this.bufferLeft > 0 && --this.bufferLeft === 0) this.buffered = null;

    if (this.state === 'attack') {
      const m = this.moves[this.moveId];
      // Chain cancel
      const next = this.buffered && m.chain[this.buffered];
      if (m.airOnly && ctx.grounded) {
        this.moveId = null;      // landing ends the flying kick
        this._set('idle');
      } else if (next && this.frame >= m.cancelFrom) {
        this._startMove(next);
      } else if (this.frame >= m.startup + m.active + m.recovery - 1) {
        this.moveId = null;
        this._set('idle');
        // fall through to neutral handling below so buffered input is not lost
      }
    }

    if (this.state === 'pickup') {
      if (++this.pickupFrame >= this.pickupCfg.duration) this._set('idle');
      else return this.state;
    }

    if (this.parryCooldown > 0) this.parryCooldown--;
    if (this.state === 'parry') {
      if (this.parrySuccess && this.buffered && this.openers[this.buffered]) {
        // Successful parry: skip the recovery and counter with the buffered attack.
        this.parrySuccess = false;
        this._startMove(this.openers[this.buffered]);
      } else if (++this.parryFrame >= this.parryCfg.duration) { this.parrySuccess = false; this._set('idle'); }
      else return this.state;
    }

    if (ctx.grounded) this.airKickUsed = false;
    if (this.state !== 'attack') {
      if (!ctx.grounded) {
        if (this.buffered === 'light' && !this.airKickUsed && this.moves.airkick && !this.rage) {
          this.airKickUsed = true;
          this._startMove('airkick');
        } else this._set('jump');
      } else if (this.buffered && this.openers[this.buffered]) {
        this._startMove(this.openers[this.buffered]);
      } else if (pressed.parry && this.parryCooldown <= 0) {
        this.parryFrame = 0;
        this.parrySuccess = false;
        this.parryCooldown = this.parryCfg.cooldown;
        this._set('parry');
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
