// "Brick" Dugan sprite data. No Phaser. Art lives in assets/sprites/BrickDugan/ (64x64 PNGs, Idle is 56x56):
//   <folder>/rotations/<dir>.png and <folder>/animations/<anim>/<dirFolder>/frame_000.png...
// Walk and Idle have all 8 directions (walk follows the movement direction). Every action is drawn for east and west only
// (a side-on brawler: he faces Zed), so those load two directions. PixelLab left a hash on a few folder names; they are pinned here.
//
// Which clip plays for which move (one table, swap here if a clip should go elsewhere):
//   idle   : standing, planted in reach, recovering         walk   : approaching
//   punch  : Fighting (right hand pulled back)               stomp  : Ground_Stomp (powerful leap)
//   charge : running_then_grab (sprint leaning in)           grab   : Jumping_slam (leap and slam)
//   rage   : Rage_Punch (glowing orange fist)                recoil : jumping_backwards_in (hop back; after a wall crash)
//   block  : Blocking (arms pulled in; BLOCK state, then holds the last frame)
//   hit    : when_taking_a_punch (parry stun only)           death  : falling_backwards_de
//   lift   : one_hand_lift_state (the hold of Grab / Wall Slam / a charge catch, drawn as stills by hold progress)
import { DIRECTIONS, directionFromVelocity } from './breakerData.js';
import { DUGAN_BLOCK } from './duganData.js';

export const DUGAN_DIR = 'assets/sprites/BrickDugan';
export const DUGAN_TEX = 'rust.brick-dugan';
export const ALL_DIRS = DIRECTIONS;
export const SIDES = Object.freeze(['east', 'west']);
const PLAIN = Object.freeze({ east: 'east', west: 'west' });

export const DUGAN_ANIMS = Object.freeze({
  idle:   { folder: 'Idle', anim: 'Idle', frames: 8, fps: 6, loop: true, dirs: ALL_DIRS },
  walk:   { folder: 'Walking', anim: 'Walk', frames: 6, fps: 7, loop: true, dirs: ALL_DIRS },
  punch:  { folder: 'Fighting', anim: 'The_character_pulls_their_right_hand_back_to_the_w', frames: 9, side: PLAIN },
  stomp:  { folder: 'Ground_Stomp', anim: 'The_character_performs_a_powerful_leap_pulling_the', frames: 9, side: PLAIN },
  charge: { folder: 'running_then_grab', anim: 'The_character_initiates_a_powerful_sprint_leaning', frames: 9, side: PLAIN },
  grab:   { folder: 'Jumping_slam', anim: 'The_character_performs_a_sudden_heavy_leaping_jump', frames: 9, side: PLAIN },
  rage:   { folder: 'Rage_Punch', anim: 'The_character_pulls_the_glowing_orange_fire-envelo', frames: 9, side: { east: 'east-97b723ba', west: 'west' } },
  recoil: { folder: 'jumping_backwards_in', anim: 'The_character_performs_a_sharp_controlled_hop_tuck', frames: 9, side: PLAIN },
  // The generated west clip hides the arm until its last frame, so west uses the east frames mirrored (made with PIL into west-mirrored/; the original west folder is untouched).
  lift:   { folder: 'one_hand_lift_state', anim: 'The_character_initiates_a_sharp_controlled_movemen', frames: 9, side: { east: 'east', west: 'west-mirrored' } },
  // Zed's swing -> arms pulled in to shield the body (BLOCK state). All four directions exist in the art; the east/west pair is used.
  block:  { folder: 'Blocking', anim: 'The_character_pulls_both_arms_inward_to_shield_the', frames: 9, side: PLAIN },
  hit:    { folder: 'when_taking_a_punch', anim: 'Taking_Punch', frames: 6, side: PLAIN },
  // The art has 7 frames, but the last (frame_006) is a rebound with the legs kicked up and only the back touching the floor, which reads as
  // hovering. The clip stops on frame_005, the body lying flat.
  death:  { folder: 'falling_backwards_de', anim: 'Falling_Back_Death', frames: 6, side: PLAIN },
});

export const DUGAN_ACTION_FPS = 30;          // default rate of the one-shot clips; each play sets timeScale to fit its move
export const CHARGE_CLIP_EXTRA_MS = 1200;    // the charge clip spans the wind-up plus about this much running
export const RECOIL_MS = 900;
export const DUGAN_DEATH_MS = 700;           // same collapse timing as the Breaker (deathViewPhase in breakerData.js)
export const DUGAN_SINK_PX = 12;             // once he is lying flat (from clip frame 5) the body sits this far below his shadow centre, so it lies on the floor, not on its edge
export const DUGAN_SINK_FROM_FRAME = 5;      // 1-based frame number of the clip

const dirsOf = (a) => a.dirs || SIDES;
const dirFolder = (a, dir) => (a.dirs ? dir : a.side[dir]);
const frameName = (i) => `frame_${String(i).padStart(3, '0')}.png`;

export const duganRotationKey = (dir) => `${DUGAN_TEX}.rot.${dir}`;
export const duganRotationPath = (dir) => `${DUGAN_DIR}/Idle/rotations/${dir}.png`;
export const duganFrameKey = (name, dir, i) => `${DUGAN_TEX}.${name}.${dir}.${i}`;
export const duganAnimKey = (name, dir) => `${DUGAN_TEX}.${name}.${dir}`;
export const duganFramePath = (name, dir, i) => {
  const a = DUGAN_ANIMS[name];
  return `${DUGAN_DIR}/${a.folder}/animations/${a.anim}/${dirFolder(a, dir)}/${frameName(i)}`;
};

/** Every image to load: [{ key, path }]. */
export function duganAssets() {
  const out = ALL_DIRS.map((d) => ({ key: duganRotationKey(d), path: duganRotationPath(d) }));
  for (const [name, a] of Object.entries(DUGAN_ANIMS)) {
    for (const d of dirsOf(a)) for (let i = 0; i < a.frames; i++) out.push({ key: duganFrameKey(name, d, i), path: duganFramePath(name, d, i) });
  }
  return out;
}

/** Every animation to register: [{ key, frames: [textureKey], frameRate, repeat }]. */
export function duganAnimDefs() {
  const out = [];
  for (const [name, a] of Object.entries(DUGAN_ANIMS)) {
    for (const d of dirsOf(a)) {
      out.push({
        key: duganAnimKey(name, d), repeat: a.loop ? -1 : 0, frameRate: a.loop ? a.fps : DUGAN_ACTION_FPS,
        frames: Array.from({ length: a.frames }, (_, i) => duganFrameKey(name, d, i)),
      });
    }
  }
  return out;
}

/** timeScale that fits an action clip of `name` into `ms` (the default rate is DUGAN_ACTION_FPS). */
export const duganFitScale = (name, ms) => (DUGAN_ANIMS[name].frames * 1000 / DUGAN_ACTION_FPS) / Math.max(1, ms);
export const duganDeathTimeScale = () => duganFitScale('death', DUGAN_DEATH_MS);

/** Length the move's clip is fitted to: wind-up + strike (the charge: wind-up + a stretch of running). */
export const STOMP_CLIP_TAIL_MS = 250;      // the stomp clip ends shortly after the slam; Dugan holds the pose while the wave runs
export function duganMoveMs(move) {
  if (move.id === 'charge') return move.telegraphMs + CHARGE_CLIP_EXTRA_MS;
  if (move.id === 'stomp' && move.wave) return move.telegraphMs + move.wave.startAt + STOMP_CLIP_TAIL_MS;
  return move.telegraphMs + move.attackMs;
}

// Grab and Wall Slam (and a charge that catches Zed) is drawn from still frames, so Dugan looks like he has Zed in his hands:
//   gather (Ground_Stomp 0-4 across the wind-up of the standing grab) -> reaching (running_then_grab, last frame, arms out)
//   -> lift (one_hand_lift_state 3-7 across the first 80% of the hold, then the peak frame 7 until the slam; frame 8 is the arm dropping back)
//   -> bend over and drive him down (Jumping_slam 5-8 across the slam).
export const GRAB_FRAMES = Object.freeze({ gather: { clip: 'stomp', from: 0, to: 4 }, reach: { clip: 'charge', frame: 8 }, hold: { clip: 'lift', from: 3, to: 7, peakAt: 0.8 }, slam: { clip: 'grab', from: 5, to: 8 } });
const lerpFrame = (f, p) => f.from + Math.min(f.to - f.from, Math.floor(Math.max(0, Math.min(0.999, p)) * (f.to - f.from + 1)));
/** Texture key of the still frame to show for a grab, or null when the normal clips apply. */
export function duganGrabStill(g, face) {
  const m = g.move;
  if (!m) return null;
  if (g.state === 'telegraph' && m.id === 'grab') return duganFrameKey(GRAB_FRAMES.gather.clip, face, lerpFrame(GRAB_FRAMES.gather, g.telegraphProgress));
  if (g.state !== 'attack') return null;
  const gs = g.grab;
  if (gs && gs.phase === 'slam') return duganFrameKey(GRAB_FRAMES.slam.clip, face, lerpFrame(GRAB_FRAMES.slam, 1 - gs.lingerLeft / Math.max(1, gs.params.slamLingerMs)));
  if (gs && gs.phase === 'hold') {
    const hp = 1 - gs.holdLeft / Math.max(1, gs.params.holdMs);
    return duganFrameKey(GRAB_FRAMES.hold.clip, face, lerpFrame(GRAB_FRAMES.hold, hp / GRAB_FRAMES.hold.peakAt));
  }
  if (m.id === 'grab') return duganFrameKey(GRAB_FRAMES.reach.clip, face, GRAB_FRAMES.reach.frame);   // reaching out (and a whiff: arms stay out)
  return null;
}

/**
 * What to show for a BrickDugan `g` ({ state, facing, vx, vy, move, moveSeq, crashed, crashSeq, hitstunMs }).
 * { anim, dir, ... } where
 *   loop clips (idle, walk): played repeating;       move: true  = one-shot fitted to totalMs, restart when `seq` changes;
 *   hit: true = one-shot fitted to the stun;         death: true = one-shot at deathTimeScale.
 * `rotation` is a still pose to fall back on when the clip is not available.
 */
export function duganPose(g) {
  const face = g.facing < 0 ? 'west' : 'east';
  const rotation = duganRotationKey(face);
  if (g.state === 'dead') return { anim: duganAnimKey('death', face), dir: face, once: true, death: true, rotation, deathTimeScale: duganDeathTimeScale() };
  if (g.state === 'hitstun') return { anim: duganAnimKey('hit', face), dir: face, once: true, hit: true, frames: DUGAN_ANIMS.hit.frames, rotation };
  if (g.state === 'block') return { anim: duganAnimKey('block', face), dir: face, once: true, move: true, seq: `block${g.blockSeq}`, totalMs: DUGAN_BLOCK.clipMs, clip: 'block', rotation };
  const still = duganGrabStill(g, face);
  if (still) return { anim: still, dir: face, still, rotation };
  if ((g.state === 'telegraph' || g.state === 'attack') && g.move) {
    return { anim: duganAnimKey(g.move.id, face), dir: face, once: true, move: true, seq: g.moveSeq, totalMs: duganMoveMs(g.move), clip: g.move.id, rotation };
  }
  if (g.state === 'recover' && g.crashed) return { anim: duganAnimKey('recoil', face), dir: face, once: true, move: true, seq: `crash${g.crashSeq}`, totalMs: RECOIL_MS, clip: 'recoil', rotation };
  const dir = g.state === 'approach' ? directionFromVelocity(g.vx || 0, g.vy || 0) : null;
  if (dir) return { anim: duganAnimKey('walk', dir), dir, walk: true, rotation };
  return { anim: duganAnimKey('idle', face), dir: face, rotation };
}
