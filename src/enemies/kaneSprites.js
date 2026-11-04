// "Crusher" Kane sprite data (Level 3 mini-boss, wave 5). No Phaser. Art lives in assets/sprites/Crusher Kane/ (PixelLab export):
//   <folder>/rotations/<dir>.png and <folder>/animations/<anim>/<dir>/frame_000.png...
// He is a KaneBoss (KaneBoss.js); the clips map onto his states and moves:
//   idle   : standing / recovering           walk  : approaching (follows the movement direction; art has no diagonals)
//   slam   : Hammer_Slam (Hammer Slam, and also Crushing Uppercut: there is no uppercut art yet, so it borrows the hammer clip)
//   hook   : Hook_Chain_Grab_st              kick  : Furnace_Kick_state          vent : Steam_Vent_Burst
//   hit    : taking_a_punch (parry stun only)                                    death : falling_to_death_sta
// Move clips are one-shots fitted to wind-up + strike.
import { DIRECTIONS, directionFromVelocity } from './breakerData.js';
import { KANE_ID, KANE_MOVES } from './kaneData.js';

export const KANE_DIR = 'assets/sprites/Crusher Kane';
export const KANE_TEX = 'rust.crusher-kane';
export const KANE_ALL_DIRS = DIRECTIONS;
const SIDES = Object.freeze(['east', 'west']);
const FOUR = Object.freeze(['east', 'north', 'south', 'west']);

export const KANE_ANIMS = Object.freeze({
  idle:  { folder: 'Idle', anim: 'idle_breathing', frames: 8, fps: 6, loop: true, dirs: FOUR, load: true },
  walk:  { folder: 'walking_Fast', anim: 'Walking', frames: 6, fps: 8, loop: true, dirs: FOUR, load: true },
  slam:  { folder: 'Hammer_Slam', anim: 'The_heavy_hammer_is_raised_high_over_the_shoulder', frames: 9, dirs: SIDES, load: true },
  hit:   { folder: 'taking_a_punch', anim: 'Taking_Punch', frames: 6, dirs: SIDES, load: true },
  death: { folder: 'falling_to_death_sta', anim: 'Falling_Back_Death', frames: 7, dirs: SIDES, load: true },
  hook:  { folder: 'Hook_Chain_Grab_st', anim: 'The_character_pulls_their_right_hand_back_to_the_h', frames: 9, dirs: SIDES, load: true },
  kick:  { folder: 'Furnace_Kick_state', anim: 'The_character_performs_a_forceful_furnace_kick._Th', frames: 9, dirs: SIDES, load: true },
  vent:  { folder: 'Steam_Vent_Burst', anim: 'The_character_plants_their_feet_firmly_while_chann', frames: 9, dirs: SIDES, load: true },
});

export const KANE_ACTION_FPS = 30;   // default rate of one-shot clips; each play sets timeScale to fit
export const KANE_DEATH_MS = 700;
export const isKane = (skin) => skin === KANE_ID;

const frameName = (i) => `frame_${String(i).padStart(3, '0')}.png`;
export const kaneRotationKey = (dir) => `${KANE_TEX}.rot.${dir}`;
export const kaneRotationPath = (dir) => `${KANE_DIR}/Idle/rotations/${dir}.png`;
export const kaneFrameKey = (name, dir, i) => `${KANE_TEX}.${name}.${dir}.${i}`;
export const kaneAnimKey = (name, dir) => `${KANE_TEX}.${name}.${dir}`;
export const kaneFramePath = (name, dir, i) => {
  const a = KANE_ANIMS[name];
  return `${KANE_DIR}/${a.folder}/animations/${a.anim}/${dir}/${frameName(i)}`;
};

/** Every image to load: [{ key, path }]. */
export function kaneAssets() {
  const out = KANE_ALL_DIRS.map((d) => ({ key: kaneRotationKey(d), path: kaneRotationPath(d) }));
  for (const [name, a] of Object.entries(KANE_ANIMS)) {
    if (!a.load) continue;
    for (const d of a.dirs) for (let i = 0; i < a.frames; i++) out.push({ key: kaneFrameKey(name, d, i), path: kaneFramePath(name, d, i) });
  }
  return out;
}

/** Every animation to register: [{ key, frames: [textureKey], frameRate, repeat }]. */
export function kaneAnimDefs() {
  const out = [];
  for (const [name, a] of Object.entries(KANE_ANIMS)) {
    if (!a.load) continue;
    for (const d of a.dirs) {
      out.push({
        key: kaneAnimKey(name, d), repeat: a.loop ? -1 : 0, frameRate: a.loop ? a.fps : KANE_ACTION_FPS,
        frames: Array.from({ length: a.frames }, (_, i) => kaneFrameKey(name, d, i)),
      });
    }
  }
  return out;
}

/** timeScale that fits an action clip of `name` into `ms`. */
export const kaneFitScale = (name, ms) => (KANE_ANIMS[name].frames * 1000 / KANE_ACTION_FPS) / Math.max(1, ms);
export const kaneDeathTimeScale = () => kaneFitScale('death', KANE_DEATH_MS);
/** Each move's clip spans its wind-up plus its strike. */
export const kaneMoveMs = (m) => m.telegraphMs + m.attackMs;
export const KANE_SLAM_MS = kaneMoveMs(KANE_MOVES.hammer);
const CLIP_OF = Object.freeze({ hammer: 'slam', hook: 'hook', kick: 'kick', vent: 'vent', uppercut: 'slam' });

/** Walk and idle art have no diagonals: use the nearest clip (north/south kept, the rest go to a side). */
const moveDir = (dir, facing) => (FOUR.includes(dir) ? dir : dir.endsWith('west') ? 'west' : dir.endsWith('east') ? 'east' : facing < 0 ? 'west' : 'east');

/**
 * What to show for Kane `g` ({ state, facing, vx, vy, move, moveSeq }; a KaneBoss). Same contract as roycePose: loop clips repeat;
 * `move: true` = a one-shot fitted to totalMs and restarted when `seq` changes; hit is fitted to the stun; death is a one-shot.
 */
export function kanePose(g) {
  const face = g.facing < 0 ? 'west' : 'east';
  const rotation = kaneRotationKey(face);
  if (g.state === 'dead') return { anim: kaneAnimKey('death', face), dir: face, once: true, death: true, rotation, deathTimeScale: kaneDeathTimeScale() };
  if (g.state === 'hitstun') return { anim: kaneAnimKey('hit', face), dir: face, once: true, hit: true, frames: KANE_ANIMS.hit.frames, rotation };
  if ((g.state === 'telegraph' || g.state === 'attack') && g.move && CLIP_OF[g.move.id]) {
    const clip = CLIP_OF[g.move.id];
    return { anim: kaneAnimKey(clip, face), dir: face, once: true, move: true, seq: `mv${g.moveSeq}`, totalMs: kaneMoveMs(g.move), clip, rotation };
  }
  const dir = g.state === 'approach' ? directionFromVelocity(g.vx || 0, g.vy || 0) : null;
  if (dir) { const d = moveDir(dir, g.facing); return { anim: kaneAnimKey('walk', d), dir: d, walk: true, rotation }; }
  return { anim: kaneAnimKey('idle', face), dir: face, rotation };
}
