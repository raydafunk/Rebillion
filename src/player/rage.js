// Pure Rage meter (no Phaser). States: HIDDEN (level 1) -> BUILDING -> READY -> ACTIVE -> BUILDING ...
// Drive it with: onBlowLanded / onHitTaken / onKnockout / reset / update(dt, paused, ctx) / pressSpecial.
import { RAGE_CONFIG } from './rageConfig.js';

export const RAGE_STATES = Object.freeze({ HIDDEN: 'HIDDEN', BUILDING: 'BUILDING', READY: 'READY', ACTIVE: 'ACTIVE' });

export class RageMeter {
  /** @param {{config?:object, onEvent?:(name:string,payload:object)=>void}} opts  names: change, state, gain, ready, activated, ended, buffer */
  constructor({ config = RAGE_CONFIG, onEvent } = {}) {
    this.cfg = config;
    this.onEvent = onEvent || (() => {});
    this.level = 1;
    this.state = undefined;
    this.reset(1);
  }

  /** Level start and retry: meter to 0, nothing carries over. levelNumber is 1-based. */
  reset(levelNumber = this.level) {
    const wasActive = this.state === RAGE_STATES.ACTIVE;
    this.level = levelNumber;
    this.enabled = levelNumber >= this.cfg.enabledFromLevel;
    this.value = 0;
    this.streak = 0;
    this.buffered = false;
    this.readyTimeLeft = 0;
    this.rageTimeLeft = 0;
    this._setState(this.enabled ? RAGE_STATES.BUILDING : RAGE_STATES.HIDDEN);
    if (wasActive) this.onEvent('ended', { ...this.snapshot(), reason: 'reset' });
    this._changed();
  }

  get visible() { return this.state !== RAGE_STATES.HIDDEN; }
  get isActive() { return this.state === RAGE_STATES.ACTIVE; }
  get isReady() { return this.state === RAGE_STATES.READY; }

  snapshot() {
    return { value: this.value, max: this.cfg.max, state: this.state, visible: this.visible, streak: this.streak,
      readyTimeLeft: this.readyTimeLeft, rageTimeLeft: this.rageTimeLeft, buffered: this.buffered, level: this.level };
  }

  _setState(to) {
    const from = this.state;
    if (from === to) return;
    this.state = to;
    if (from !== undefined) this.onEvent('state', { ...this.snapshot(), from, to });
  }
  _changed() { this.onEvent('change', this.snapshot()); }
  _setBuffered(b) { if (this.buffered !== b) { this.buffered = b; this.onEvent('buffer', { buffered: b }); } }

  /** A blow connected with a Rust enemy (boss included). Any normal move gives the same base gain. No gain in ACTIVE. */
  onBlowLanded() {
    if (this.state === RAGE_STATES.HIDDEN || this.state === RAGE_STATES.ACTIVE) return 0;
    const bonus = this.streak >= this.cfg.streakLength;
    this.streak++;
    if (this.state !== RAGE_STATES.BUILDING) { this._changed(); return 0; } // READY: already full
    const amount = this.cfg.gainPerBlow + (bonus ? this.cfg.streakBonus : 0);
    this.value = Math.min(this.cfg.max, this.value + amount);
    this.onEvent('gain', { ...this.snapshot(), amount, bonus });
    if (this.value >= this.cfg.max) {
      this.readyTimeLeft = this.cfg.readyWindowSec;
      this._setState(RAGE_STATES.READY);
      this.onEvent('ready', this.snapshot());
    }
    this._changed();
    return amount;
  }

  /** Zed took a hit (caller decides whether block/parry count). Ends the streak, cancels a buffered press. */
  onHitTaken() {
    this.streak = 0;
    this._setBuffered(false);
    this._changed();
  }

  /** Zed's health reached 0. Ends Rage. (A knockdown is just onHitTaken.) */
  onKnockout() {
    this.streak = 0;
    this._setBuffered(false);
    if (this.state === RAGE_STATES.ACTIVE) this._endRage('knockout');
    this._changed();
  }

  _endRage(reason) {
    this.value = 0;
    this.rageTimeLeft = 0;
    this.streak = 0;
    this._setState(RAGE_STATES.BUILDING);
    this.onEvent('ended', { ...this.snapshot(), reason });
  }

  _activate() {
    this._setBuffered(false);
    this.readyTimeLeft = 0;
    this.rageTimeLeft = this.cfg.rageDurationSec;
    this.value = this.cfg.max;
    this._setState(RAGE_STATES.ACTIVE);
    this.onEvent('activated', this.snapshot());
    this._changed();
  }

  /**
   * L pressed. Returns 'started' (caller should begin the Special now), 'buffered' (fires later through
   * update(ctx.canStart)), or 'ignored' (not READY).
   */
  pressSpecial(canStart = true) {
    if (this.state !== RAGE_STATES.READY) return 'ignored';
    if (!canStart) { this._setBuffered(true); return 'buffered'; }
    this._activate();
    return 'started';
  }

  /**
   * Advance by dt seconds. paused = pause menu / wave transition / cutscene: nothing ticks.
   * ctx.canStart: Zed can start the Special right now (a buffered press fires when true).
   * Returns true on the call that started a buffered Rage (caller should begin the Special).
   */
  update(dt, paused = false, ctx = {}) {
    if (paused || !this.enabled || !(dt > 0)) return false;
    let left = dt;
    if (this.state === RAGE_STATES.READY) {
      if (this.buffered && ctx.canStart) { this._activate(); return true; }
      const used = Math.min(left, this.readyTimeLeft);
      this.readyTimeLeft -= used;
      left -= used;
      if (this.readyTimeLeft <= 0) { // window passed: press lost, drain from 100
        this.readyTimeLeft = 0;
        this._setBuffered(false);
        this._setState(RAGE_STATES.BUILDING);
      }
    }
    if (this.state === RAGE_STATES.BUILDING) {
      if (left > 0) this.value = Math.max(0, this.value - this.cfg.drainPerSec * left);
    } else if (this.state === RAGE_STATES.ACTIVE) {
      this.rageTimeLeft = Math.max(0, this.rageTimeLeft - dt);
      this.value = this.cfg.max * (this.rageTimeLeft / this.cfg.rageDurationSec);
      if (this.rageTimeLeft <= 0) this._endRage('expired');
    }
    this._changed();
    return false;
  }
}
