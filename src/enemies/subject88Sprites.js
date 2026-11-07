// "Subject 88" sprite data (Level 6 mini-boss). No Phaser. Art lives in "assets/sprites/Subject 88/" (note the space; PixelLab export):
//   <folder>/rotations/<dir>.png (Idle only) and <folder>/animations/<anim>/<dir>/frame_000.png...
// He is a Subject88Boss (Subject88Boss.js); the clips map onto his states and moves:
//   idle   : standing / recovering            walk   : walking Zed down
//   breath : Toxic_Breath                      spit   : Acid_Spit
//   charge : jump_into (the crouch and launch of Frenzied Charge)     slam : over_head_make_Slash (Corrosion Slam)
//   explosion : no clip of its own, reuses the Toxic_Breath clip; the ring FX carries the move
//   hit    : taking_a_hit (parry stun only)    death : death_full
// Move clips are one-shots fitted to wind-up + strike. Directions on disk differ per clip, see the dirs below.
import { DIRECTIONS, directionFromVelocity } from './breakerData.js';
import { SUBJECT88_ID } from './subject88Data.js';

export const SUBJECT88_DIR = 'assets/sprites/Subject 88';
export const SUBJECT88_TEX = 'rust.subject-88';
export const SUBJECT88_ALL_DIRS = DIRECTIONS;
const SIDES = Object.freeze(['east', 'west']);
const SIDES_N = Object.freeze(['east', 'north', 'west']);
const SIDES_S = Object.freeze(['east', 'south', 'west']);

export const SUBJECT88_ANIMS = Object.freeze({
  idle:   { folder: 'Idle', anim: 'idle_breathing', frames: 8, fps: 6, loop: true, dirs: SIDES_S, load: true },
  walk:   { folder: 'walking', anim: 'Walking', frames: 8, fps: 9, loop: true, dirs: SIDES_N, load: true },
  breath: { folder: 'Toxic_Breath', anim: 'The_character_heaves_its_torso_forward_as_the_thro', frames: 9, dirs: SIDES_N, load: true },
  spit:   { folder: 'Acid_Spit', anim: 'The_creature_heaves_its_chest_forward_while_openin', frames: 9, dirs: SIDES, load: true },
  charge: { folder: 'jump_into', anim: 'The_character_crouches_low_coiling_its_muscles_wit', frames: 9, dirs: SIDES_N, load: true },
  slam:   { folder: 'over_head_make_Slash', anim: 'Both_hands_draw_back_high_behind_the_shoulders_the', frames: 9, dirs: SIDES_S, load: true },
  hit:    { folder: 'taking_a_hit', anim: 'Taking_Punch', frames: 6, dirs: SIDES_N, load: true },
  death:  { folder: 'death_full', anim: 'Falling_Back_Death', frames: 7, dirs: SIDES_S, load: true },
});

export const SUBJECT88_ACTION_FPS = 30;   // default rate of one-shot clips; each play sets timeScale to fit its move
export const SUBJECT88_DEATH_MS = 900;
export const isSubject88 = (skin) => skin === SUBJECT88_ID;

const frameName = (i) => `frame_${String(i).padStart(3, '0')}.png`;
export const subject88RotationKey = (dir) => `${SUBJECT88_TEX}.rot.${dir}`;
export const subject88RotationPath = (dir) => `${SUBJECT88_DIR}/Idle/rotations/${dir}.png`;
export const subject88FrameKey = (name, dir, i) => `${SUBJECT88_TEX}.${name}.${dir}.${i}`;
export const subject88AnimKey = (name, dir) => `${SUBJECT88_TEX}.${name}.${dir}`;
export const subject88FramePath = (name, dir, i) => {
  const a = SUBJECT88_ANIMS[name];
  return `${SUBJECT88_DIR}/${a.folder}/animations/${a.anim}/${dir}/${frameName(i)}`;
};

/** Every image to load: [{ key, path }]. */
export function subject88Assets() {
  const out = SUBJECT88_ALL_DIRS.map((d) => ({ key: subject88RotationKey(d), path: subject88RotationPath(d) }));
  for (const [name, a] of Object.entries(SUBJECT88_ANIMS)) {
    if (!a.load) continue;
    for (const d of a.dirs) for (let i = 0; i < a.frames; i++) out.push({ key: subject88FrameKey(name, d, i), path: subject88FramePath(name, d, i) });
  }
  return out;
}

/** Every animation to register: [{ key, frames: [textureKey], frameRate, repeat }]. */
export function subject88AnimDefs() {
  const out = [];
  for (const [name, a] of Object.entries(SUBJECT88_ANIMS)) {
    if (!a.load) continue;
    for (const d of a.dirs) {
      out.push({
        key: subject88AnimKey(name, d), repeat: a.loop ? -1 : 0, frameRate: a.loop ? a.fps : SUBJECT88_ACTION_FPS,
        frames: Array.from({ length: a.frames }, (_, i) => subject88FrameKey(name, d, i)),
      });
    }
  }
  return out;
}

/** timeScale that fits an action clip of `name` into `ms`. */
export const subject88FitScale = (name, ms) => (SUBJECT88_ANIMS[name].frames * 1000 / SUBJECT88_ACTION_FPS) / Math.max(1, ms);
export const subject88DeathTimeScale = () => subject88FitScale('death', SUBJECT88_DEATH_MS);

const CLIP_OF = Object.freeze({ breath: 'breath', spit: 'spit', charge: 'charge', slam: 'slam', explosion: 'breath' });
/** Length the move's clip is fitted to: wind-up + strike (explosion's long burst is capped so the borrowed breath clip stays readable; the charge clip covers the launch only). */
export const subject88MoveMs = (m) => m.telegraphMs + (m.id === 'explosion' ? 300 : m.id === 'charge' ? 200 : m.attackMs);

/**
 * What to show for a Subject88Boss `g` ({ state, facing, vx, vy, move, moveSeq }). Same contract as glitchPose: loop clips (idle, walk) repeat;
 * `move: true` = one-shot fitted to totalMs, restarted when `seq` changes; hit: fitted to the stun; death: one-shot.
 * `rotation` is a still pose to fall back on when a clip is not available.
 */
export function subject88Pose(g) {
  const face = g.facing < 0 ? 'west' : 'east';
  const rotation = subject88RotationKey(face);
  if (g.state === 'dead') return { anim: subject88AnimKey('death', face), dir: face, once: true, death: true, rotation, deathTimeScale: subject88DeathTimeScale() };
  if (g.state === 'hitstun') return { anim: subject88AnimKey('hit', face), dir: face, once: true, hit: true, frames: SUBJECT88_ANIMS.hit.frames, rotation };
  if ((g.state === 'telegraph' || g.state === 'attack') && g.move && CLIP_OF[g.move.id]) {
    const clip = CLIP_OF[g.move.id];
    return { anim: subject88AnimKey(clip, face), dir: face, once: true, move: true, seq: `mv${g.moveSeq}`, totalMs: subject88MoveMs(g.move), clip, rotation };
  }
  const dir = g.state === 'approach' ? directionFromVelocity(g.vx || 0, g.vy || 0) : null;
  if (dir) {
    // walk art has east / west / north only: south and diagonals use the side-on clip (he keeps facing Zed)
    const d = dir === 'north' ? 'north' : face;
    return { anim: subject88AnimKey('walk', d), dir: d, walk: true, rotation };
  }
  return { anim: subject88AnimKey('idle', face), dir: face, rotation };
}
