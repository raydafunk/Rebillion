// "Overseer Halden Varr" sprite data (Level 8 final boss). No Phaser. Art lives in "assets/sprites/Halden Varr/" (note the space; PixelLab export):
//   <folder>/rotations/<dir>.png and <folder>/animations/<anim>/<dir>/frame_000.png...
// He is a VarrBoss (VarrBoss.js). EVERY state has a phase 1 and a phase 2 look; once g.phase === 2 only the 2nd_Phase_* art is used.
//
//   PHASE 1                                         PHASE 2 (g.phase === 2)
//   idle / hitstun : Idle (loop / rotation)         idle / hitstun : 2nd_Phase idle_breathing (loop / rotation)
//   walk           : Walking (rotation + bob)       walk           : 2nd_Phase_walking
//   strike         : Authority_Strike               slam           : 2nd_Phase_walking_Breaker_Slam
//   shield         : Command_Shield_Walking         taser          : 2nd_Phase_TaserShot
//   override       : Command_Override               combo          : 2nd_Phase_Gauntlet_Combo
//   stance (counter): Adaptive_Counter              control        : Znd_Pharse_Control_Pulse (rotation only: static pose + pulse)
//   transform      : evil_laughter_state (loop)     drones         : 2nd_Phase_Drone_Command
//   death (either phase): death_fall                collapse       : telegraph = Rust_Collapse_Super (rotation only: static pose + pulse),
//                                                                   attack = 2nd_Phase_Jumping (the leap into the blast)
// Folders with no animations (Walking, Znd_Pharse_Control_Pulse, Rust_Collapse_Super) are drawn from their rotation frame; the pose says
// `pulse` (scale throb the scene applies) or `bob` (walk bob) so they still read as moving. death_fall only has an east clip: west uses it mirrored.
import { VARR_ID, VARR } from './varrData.js';

export const VARR_DIR = 'assets/sprites/Halden Varr';
export const VARR_TEX = 'rust.halden-varr';
const SIDES = Object.freeze(['east', 'west']);
const EAST = Object.freeze(['east']);

// Animated clips. `p` = phase the clip belongs to.
export const VARR_ANIMS = Object.freeze({
  idle:     { p: 1, folder: 'Idle', anim: 'idle_breathing', frames: 8, fps: 6, loop: true, dirs: SIDES },
  strike:   { p: 1, folder: 'Authority_Strike', anim: 'The_right_hand_draws_back_to_the_hip_then_thrusts', frames: 9, dirs: SIDES },
  shield:   { p: 1, folder: 'Command_Shield_Walking', anim: 'The_character_braces_their_left_arm_to_manifest_a', frames: 9, dirs: SIDES },
  override: { p: 1, folder: 'Command_Override', anim: 'The_character_pulls_both_arms_inward_toward_the_ch', frames: 9, dirs: SIDES },
  counter:  { p: 1, folder: 'Adaptive_Counter', anim: 'The_character_pulls_their_right_hand_back_to_the_h', frames: 9, dirs: SIDES },
  laugh:    { p: 1, folder: 'evil_laughter_state', anim: 'The_character_erupts_into_a_boisterous_fit_of_evil', frames: 9, fps: 8, loop: true, dirs: SIDES },
  death:    { p: 1, folder: 'death_fall', anim: 'Falling_Back_Death', frames: 7, dirs: EAST },
  idle2:    { p: 2, folder: '2nd_Phase', anim: 'idle_breathing', frames: 8, fps: 7, loop: true, dirs: SIDES },
  walk2:    { p: 2, folder: '2nd_Phase_walking', anim: 'Walking', frames: 8, fps: 11, loop: true, dirs: Object.freeze(['east', 'north', 'west']) },
  slam:     { p: 2, folder: '2nd_Phase_walking_Breaker_Slam', anim: 'The_character_braces_their_core_lifting_the_glowin', frames: 9, dirs: SIDES },
  taser:    { p: 2, folder: '2nd_Phase_TaserShot', anim: 'The_right_hand_draws_back_to_the_shoulder_then_thr', frames: 9, dirs: SIDES },
  combo:    { p: 2, folder: '2nd_Phase_Gauntlet_Combo', anim: 'The_character_performs_a_rapid_three-punch_combo_s', frames: 9, dirs: SIDES },
  drones:   { p: 2, folder: '2nd_Phase_Drone_Command', anim: 'The_character_performs_four_rapid_laser_patterns_i', frames: 9, dirs: EAST },
  jump:     { p: 2, folder: '2nd_Phase_Jumping', anim: 'Two-Footed_Jump', frames: 7, dirs: SIDES },
});

// Still poses (rotation frames). `walk1` is the phase 1 walk (its folder has no animation).
export const VARR_STILLS = Object.freeze({
  idle:     { folder: 'Idle' },
  idle2:    { folder: '2nd_Phase' },
  walk1:    { folder: 'Walking' },
  control:  { folder: 'Znd_Pharse_Control_Pulse' },
  collapse: { folder: 'Rust_Collapse_Super' },
});

export const VARR_ACTION_FPS = 30;    // default rate of one-shot clips; each play sets timeScale to fit its move
export const VARR_DEATH_MS = 1000;
export const isVarr = (skin) => skin === VARR_ID;

const frameName = (i) => `frame_${String(i).padStart(3, '0')}.png`;
export const varrStillKey = (name, dir) => `${VARR_TEX}.still.${name}.${dir}`;
export const varrStillPath = (name, dir) => `${VARR_DIR}/${VARR_STILLS[name].folder}/rotations/${dir}.png`;
/** The idle rotation: what the scene checks for to know his art is loaded, and the first texture of his sprite. */
export const varrRotationKey = (dir) => varrStillKey('idle', dir);
export const varrFrameKey = (name, dir, i) => `${VARR_TEX}.${name}.${dir}.${i}`;
export const varrAnimKey = (name, dir) => `${VARR_TEX}.${name}.${dir}`;
export const varrFramePath = (name, dir, i) => {
  const a = VARR_ANIMS[name];
  return `${VARR_DIR}/${a.folder}/animations/${a.anim}/${dir}/${frameName(i)}`;
};

/** Every image to load: [{ key, path }]. */
export function varrAssets() {
  const out = [];
  for (const n of Object.keys(VARR_STILLS)) for (const d of SIDES) out.push({ key: varrStillKey(n, d), path: varrStillPath(n, d) });
  for (const [name, a] of Object.entries(VARR_ANIMS)) for (const d of a.dirs) for (let i = 0; i < a.frames; i++) out.push({ key: varrFrameKey(name, d, i), path: varrFramePath(name, d, i) });
  return out;
}

/** Every animation to register: [{ key, frames: [textureKey], frameRate, repeat }]. */
export function varrAnimDefs() {
  const out = [];
  for (const [name, a] of Object.entries(VARR_ANIMS)) {
    for (const d of a.dirs) {
      out.push({
        key: varrAnimKey(name, d), repeat: a.loop ? -1 : 0, frameRate: a.loop ? a.fps : VARR_ACTION_FPS,
        frames: Array.from({ length: a.frames }, (_, i) => varrFrameKey(name, d, i)),
      });
    }
  }
  return out;
}

/** timeScale that fits an action clip of `name` into `ms`. */
export const varrFitScale = (name, ms) => (VARR_ANIMS[name].frames * 1000 / VARR_ACTION_FPS) / Math.max(1, ms);
export const varrDeathTimeScale = () => varrFitScale('death', VARR_DEATH_MS);

// move id -> animated clip (null = still pose, see varrPose; collapse: still wind-up, then the jump clip for the blast)
export const VARR_MOVE_CLIPS = Object.freeze({
  strike: 'strike', shield: 'shield', override: 'override',
  slam: 'slam', taser: 'taser', combo: 'combo', drones: 'drones', control: null, collapse: 'jump',
});
export const VARR_COUNTER_MS = 800;   // length of the Adaptive Counter clip when a stance is taken

/** Length the move's clip is fitted to: wind-up + strike. The shield clip is only the raise: it finishes early and the last frame holds the guard. Collapse's leap covers the blast only. */
export const varrMoveMs = (m) => (m.id === 'shield' ? m.telegraphMs + 400 : m.id === 'collapse' ? m.attackMs : m.telegraphMs + m.attackMs);

/** A clip with no west art (Drone Command, death_fall) is drawn from its east clip mirrored: { dir, flipX }. */
const sideOf = (clip, face) => (VARR_ANIMS[clip].dirs.includes(face) ? { dir: face, flipX: false } : { dir: 'east', flipX: face === 'west' });

/**
 * What to show for a VarrBoss `g` ({ state, phase, facing, vx, vy, move, moveSeq, stance, stanceSeq, stanceLeftMs }). Same contract as
 * subject88Pose: loop clips repeat; `move: true` = one-shot fitted to totalMs, restarted when `seq` changes; `still` = static rotation frame
 * (`pulse` / `bob` ask the scene for a scale throb / walk bob); `rotation` is the fallback still when a clip is not available.
 */
export function varrPose(g) {
  const p2 = g.phase === 2;
  const face = g.facing < 0 ? 'west' : 'east';
  const rotation = varrStillKey(p2 ? 'idle2' : 'idle', face);
  if (g.state === 'dead') return { anim: varrAnimKey('death', 'east'), dir: 'east', flipX: face === 'west', once: true, death: true, rotation: varrStillKey('idle', face), deathTimeScale: varrDeathTimeScale() };
  if (g.state === 'transform') return { anim: varrAnimKey('laugh', face), dir: face, transform: true, rotation };
  if (g.state === 'hitstun') return { anim: null, dir: face, stagger: true, still: rotation, rotation };
  if ((g.state === 'telegraph' || g.state === 'attack') && g.move) {
    const id = g.move.id;
    if (id === 'control') return { anim: null, dir: face, still: varrStillKey('control', face), pulse: true, rotation };
    if (id === 'collapse' && g.state === 'telegraph') return { anim: null, dir: face, still: varrStillKey('collapse', face), pulse: true, rotation };
    const clip = VARR_MOVE_CLIPS[id];
    if (clip) {
      const leg = id === 'collapse' ? 'a' : '', sd = sideOf(clip, face);
      return { anim: varrAnimKey(clip, sd.dir), dir: sd.dir, flipX: sd.flipX, once: true, move: true, seq: `mv${g.moveSeq}${leg}`, totalMs: varrMoveMs(g.move), clip, rotation };
    }
  }
  // Adaptive Counter: a stance has just been taken (idle / approach / recover only; moves play their own clip)
  if (!p2 && g.stance && g.stanceSeq > 0 && (g.state === 'idle' || g.state === 'approach' || g.state === 'recover')
    && g.stanceLeftMs > (VARR.counter.stanceMs - VARR_COUNTER_MS)) {
    return { anim: varrAnimKey('counter', face), dir: face, once: true, move: true, seq: `st${g.stanceSeq}`, totalMs: VARR_COUNTER_MS, clip: 'counter', rotation };
  }
  const walking = g.state === 'approach' && ((g.vx || 0) !== 0 || (g.vy || 0) !== 0);
  if (walking) {
    if (p2) {
      const d = (g.vx || 0) === 0 && (g.vy || 0) < 0 ? 'north' : face;   // north art exists for straight-up walks; everything else keeps facing Zed
      return { anim: varrAnimKey('walk2', d), dir: d, walk: true, rotation };
    }
    return { anim: null, dir: face, walk: true, bob: true, still: varrStillKey('walk1', face), rotation };   // phase 1 walk has no clip: rotation + bob
  }
  return { anim: varrAnimKey(p2 ? 'idle2' : 'idle', face), dir: face, rotation };
}
