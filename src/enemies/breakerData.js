// Rust Bruiser (Breaker) sprite data. No Phaser. Art lives in assets/sprites/Rust Bruisers walking/ (48x48 PNGs):
//   rotations/<dir>.png and animations/walking/<dir>/frame_000..007.png for 8 directions.
// Until the Breaker has its own AI, Breaker spawns are grunts whose spawn spec carries skin 'rust-breaker'.
export const BREAKER_SOURCE_ID = 'rust-breaker';
export const BREAKER_SPRITE_KEY = 'rust.breaker';
export const BREAKER_PLACEHOLDER_PATH = 'assets/sprites/rust-breaker-placeholder.svg';
export const BREAKER_DIR = 'assets/sprites/Rust Bruisers walking';
export const BREAKER_FRAMES = 8;
export const BREAKER_WALK_FPS = 10;
export const BREAKER_DISPLAY_SIZE = 144;
// Three-hit strike (Rust_Bruisers_Action): 9 frames per direction, 68x68. Played once across the grunt's attack state (~570ms).
export const BREAKER_ATTACK_DIR = 'assets/sprites/Rust_Bruisers_Action';
export const BREAKER_ATTACK_FOLDER = 'The_character_executes_a_rapid_three-hit_strike_se';
export const BREAKER_ATTACK_FRAMES = 9;
export const BREAKER_ATTACK_MS = 570;
// Hit reaction (hit_animation): 9 frames per direction, played once across the grunt's hit-stun (duration set per play).
// Only east and west exist; the art ships two west takes, so the folder is pinned here.
export const BREAKER_HIT_DIR = 'assets/sprites/hit_animation';
export const BREAKER_HIT_FOLDER = 'The_armored_figure_pulls_its_right_shoulder_back_a';
export const BREAKER_HIT_FRAMES = 9;
export const BREAKER_HIT_DIRS = Object.freeze({ east: 'east', west: 'west-83732b8c' });
// Death collapse (Death_fall_with_pop): 9 frames, east and west only (plain folder names). Starts only once the enemy's health bar has
// emptied; the 9 frames are fitted to BREAKER_DEATH_MS (timeScale), the last frame is held, then the view fades out.
export const BREAKER_DEATH_DIR = 'assets/sprites/Death_fall_with_pop';
export const BREAKER_DEATH_FOLDER = 'The_character_collapses_heavily_onto_the_ground_ca';
export const BREAKER_DEATH_FRAMES = 9;
export const BREAKER_DEATH_DIRS = Object.freeze({ east: 'east', west: 'west' });
// Half the on-screen width of the collapsed pile (47px of art x scale 3, plus margin); keeps the corpse inside the screen.
export const BREAKER_DEATH_HALF_WIDTH = 80;
export const BREAKER_DEATH_MS = 700;
export const BREAKER_DEATH_HOLD_MS = 250;
export const BREAKER_DEATH_FADE_MS = 250;
export const BREAKER_DEATH_DEFAULT_FPS = 30; // anim's registered rate; timeScale = (frames / fps) / BREAKER_DEATH_MS
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

export const breakerHitFrameKey = (dir, i) => `${BREAKER_SPRITE_KEY}.hit.${dir}.${i}`;
export const breakerHitAnimKey = (dir) => `${BREAKER_SPRITE_KEY}.hit.${dir}`;
export const breakerHitFramePath = (dir, i) => `${BREAKER_HIT_DIR}/animations/${BREAKER_HIT_FOLDER}/${BREAKER_HIT_DIRS[dir]}/frame_${String(i).padStart(3, '0')}.png`;

export const breakerDeathFrameKey = (dir, i) => `${BREAKER_SPRITE_KEY}.death.${dir}.${i}`;
export const breakerDeathAnimKey = (dir) => `${BREAKER_SPRITE_KEY}.death.${dir}`;
export const breakerDeathFramePath = (dir, i) => `${BREAKER_DEATH_DIR}/animations/${BREAKER_DEATH_FOLDER}/${BREAKER_DEATH_DIRS[dir]}/frame_${String(i).padStart(3, '0')}.png`;
export const breakerDeathTimeScale = () => (BREAKER_DEATH_FRAMES * 1000 / BREAKER_DEATH_DEFAULT_FPS) / BREAKER_DEATH_MS;

/** Lifetime of a dead enemy's view, t ms after the death anim started: { phase: 'anim'|'hold'|'fade'|'done', alpha }. */
export function deathViewPhase(t) {
  if (t < BREAKER_DEATH_MS) return { phase: 'anim', alpha: 1 };
  const h = t - BREAKER_DEATH_MS;
  if (h < BREAKER_DEATH_HOLD_MS) return { phase: 'hold', alpha: 1 };
  const f = h - BREAKER_DEATH_HOLD_MS;
  if (f < BREAKER_DEATH_FADE_MS) return { phase: 'fade', alpha: 1 - f / BREAKER_DEATH_FADE_MS };
  return { phase: 'done', alpha: 0 };
}

/** 8-way direction name from a screen-space velocity; null when (nearly) still. */
export function directionFromVelocity(vx, vy, minSpeed = 1) {
  if (Math.hypot(vx, vy) < minSpeed) return null;
  const a = Math.atan2(vy, vx); // 0 = east, +pi/2 = south
  const idx = ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;
  return DIRECTIONS[idx];
}

/**
 * What to show: { anim } while walking/attacking/stunned (hit also carries a rotation fallback), or { rotation } (static pose) when idle/attacking/stunned/dead.
 * e: { vx, vy, facing, state } as on RustGrunt.
 */
export function breakerPose(e) {
  if (e.state === 'attack') {
    const face = e.facing < 0 ? 'west' : 'east'; // strikes are horizontal; hit boxes are left/right of the grunt
    return { anim: breakerAttackAnimKey(face), dir: face, once: true };
  }
  if (e.state === 'hitstun') {
    const face = e.facing < 0 ? 'west' : 'east'; // facing is frozen during stun, so the reaction matches the side the grunt was looking at
    return { anim: breakerHitAnimKey(face), dir: face, once: true, hit: true, rotation: breakerRotationKey(face) };
  }
  if (e.state === 'dead') {
    const face = e.facing < 0 ? 'west' : 'east';
    return { anim: breakerDeathAnimKey(face), dir: face, once: true, death: true, rotation: breakerRotationKey(face) };
  }
  const still = ['telegraph', 'dead'].includes(e.state);
  const dir = still ? null : directionFromVelocity(e.vx || 0, e.vy || 0);
  if (dir) return { anim: breakerWalkAnimKey(dir), dir };
  const face = e.facing < 0 ? 'west' : 'east';
  return { rotation: breakerRotationKey(face), dir: face };
}
