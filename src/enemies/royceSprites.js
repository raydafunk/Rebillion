// "Railgun" Royce sprite data (Level 2 mini-boss, wave 5). No Phaser. Art lives in assets/sprites/Railgun Royce/ (PixelLab export):
//   <folder>/rotations/<dir>.png and <folder>/animations/<anim>/<dir>/frame_000.png...
// He is a RoyceBoss (RoyceBoss.js); the clips map onto his states and moves:
//   idle   : standing / recovering            walk : approaching (follows the movement direction)
//   attack : Baton_Combo_state     dash : Charging_Dash_stat    slam : Shockwave_Slam
//   trap   : Rail_Trap_electrifi   taser : Taser_Burst          block : block (BLOCK state, then holds the last frame)
//   hit    : taking_a_punch (parry / guard-break stun only)     death : falling_backwords
// Move clips are one-shots fitted to wind-up + strike (dash: wind-up + a stretch of running).
import { DIRECTIONS, directionFromVelocity } from './breakerData.js';
import { ROYCE_ID, ROYCE_BLOCK } from './royceData.js';
const ROYCE_BLOCK_CLIP_MS = ROYCE_BLOCK.clipMs;

export const ROYCE_DIR = 'assets/sprites/Railgun Royce';
export const ROYCE_TEX = 'rust.railgun-royce';
export const ROYCE_ALL_DIRS = DIRECTIONS;
const SIDES = Object.freeze(['east', 'west']);
const MOVE_DIRS = Object.freeze(['east', 'north', 'south', 'west', 'south-east']);          // Idle art
const WALK_DIRS = Object.freeze(['east', 'north', 'south', 'west', 'north-east', 'south-east']); // Walking art (no north-west / south-west)

export const ROYCE_ANIMS = Object.freeze({
  idle:   { folder: 'Idle', anim: 'Idle', frames: 8, fps: 6, loop: true, dirs: MOVE_DIRS, load: true },
  walk:   { folder: 'Walking', anim: 'The_character_performs_a_brisk_energetic_walk_with', frames: 9, fps: 10, loop: true, dirs: WALK_DIRS, load: true },
  attack: { folder: 'Baton_Combo_state', anim: 'The_character_executes_a_four-hit_baton_combo_begi', frames: 7, dirs: SIDES, load: true },
  hit:    { folder: 'taking_a_punch', anim: 'Taking_Punch', frames: 6, dirs: SIDES, load: true },
  death:  { folder: 'falling_backwords', anim: 'Falling_Back_Death', frames: 7, dirs: SIDES, load: true },
  dash:   { folder: 'Charging_Dash_stat', anim: 'The_character_assumes_a_low_aggressive_stance_righ', frames: 9, dirs: SIDES, load: true },
  slam:   { folder: 'Shockwave_Slam', anim: 'The_character_raises_both_hands_high_above_the_hea', frames: 9, dirs: SIDES, load: true },
  trap:   { folder: 'Rail_Trap_electrifi', anim: 'The_character_stands_firm_as_vibrant_cyan_electric', frames: 9, dirs: SIDES, load: true },
  taser:  { folder: 'Taser_Burst', anim: 'The_right_hand_draws_back_to_the_hip_then_thrusts', frames: 9, dirs: SIDES, load: true },
  block:  { folder: 'block', anim: 'The_character_pulls_both_arms_inward_to_cover_the', frames: 7, dirs: SIDES, load: true },
});

export const ROYCE_ACTION_FPS = 30;   // default rate of one-shot clips; each play sets timeScale to fit its move
export const ROYCE_DEATH_MS = 700;
export const isRoyce = (skin) => skin === ROYCE_ID;

const frameName = (i) => `frame_${String(i).padStart(3, '0')}.png`;
export const royceRotationKey = (dir) => `${ROYCE_TEX}.rot.${dir}`;
export const royceRotationPath = (dir) => `${ROYCE_DIR}/Idle/rotations/${dir}.png`;
export const royceFrameKey = (name, dir, i) => `${ROYCE_TEX}.${name}.${dir}.${i}`;
export const royceAnimKey = (name, dir) => `${ROYCE_TEX}.${name}.${dir}`;
export const royceFramePath = (name, dir, i) => {
  const a = ROYCE_ANIMS[name];
  return `${ROYCE_DIR}/${a.folder}/animations/${a.anim}/${dir}/${frameName(i)}`;
};

/** Every image to load: [{ key, path }]. */
export function royceAssets() {
  const out = ROYCE_ALL_DIRS.map((d) => ({ key: royceRotationKey(d), path: royceRotationPath(d) }));
  for (const [name, a] of Object.entries(ROYCE_ANIMS)) {
    if (!a.load) continue;
    for (const d of a.dirs) for (let i = 0; i < a.frames; i++) out.push({ key: royceFrameKey(name, d, i), path: royceFramePath(name, d, i) });
  }
  return out;
}

/** Every animation to register: [{ key, frames: [textureKey], frameRate, repeat }]. */
export function royceAnimDefs() {
  const out = [];
  for (const [name, a] of Object.entries(ROYCE_ANIMS)) {
    if (!a.load) continue;
    for (const d of a.dirs) {
      out.push({
        key: royceAnimKey(name, d), repeat: a.loop ? -1 : 0, frameRate: a.loop ? a.fps : ROYCE_ACTION_FPS,
        frames: Array.from({ length: a.frames }, (_, i) => royceFrameKey(name, d, i)),
      });
    }
  }
  return out;
}

/** timeScale that fits an action clip of `name` into `ms`. */
export const royceFitScale = (name, ms) => (ROYCE_ANIMS[name].frames * 1000 / ROYCE_ACTION_FPS) / Math.max(1, ms);
export const royceDeathTimeScale = () => royceFitScale('death', ROYCE_DEATH_MS);

/** Walk art has no north-west / south-west: use the nearest side-on clip. */
const walkDir = (dir) => (WALK_DIRS.includes(dir) ? dir : dir.endsWith('west') ? 'west' : 'east');

export const DASH_CLIP_EXTRA_MS = 900;      // the dash clip spans the wind-up plus about this much running
const CLIP_OF = Object.freeze({ combo: 'attack', dash: 'dash', slam: 'slam', trap: 'trap', taser: 'taser' });
/** Length the move's clip is fitted to: wind-up + strike (the dash: wind-up + a stretch of running). */
export const royceMoveMs = (m) => m.telegraphMs + (m.id === 'dash' ? DASH_CLIP_EXTRA_MS : m.attackMs);

/**
 * What to show for a RoyceBoss `g` ({ state, facing, vx, vy, move, moveSeq, blockSeq }). Same contract as duganPose:
 * loop clips (idle, walk) repeat; `move: true` = one-shot fitted to totalMs, restarted when `seq` changes; hit: fitted to the stun; death: one-shot.
 * `rotation` is a still pose to fall back on when a clip is not available.
 */
export function roycePose(g) {
  const face = g.facing < 0 ? 'west' : 'east';
  const rotation = royceRotationKey(face);
  if (g.state === 'dead') return { anim: royceAnimKey('death', face), dir: face, once: true, death: true, rotation, deathTimeScale: royceDeathTimeScale() };
  if (g.state === 'hitstun') return { anim: royceAnimKey('hit', face), dir: face, once: true, hit: true, frames: ROYCE_ANIMS.hit.frames, rotation };
  if (g.state === 'block') return { anim: royceAnimKey('block', face), dir: face, once: true, move: true, seq: `block${g.blockSeq}`, totalMs: ROYCE_BLOCK_CLIP_MS, clip: 'block', rotation };
  if ((g.state === 'telegraph' || g.state === 'attack') && g.move && CLIP_OF[g.move.id]) {
    const clip = CLIP_OF[g.move.id];
    return { anim: royceAnimKey(clip, face), dir: face, once: true, move: true, seq: `mv${g.moveSeq}`, totalMs: royceMoveMs(g.move), clip, rotation };
  }
  const dir = g.state === 'approach' ? directionFromVelocity(g.vx || 0, g.vy || 0) : null;
  if (dir) { const d = walkDir(dir); return { anim: royceAnimKey('walk', d), dir: d, walk: true, rotation }; }
  return { anim: royceAnimKey('idle', face), dir: face, rotation };
}
