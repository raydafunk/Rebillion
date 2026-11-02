// Rust Breaker Type 2 sprite data. No Phaser. Art lives in assets/sprites/Rust-BreakerType2/ (rotations/<dir>.png for 8 directions):
//   Walking/animations/Scary_Walk (8 frames, 80px), Rust_Jab_Combo_A_qui (9 frames, 68px), stunned_when_hit/Taking_Punch
//   (6 frames, 80px, east/south/south-east only), falling_away_death (9 frames, 68px, 8 directions).
// Level 2 (Mustard Row) waves send these as their Breaker elites: wave rows carry eliteSkin 'rust-breaker-2'.
// Same gameplay as any Breaker (a grunt with more health); only the look and the animation set differ from breakerData.js.
import { DIRECTIONS, directionFromVelocity } from './breakerData.js';

export const BREAKER2_SKIN = 'rust-breaker-2';
export const BREAKER2_SPRITE_KEY = 'rust.breaker2';
export const BREAKER2_DIR = 'assets/sprites/Rust-BreakerType2';
export const BREAKER2_DIRS = DIRECTIONS;
export const BREAKER2_WALK_FRAMES = 8;
export const BREAKER2_WALK_FPS = 10;
export const BREAKER2_ATTACK_FRAMES = 9;
export const BREAKER2_ATTACK_MS = 570;
export const BREAKER2_HIT_FRAMES = 6;
// Hit art exists for east, south and south-east only; a west-facing hit plays the east frames mirrored (see breaker2Pose: flipX).
export const BREAKER2_HIT_DIRS = Object.freeze(['east', 'south', 'south-east']);
export const BREAKER2_DEATH_FRAMES = 9;
export const BREAKER2_DEATH_DEFAULT_FPS = 30;
export const BREAKER2_DEATH_MS = 700;
export const BREAKER2_WALK_FOLDER = 'Walking/animations/Scary_Walk';
export const BREAKER2_ATTACK_FOLDER = 'Rust_Jab_Combo_A_qui/animations/The_character_performs_a_rapid_three-hit_strike_se';
export const BREAKER2_HIT_FOLDER = 'stunned_when_hit/animations/Taking_Punch';
export const BREAKER2_DEATH_FOLDER = 'falling_away_death/animations/The_character_experiences_a_violent_impact_causing';

const pad = (i) => String(i).padStart(3, '0');
export const isBreaker2 = (skin) => skin === BREAKER2_SKIN;

export const breaker2RotationKey = (dir) => `${BREAKER2_SPRITE_KEY}.rot.${dir}`;
export const breaker2WalkFrameKey = (dir, i) => `${BREAKER2_SPRITE_KEY}.walk.${dir}.${i}`;
export const breaker2WalkAnimKey = (dir) => `${BREAKER2_SPRITE_KEY}.walk.${dir}`;
export const breaker2AttackFrameKey = (dir, i) => `${BREAKER2_SPRITE_KEY}.attack.${dir}.${i}`;
export const breaker2AttackAnimKey = (dir) => `${BREAKER2_SPRITE_KEY}.attack.${dir}`;
export const breaker2HitFrameKey = (dir, i) => `${BREAKER2_SPRITE_KEY}.hit.${dir}.${i}`;
export const breaker2HitAnimKey = (dir) => `${BREAKER2_SPRITE_KEY}.hit.${dir}`;
export const breaker2DeathFrameKey = (dir, i) => `${BREAKER2_SPRITE_KEY}.death.${dir}.${i}`;
export const breaker2DeathAnimKey = (dir) => `${BREAKER2_SPRITE_KEY}.death.${dir}`;

export const breaker2RotationPath = (dir) => `${BREAKER2_DIR}/Walking/rotations/${dir}.png`;
export const breaker2WalkFramePath = (dir, i) => `${BREAKER2_DIR}/${BREAKER2_WALK_FOLDER}/${dir}/frame_${pad(i)}.png`;
export const breaker2AttackFramePath = (dir, i) => `${BREAKER2_DIR}/${BREAKER2_ATTACK_FOLDER}/${dir}/frame_${pad(i)}.png`;
export const breaker2HitFramePath = (dir, i) => `${BREAKER2_DIR}/${BREAKER2_HIT_FOLDER}/${dir}/frame_${pad(i)}.png`;
export const breaker2DeathFramePath = (dir, i) => `${BREAKER2_DIR}/${BREAKER2_DEATH_FOLDER}/${dir}/frame_${pad(i)}.png`;
export const breaker2DeathTimeScale = () => (BREAKER2_DEATH_FRAMES * 1000 / BREAKER2_DEATH_DEFAULT_FPS) / BREAKER2_DEATH_MS;

/** Same contract as breakerPose (breakerData.js), with Type 2 keys. Strikes, hits and falls are horizontal: east or west by facing. */
export function breaker2Pose(e) {
  const face = e.facing < 0 ? 'west' : 'east';
  if (e.state === 'attack') return { anim: breaker2AttackAnimKey(face), dir: face, once: true };
  if (e.state === 'hitstun') return { anim: breaker2HitAnimKey('east'), dir: face, once: true, hit: true, flipX: face === 'west', frames: BREAKER2_HIT_FRAMES, rotation: breaker2RotationKey(face) };
  if (e.state === 'dead') return { anim: breaker2DeathAnimKey(face), dir: face, once: true, death: true, rotation: breaker2RotationKey(face), deathTimeScale: breaker2DeathTimeScale() };
  const dir = e.state === 'telegraph' ? null : directionFromVelocity(e.vx || 0, e.vy || 0);
  if (dir) return { anim: breaker2WalkAnimKey(dir), dir };
  return { rotation: breaker2RotationKey(face), dir: face };
}
