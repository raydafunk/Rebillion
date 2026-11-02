// Pure grab state for Zed (no Phaser, no events bus). Timeline:
//   none -> held -> slammed (down) -> getup -> none          hold ran out / "slam now": takes the slam
//   none -> held -> broken -> none (+ short invulnerability)  enough taps while held
//   none -> held -> none (+ short invulnerability)            release (Dugan died / stunned)
// All non-'none' states lock Zed's controls and make him ignore other hit-requests (see Zed.js).
import { GRAB_CONFIG } from './grabConfig.js';

export class GrabController {
  /** onEvent(name, payload): 'held' | 'broken' | 'slam' | 'getup' | 'recovered' | 'released' */
  constructor(cfg = GRAB_CONFIG, onEvent = () => {}) {
    this.cfg = cfg;
    this.onEvent = onEvent;
    this.reset();
  }

  reset() {
    this.state = 'none';
    this.info = null;     // the grab request
    this.timer = 0;       // ms in the current state
    this.taps = 0;
    this.invulnLeft = 0;  // free-state invulnerability (after break / release)
  }

  get active() { return this.state !== 'none'; }
  get held() { return this.state === 'held'; }
  /** 0..1 break meter progress, for a HUD. */
  get progress() { return this.state === 'held' ? Math.min(1, this.taps / this.cfg.breakTaps) : 0; }
  /** True while Zed must ignore other hits (held, down, getting up, break/release window). */
  get invulnerable() { return this.active || this.invulnLeft > 0; }
  canGrab() { return this.state === 'none' && this.invulnLeft <= 0; }

  _enter(state) { this.state = state; this.timer = 0; }

  /** Dugan's grab connected. req: { attackerId, holdMs, slamDamage, slamKnockback, slamDir }. False if Zed can't be grabbed now. */
  start(req) {
    if (!this.canGrab()) return false;
    this.info = req;
    this.taps = 0;
    this._enter('held');
    this.onEvent('held', req);
    return true;
  }

  /** One light/heavy attack tap. Returns true when this tap broke the hold. */
  tap(n = 1) {
    if (this.state !== 'held') return false;
    this.taps += n;
    if (this.taps < this.cfg.breakTaps) return false;
    const info = this.info;
    this._enter('broken');
    this.onEvent('broken', info);
    return true;
  }

  /** Slam now (Dugan's slam frame, or the hold ran out). False if not held. */
  slam() {
    if (this.state !== 'held') return false;
    const info = this.info;
    this._enter('slammed');
    this.onEvent('slam', info);
    return true;
  }

  /** Let go safely: reason 'died' | 'stunned'. Only while held. */
  release(reason = 'stunned') {
    if (this.state !== 'held') return false;
    const info = this.info;
    this.state = 'none'; this.timer = 0; this.info = null;
    this.invulnLeft = this.cfg.releaseInvulnMs;
    this.onEvent('released', { ...info, reason });
    return true;
  }

  update(dtMs) {
    if (this.invulnLeft > 0) this.invulnLeft = Math.max(0, this.invulnLeft - dtMs);
    if (this.state === 'none') return;
    this.timer += dtMs;
    const c = this.cfg;
    if (this.state === 'held') {
      if (this.timer >= this.info.holdMs) this.slam(); // safety timeout / default slam time
    } else if (this.state === 'broken') {
      if (this.timer >= c.breakLockMs) {
        this.invulnLeft = Math.max(0, c.breakInvulnMs - c.breakLockMs);
        this._finish();
      }
    } else if (this.state === 'slammed') {
      if (this.timer >= c.slamDownMs) { this._enter('getup'); this.onEvent('getup', this.info); }
    } else if (this.state === 'getup') {
      if (this.timer >= c.getupMs) this._finish();
    }
  }

  _finish() {
    const info = this.info;
    this.state = 'none'; this.timer = 0; this.info = null;
    this.onEvent('recovered', info);
  }
}
