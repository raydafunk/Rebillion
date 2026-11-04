// Rust Ranger sprite data. No Phaser. Art lives in assets/sprites/Rust Rangers — “The Watchers/ (8 directions each):
//   Idle/rotations/<dir>.png (48px), Idle/animations/idle_breathing (8 frames, 68px), Shield_Strike (9 frames, 68px),
//   stun_taking_a_hit/Taking_Punch (6 frames, 80px), falling_backward_aft (9 frames, 68px). walking/animations/walking (8 frames, 68px)
//   has only east, north and west; the other five directions reuse those (see rangerWalkDir).
// Used for every enemy whose skin is 'rust-ranger' (Level 3 wave 2, Level 4 Ranger waves). Gameplay is the grunt's; the kind in
// enemyKinds.js adds the health and speed. Same contract as breakerType2Data.js.
import { DIRECTIONS, directionFromVelocity } from './breakerData.js';

export const RANGER_SKIN = 'rust-ranger';
export const RANGER_SPRITE_KEY = 'rust.ranger';
export const RANGER_DIR = 'assets/sprites/Rust Rangers — “The Watchers';
export const RANGER_DIRS = DIRECTIONS;
export const RANGER_WALK_FRAMES = 8;
export const RANGER_WALK_FPS = 10;
export const RANGER_ATTACK_FRAMES = 9;
export const RANGER_ATTACK_MS = 570;
export const RANGER_HIT_FRAMES = 6;
export const RANGER_DEATH_FRAMES = 9;
export const RANGER_DEATH_DEFAULT_FPS = 30;
export const RANGER_DEATH_MS = 700;
export const RANGER_WALK_FOLDER = 'walking/animations/walking';
export const RANGER_WALK_DIRS = Object.freeze(['east', 'north', 'west']); // the only walk directions with art
export const RANGER_ATTACK_FOLDER = 'Shield_Strike/animations/The_character_pulls_the_shield_arm_back_tightly_ag';
export const RANGER_HIT_FOLDER = 'stun_taking_a_hit/animations/Taking_Punch';
export const RANGER_DEATH_FOLDER = 'falling_backward_aft/animations/The_character_recoils_violently_backward_as_if_str';

const pad = (i) => String(i).padStart(3, '0');
// Watchers share the Ranger art (one sprite set, "Rust Rangers — The Watchers"); they keep their own stats in enemyKinds.js.
export const RANGER_ART_SKINS = Object.freeze([RANGER_SKIN, 'rust-watcher']);
export const isRanger = (skin) => RANGER_ART_SKINS.includes(skin);

export const rangerRotationKey = (dir) => `${RANGER_SPRITE_KEY}.rot.${dir}`;
/** Map any of the 8 move directions onto a walk direction that has art. South has none, so it follows the facing. */
export const rangerWalkDir = (dir, face = 'east') => {
  if (dir === 'north') return 'north';
  if (dir === 'south') return face;
  return dir.includes('west') ? 'west' : 'east';
};
export const rangerWalkFrameKey = (dir, i) => `${RANGER_SPRITE_KEY}.walk.${dir}.${i}`;
export const rangerWalkAnimKey = (dir) => `${RANGER_SPRITE_KEY}.walk.${dir}`;
export const rangerAttackFrameKey = (dir, i) => `${RANGER_SPRITE_KEY}.attack.${dir}.${i}`;
export const rangerAttackAnimKey = (dir) => `${RANGER_SPRITE_KEY}.attack.${dir}`;
export const rangerHitFrameKey = (dir, i) => `${RANGER_SPRITE_KEY}.hit.${dir}.${i}`;
export const rangerHitAnimKey = (dir) => `${RANGER_SPRITE_KEY}.hit.${dir}`;
export const rangerDeathFrameKey = (dir, i) => `${RANGER_SPRITE_KEY}.death.${dir}.${i}`;
export const rangerDeathAnimKey = (dir) => `${RANGER_SPRITE_KEY}.death.${dir}`;

export const rangerRotationPath = (dir) => `${RANGER_DIR}/Idle/rotations/${dir}.png`;
export const rangerWalkFramePath = (dir, i) => `${RANGER_DIR}/${RANGER_WALK_FOLDER}/${dir}/frame_${pad(i)}.png`;
export const rangerAttackFramePath = (dir, i) => `${RANGER_DIR}/${RANGER_ATTACK_FOLDER}/${dir}/frame_${pad(i)}.png`;
export const rangerHitFramePath = (dir, i) => `${RANGER_DIR}/${RANGER_HIT_FOLDER}/${dir}/frame_${pad(i)}.png`;
export const rangerDeathFramePath = (dir, i) => `${RANGER_DIR}/${RANGER_DEATH_FOLDER}/${dir}/frame_${pad(i)}.png`;
export const rangerDeathTimeScale = () => (RANGER_DEATH_FRAMES * 1000 / RANGER_DEATH_DEFAULT_FPS) / RANGER_DEATH_MS;

/** Same contract as breaker2Pose (breakerType2Data.js), with Ranger keys. Strikes, hits and falls are horizontal: east or west by facing; all have real west frames. */
export function rangerPose(e) {
  const face = e.facing < 0 ? 'west' : 'east';
  if (e.state === 'attack') return { anim: rangerAttackAnimKey(face), dir: face, once: true };
  if (e.state === 'hitstun') return { anim: rangerHitAnimKey(face), dir: face, once: true, hit: true, frames: RANGER_HIT_FRAMES, rotation: rangerRotationKey(face) };
  if (e.state === 'dead') return { anim: rangerDeathAnimKey('east'), dir: face, once: true, death: true, rangerFall: true, flipX: face === 'west', rotation: rangerRotationKey(face), deathTimeScale: rangerDeathTimeScale() };
  const dir = e.state === 'telegraph' ? null : directionFromVelocity(e.vx || 0, e.vy || 0);
  if (dir) return { anim: rangerWalkAnimKey(rangerWalkDir(dir, face)), dir };
  return { rotation: rangerRotationKey(face), dir: face };
}

// Death fall. The set's "falling_backward" clip is a recoil-and-flip: east frames 0-4 knock him back into a horizontal curl, frames 5-8 flip him
// upright again and the west clip ends standing, so neither ever lies on the ground (he floated). We play the east frames 0-4 only (mirrored for a
// west-facing Ranger), throw him up in an arc, and land frame 4 flat on the floor with a small bounce. Pure maths, no Phaser.
export const RANGER_FALL_FRAMES = 5;           // east death frames 0-4: knock-back into a horizontal curl
export const RANGER_FALL_MS = 520;             // knock-back, arc and landing; the corpse then holds (deathViewPhase) and fades
export const RANGER_FALL_HOP_PX = 12;          // peak height of the knock-back arc, in 68px source pixels
export const RANGER_BOUNCE_MS = 170;           // landing bounce after impact
export const RANGER_BOUNCE_PX = 3;
export const RANGER_FRAME_PX = 68;
/** Lowest opaque pixel row + 1 (source px) of east death frames 0-4: the foot line the sprite is seated on, so the lowest pixel always meets the ground. */
export const RANGER_FALL_BOTTOM = Object.freeze([56, 56, 54, 53, 49]);
/** { frame, bottom, lift, landed, flipX } for t ms after the fall starts. lift = source px the lowest pixel sits above the floor (0 = lying on it). */
export function rangerFallState(t, face = 'east') {
  const u = Math.min(1, Math.max(0, t / RANGER_FALL_MS));
  const frame = Math.min(RANGER_FALL_FRAMES - 1, Math.floor(u * RANGER_FALL_FRAMES));
  let lift = RANGER_FALL_HOP_PX * 4 * u * (1 - u); // ballistic arc, back on the floor at u = 1
  if (t >= RANGER_FALL_MS) {
    const b = (t - RANGER_FALL_MS) / RANGER_BOUNCE_MS;
    lift = b < 1 ? RANGER_BOUNCE_PX * 4 * b * (1 - b) : 0;
  }
  return { frame, bottom: RANGER_FALL_BOTTOM[frame], lift, landed: t >= RANGER_FALL_MS, flipX: face === 'west' };
}
