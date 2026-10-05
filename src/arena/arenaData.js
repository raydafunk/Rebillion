// Arena geometry and failsafe tuning (Tier 0). Pixels / ms. Tune here only.
export const VIEW = Object.freeze({ w: 1280, h: 720 });
export const WORLD = Object.freeze({ w: 1920, h: 720 });
// Walkable floor band (entity origin = feet).
export const LANE = Object.freeze({ minY: 460, maxY: 680 });
// Horizontal padding keeping fighters inside the locked screen.
export const LOCK_MARGIN = 40;

export const FAILSAFE = Object.freeze({
  offscreenMargin: 120,   // px outside the view before an enemy counts as off-screen
  offscreenMs: 2500,      // off-screen this long -> reposition
  stuckMs: 4000,          // chasing but barely moving this long -> reposition
  stuckMinMove: 12,       // px moved within the stuck window counts as "moving"
  maxTeleports: 3,        // after this many repositions, remove the enemy
  checkEveryMs: 250,
});
