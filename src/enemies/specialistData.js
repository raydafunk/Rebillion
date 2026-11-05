// Rust Specialist ("The Copper Fangs") sprite data. No Phaser. Art lives in assets/sprites/Rust Specialists — “The Copper Fangs/ (PixelLab export):
//   Taser_Shot/Taser_Shot/animations (9 frames, 68px): east, north, south, west; plays on the heavy finisher attack (see isTaserAttack).
//   Idle/rotations, Baton_Strike/rotations (wind-up), Taser_Shot/rotations (melee strike): 8 directions each, 48px, single poses (no frame strips).
//   Walking/Walking/animations/Walking (8 frames, 68px): east, north, south, west (note the nested Walking/Walking folder); diagonals reuse east/west.
//   stun_when_getting_hi/animations/Taking_Punch (6 frames, 80px): east, north-east, south-east, south only; west reuses east mirrored.
//   death_falling_down/animations/Falling_Back_Death (7 frames, 80px): all 8 directions.
// Used for every enemy whose skin is 'rust-specialist' (Level 4 waves 1 and 3). Gameplay is the grunt's; the kind in enemyKinds.js adds health and speed.
// Same contract as rangerData.js: *Pose(e) returns what the arena should show for one enemy.
import { DIRECTIONS, directionFromVelocity } from './breakerData.js';
import { isRangedAttack } from './specialistRanged.js';

export const SPECIALIST_SKIN = 'rust-specialist';
export const SPECIALIST_SPRITE_KEY = 'rust.copper-fang';
export const SPECIALIST_DIR = 'assets/sprites/Rust Specialists — “The Copper Fangs';
export const SPECIALIST_DIRS = DIRECTIONS;
export const SPECIALIST_HIT_FRAMES = 6;
export const SPECIALIST_HIT_DIRS = Object.freeze(['east']); // west is east mirrored
export const SPECIALIST_DEATH_FRAMES = 7;
export const SPECIALIST_DEATH_DEFAULT_FPS = 30;
export const SPECIALIST_DEATH_MS = 700;
export const SPECIALIST_HIT_FOLDER = 'stun_when_getting_hi/animations/Taking_Punch';
export const SPECIALIST_DEATH_FOLDER = 'death_falling_down/animations/Falling_Back_Death';
export const SPECIALIST_WALK_FRAMES = 8;
export const SPECIALIST_WALK_FPS = 10;
export const SPECIALIST_WALK_FOLDER = 'Walking/Walking/animations/Walking';
export const SPECIALIST_BATON_FRAMES = 9;
export const SPECIALIST_BATON_FPS = 24; // 9 frames / 24 fps = 375 ms, just inside the grunt's attackMs (240 + 150 = 390 ms); the last frame holds the rest
export const SPECIALIST_BATON_FOLDER = 'Baton_Strike/Baton_Strike/animations/The_character_performs_a_rapid_two-hit_baton_strik';
export const SPECIALIST_BATON_DIRS = Object.freeze(['east', 'north', 'west']); // the baton directions with art (no south)
export const SPECIALIST_TASER_FRAMES = 9;
export const SPECIALIST_TASER_FPS = 24; // 9 frames / 24 fps = 375 ms, inside every attack variant's length (390 ms plain, longer for the finisher); the last frame holds
export const SPECIALIST_TASER_FOLDER = 'Taser_Shot/Taser_Shot/animations/The_character_pulls_the_right_hand_back_to_the_hip';
export const SPECIALIST_TASER_DIRS = Object.freeze(['east', 'north', 'south', 'west']); // the taser directions with art
export const SPECIALIST_WALK_DIRS = Object.freeze(['east', 'north', 'south', 'west']); // the walk directions with art

export const SPECIALIST_RANGED_FRAMES = 9;
export const SPECIALIST_RANGED_FPS = 24; // matches RANGED_FPS in specialistRanged.js: frame 4 is the rifle level, where the bolt leaves
export const SPECIALIST_RANGED_FOLDER = 'A_ranged_state/animations/The_unit_brings_both_hands_together_at_the_chest_t';
export const SPECIALIST_RANGED_DIRS = Object.freeze(['east', 'north', 'south', 'west']);
export const SPECIALIST_BOLT_FRAMES = 9;
export const SPECIALIST_BOLT_FPS = 24;
export const SPECIALIST_BOLT_FOLDER = 'projectile_state/animations/The_projectile_pulls_back_slightly_as_its_tether_c';
export const SPECIALIST_BOLT_DIRS = Object.freeze(['east', 'north', 'west']); // the dart flies along the lane: east or west

const pad = (i) => String(i).padStart(3, '0');
export const isSpecialist = (skin) => skin === SPECIALIST_SKIN;

export const specialistIdleKey = (dir) => `${SPECIALIST_SPRITE_KEY}.idle.${dir}`;
/** Map any of the 8 move directions onto a walk direction that has art: north and south as drawn, every other direction east or west by its horizontal part. */
export const specialistWalkDir = (dir) => (dir === 'north' || dir === 'south' ? dir : dir.includes('west') ? 'west' : 'east');
export const specialistWalkFrameKey = (dir, i) => `${SPECIALIST_SPRITE_KEY}.walk.${dir}.${i}`;
export const specialistWalkAnimKey = (dir) => `${SPECIALIST_SPRITE_KEY}.walk.${dir}`;
export const specialistStrikeKey = (dir) => `${SPECIALIST_SPRITE_KEY}.strike.${dir}`;
export const specialistWindupKey = (dir) => `${SPECIALIST_SPRITE_KEY}.windup.${dir}`;
/** Any of the 8 directions onto a baton direction with art: north as drawn, everything else east or west by its horizontal part (south has no art). */
export const specialistBatonDir = (dir) => (dir === 'north' ? 'north' : dir.includes('west') ? 'west' : 'east');
export const specialistBatonFrameKey = (dir, i) => `${SPECIALIST_SPRITE_KEY}.baton.${dir}.${i}`;
export const specialistBatonAnimKey = (dir) => `${SPECIALIST_SPRITE_KEY}.baton.${dir}`;
/** Any of the 8 directions onto a taser direction with art: north and south as drawn, everything else east or west by its horizontal part. */
export const specialistTaserDir = (dir) => (dir === 'north' || dir === 'south' ? dir : dir.includes('west') ? 'west' : 'east');
export const specialistTaserFrameKey = (dir, i) => `${SPECIALIST_SPRITE_KEY}.taser.${dir}.${i}`;
export const specialistTaserAnimKey = (dir) => `${SPECIALIST_SPRITE_KEY}.taser.${dir}`;
/** Heavy attack variants (the parry-worthy finisher, with or without the hold) fire the Taser Shot; the light strings swing the baton. */
export const isTaserAttack = (e) => e.variant?.kind === 'finisher';
export const specialistRangedDir = (dir) => (dir === 'north' || dir === 'south' ? dir : dir.includes('west') ? 'west' : 'east');
export const specialistRangedFrameKey = (dir, i) => `${SPECIALIST_SPRITE_KEY}.ranged.${dir}.${i}`;
export const specialistRangedAnimKey = (dir) => `${SPECIALIST_SPRITE_KEY}.ranged.${dir}`;       // the shot: holds the aim for the release, then the kick back
export const specialistRangedAimKey = (dir) => `${SPECIALIST_SPRITE_KEY}.ranged-aim.${dir}`;     // telegraph: the rifle comes up and holds level
/** Frame order of the shot clip: hold the aimed frame 3 until the bolt leaves (frame 4 lands RANGED_RELEASE_MS into the attack), then the recoil frames. */
export const SPECIALIST_RANGED_FIRE_ORDER = Object.freeze([3, 3, 3, 3, 4, 5, 6, 7, 8]);
export const SPECIALIST_RANGED_AIM_FRAMES = 4;
export const specialistBoltFrameKey = (dir, i) => `${SPECIALIST_SPRITE_KEY}.bolt.${dir}.${i}`;
export const specialistBoltAnimKey = (dir) => `${SPECIALIST_SPRITE_KEY}.bolt.${dir}`;
export const specialistHitFrameKey = (dir, i) => `${SPECIALIST_SPRITE_KEY}.hit.${dir}.${i}`;
export const specialistHitAnimKey = (dir) => `${SPECIALIST_SPRITE_KEY}.hit.${dir}`;
export const specialistDeathFrameKey = (dir, i) => `${SPECIALIST_SPRITE_KEY}.death.${dir}.${i}`;
export const specialistDeathAnimKey = (dir) => `${SPECIALIST_SPRITE_KEY}.death.${dir}`;

export const specialistIdlePath = (dir) => `${SPECIALIST_DIR}/Idle/rotations/${dir}.png`;
export const specialistWalkFramePath = (dir, i) => `${SPECIALIST_DIR}/${SPECIALIST_WALK_FOLDER}/${dir}/frame_${pad(i)}.png`;
export const specialistStrikePath = (dir) => `${SPECIALIST_DIR}/Taser_Shot/rotations/${dir}.png`; // the melee jab: Taser_Shot pose, with the shock effect on Zed
export const specialistWindupPath = (dir) => `${SPECIALIST_DIR}/Baton_Strike/rotations/${dir}.png`; // wind-up pose before the jab
export const specialistBatonFramePath = (dir, i) => `${SPECIALIST_DIR}/${SPECIALIST_BATON_FOLDER}/${dir}/frame_${pad(i)}.png`;
export const specialistTaserFramePath = (dir, i) => `${SPECIALIST_DIR}/${SPECIALIST_TASER_FOLDER}/${dir}/frame_${pad(i)}.png`;
export const specialistRangedFramePath = (dir, i) => `${SPECIALIST_DIR}/${SPECIALIST_RANGED_FOLDER}/${dir}/frame_${pad(i)}.png`;
export const specialistBoltFramePath = (dir, i) => `${SPECIALIST_DIR}/${SPECIALIST_BOLT_FOLDER}/${dir}/frame_${pad(i)}.png`;
export const specialistHitFramePath = (dir, i) => `${SPECIALIST_DIR}/${SPECIALIST_HIT_FOLDER}/${dir}/frame_${pad(i)}.png`;
export const specialistDeathFramePath = (dir, i) => `${SPECIALIST_DIR}/${SPECIALIST_DEATH_FOLDER}/${dir}/frame_${pad(i)}.png`;
export const specialistDeathTimeScale = () => (SPECIALIST_DEATH_FRAMES * 1000 / SPECIALIST_DEATH_DEFAULT_FPS) / SPECIALIST_DEATH_MS;

/** Same contract as rangerPose. Strikes, hits and falls are horizontal: east or west by facing. */
export function specialistPose(e) {
  const face = e.facing < 0 ? 'west' : 'east';
  // Attack plays the two-hit baton animation (the renderer restarts it each time the attack state is entered; RustGrunt.attackCounter bumps per hit, so it is not a per-attack id); rotation is the Taser_Shot pose, the fallback when the frames are not loaded.
  // Ranged volley: the rifle-raise clip (A_ranged_state); the bolt itself is drawn by SpecialistBoltFx.
  if (e.state === 'telegraph' && isRangedAttack(e)) return { anim: specialistRangedAimKey(specialistRangedDir(face)), dir: face, once: true, strike: true, frames: SPECIALIST_RANGED_AIM_FRAMES, rotation: specialistWindupKey(face) };
  if (e.state === 'attack' && isRangedAttack(e)) return { anim: specialistRangedAnimKey(specialistRangedDir(face)), dir: face, once: true, strike: true, frames: SPECIALIST_RANGED_FRAMES, rotation: specialistWindupKey(face) };
  if (e.state === 'attack' && isTaserAttack(e)) return { anim: specialistTaserAnimKey(specialistTaserDir(face)), dir: face, once: true, strike: true, frames: SPECIALIST_TASER_FRAMES, rotation: specialistStrikeKey(face) };
  if (e.state === 'attack') return { anim: specialistBatonAnimKey(specialistBatonDir(face)), dir: face, once: true, strike: true, frames: SPECIALIST_BATON_FRAMES, rotation: specialistStrikeKey(face) };
  if (e.state === 'hitstun') return { anim: specialistHitAnimKey('east'), dir: face, once: true, hit: true, flipX: face === 'west', frames: SPECIALIST_HIT_FRAMES, rotation: specialistIdleKey(face) };
  if (e.state === 'dead') return { anim: specialistDeathAnimKey(face), dir: face, once: true, death: true, rotation: specialistIdleKey(face), deathTimeScale: specialistDeathTimeScale() };
  if (e.state === 'telegraph') return { rotation: specialistWindupKey(face), dir: face };
  const dir = e.state === 'telegraph' ? null : directionFromVelocity(e.vx || 0, e.vy || 0);
  if (dir) return { anim: specialistWalkAnimKey(specialistWalkDir(dir)), dir, walk: true };
  return { rotation: specialistIdleKey(face), dir: face };
}
