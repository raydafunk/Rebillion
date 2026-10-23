// Rust Bruiser (Breaker) sprite data. No Phaser. Art lives in assets/sprites/Rust Bruisers/ (48x48 PNGs):
//   rotations/<dir>.png and animations/walking/<dir>/frame_000..007.png for 8 directions.
// Until the Breaker has its own AI, Breaker spawns are grunts whose spawn spec carries skin 'rust-breaker'.
export const BREAKER_SOURCE_ID = 'rust-breaker';
export const BREAKER_SPRITE_KEY = 'rust.breaker';
export const BREAKER_PLACEHOLDER_PATH = 'assets/sprites/rust-breaker-placeholder.svg';
export const BREAKER_DIR = 'assets/sprites/Rust Bruisers';
export const BREAKER_FRAMES = 8;
export const BREAKER_WALK_FPS = 10;
export const BREAKER_DISPLAY_SIZE = 144;
// Three-hit strike (Rust_Bruisers_Action): 9 frames per direction, 68x68. Played once across the grunt's attack state (~570ms).
export const BREAKER_ATTACK_DIR = 'assets/sprites/Rust_Bruisers_Action';
export const BREAKER_ATTACK_FOLDER = 'The_character_executes_a_rapid_three-hit_strike_se';
export const BREAKER_ATTACK_FRAMES = 9;
export const BREAKER_ATTACK_MS = 570;
// Clockwise on screen starting at east (screen y points down, so +y is south).
export const DIRECTIONS = Object.freeze(['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east']);

export const breakerRotationKey = (dir) => `${BREAKER_SPRITE_KEY}.rot.${dir}`;
export const breakerFrameKey = (dir, i) => `${BREAKER_SPRITE_KEY}.walk.${dir}.${i}`;
export const breakerWalkAnimKey = (dir) => `${BREAKER_SPRITE_KEY}.walk.${dir}`;
export const breakerRotationPath = (dir) => `${BREAKER_DIR}/rotations/${dir}.png`;
export const breakerFramePath = (dir, i) => `${BREAKER_DIR}/animations/walking/${dir}/frame_${String(i).padStart(3, '0')}.png`;

export const breakerAttackFrameKey = (dir, i) => `${BREAKER_SPRITE_KEY}.attack.${dir}.${i}`;
export const breakerAttackAnimKey = (dir) => `${BREAKER_SPRITE_KEY}.attack.${dir}`;
export const breakerAttackFramePath = (dir, i) => `${BREAKER_ATTACK_DIR}/animations/${BREAKER_ATTACK_FOLDER}/${dir}/frame_${String(i).padStart(3, '0')}.png`;

/** 8-way direction name from a screen-space velocity; null when (nearly) still. */
export function directionFromVelocity(vx, vy, minSpeed = 1) {
  if (Math.hypot(vx, vy) < minSpeed) return null;
  const a = Math.atan2(vy, vx); // 0 = east, +pi/2 = south
  const idx = ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;
  return DIRECTIONS[idx];
}

/**
 * What to show: { anim } while walking, or { rotation } (static pose) when idle/attacking/stunned/dead.
 * e: { vx, vy, facing, state } as on RustGrunt.
 */
export function breakerPose(e) {
  if (e.state === 'attack') {
    const face = e.facing < 0 ? 'west' : 'east'; // strikes are horizontal; hit boxes are left/right of the grunt
    return { anim: breakerAttackAnimKey(face), dir: face, once: true };
  }
  const still = ['telegraph', 'hitstun', 'dead'].includes(e.state);
  const dir = still ? null : directionFromVelocity(e.vx || 0, e.vy || 0);
  if (dir) return { anim: breakerWalkAnimKey(dir), dir };
  const face = e.facing < 0 ? 'west' : 'east';
  return { rotation: breakerRotationKey(face), dir: face };
}
