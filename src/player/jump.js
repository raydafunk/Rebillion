// Pure coyote-time + jump-buffer logic.
export class JumpController {
  constructor(cfg) {
    this.cfg = cfg;
    this.coyote = 0;
    this.buffer = 0;
  }
  /** Returns true on the frame a jump should launch. dtMs in ms. */
  update({ grounded, jumpPressed }, dtMs) {
    this.coyote = grounded ? this.cfg.coyoteMs : Math.max(0, this.coyote - dtMs);
    this.buffer = jumpPressed ? this.cfg.jumpBufferMs : Math.max(0, this.buffer - dtMs);
    if (this.buffer > 0 && this.coyote > 0) {
      this.buffer = 0;
      this.coyote = 0;
      return true;
    }
    return false;
  }
}
