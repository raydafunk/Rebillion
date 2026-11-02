// Zed's side of Brick Dugan's Grab and Wall Slam: ALL tuning numbers in one place (ms / px). Plain data, no Phaser.
// The hold length, slam damage and slam knockback come from Dugan's grab request (duganData), not from here.
export const GRAB_CONFIG = {
  breakTaps: 7,          // light (J) / heavy (K) attack taps while held that break the hold early
  breakLockMs: 120,      // after a break: Zed drops and cannot act this long
  breakInvulnMs: 250,    // total invulnerability after a break (includes breakLockMs)
  breakDropDx: 110,      // px in front of Dugan where Zed lands after a break
  releaseInvulnMs: 250,  // invulnerability after a forced release (Dugan died / was stunned)
  slamFallMs: 420,       // the fall-backwards clip is stretched over this; he lies on the last frame for the rest of slamDownMs
  slamDownMs: 700,       // on the ground after the slam (invulnerable)
  getupMs: 300,          // get-up animation (invulnerable, controls locked)
  handOffset: { x: 56, y: -30 }, // where Zed hangs relative to the anchor; x is in Dugan's facing direction
  liftPx: 42,            // Dugan lifts him this much higher over the hold (eased), so he is carried up before the slam
  slamPopFactor: 0.9,    // per-60fps-frame decay of the slam knockback speed while down
  slamHitbox: { x: -80, y: -60, w: 160, h: 120 }, // box of the synthetic slam hit-request (covers Zed)
};
