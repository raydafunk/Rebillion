// "Raptor" sprite data (Level 5 mini-boss). No Phaser. Art lives in assets/sprites/Raptor/ (PixelLab export):
//   <folder>/rotations/<dir>.png and <folder>/animations/<anim>/<dir>/frame_000.png...
// He is a RaptorBoss (RaptorBoss.js); the clips map onto his states and moves:
//   idle : standing / recovering     walk : closing in / strafing (follows the movement direction)
//   landing: landing/Dive_Kick_copy (recovery after Dive Kick)
//   dive : Dive_Kick                 falcon : Falcon_Drop
//   punch: 4_hit_punch, the 4-Hit Punch move
//   run  : Running_state, ONLY while a 6-Hit Charge runs in (pose.run); six: 6_hit_punch, the rush's punches. Neither is ever idle/approach art.
//   block: Block_state (arms crossed, while the BLOCK guard is up)
//   hit  : talking_a_punch (parry stun only)    death : Death_fall
// Move clips are one-shots fitted to wind-up + strike. Only the directions that exist on disk are loaded.
import { DIRECTIONS, directionFromVelocity } from './breakerData.js';
import { RAPTOR_ID, RAPTOR_BLOCK } from './raptorData.js';

export const RAPTOR_DIR = 'assets/sprites/Raptor';
export const RAPTOR_TEX = 'rust.raptor';
export const RAPTOR_ALL_DIRS = DIRECTIONS;
const SIDES = Object.freeze(['east', 'west']);
const FOUR = Object.freeze(['east', 'north', 'south', 'west']);

export const RAPTOR_ANIMS = Object.freeze({
  idle:   { folder: 'Idle', anim: 'idle_breathing', frames: 8, fps: 6, loop: true, dirs: SIDES, load: true },
  walk:   { folder: 'walking', anim: 'walking', frames: 8, fps: 12, loop: true, dirs: FOUR, load: true },
  punch:  { folder: '4_hit_punch', anim: 'The_character_executes_a_rapid_four-hit_punch_comb', frames: 9, dirs: SIDES, load: true },
  six:    { folder: '6_hit_punch', anim: 'The_character_performs_a_rapid_six-hit_combo_of_al', frames: 9, dirs: FOUR, load: true },   // the 6-Hit Charge punches (east/west used; north/south exist on disk)
  run:    { folder: 'Running_state', anim: 'The_character_enters_a_rhythmic_running_gait_alter', frames: 9, fps: 16, loop: true, dirs: Object.freeze(['east', 'south', 'west']), load: true },   // lead-in of the 6-Hit Charge ONLY
  dive:   { folder: 'Dive_Kick', anim: 'high_kick', frames: 8, dirs: SIDES, load: true },
  falcon: { folder: 'Falcon_Drop', anim: 'The_character_initiates_a_falcon_drop_by_hunching', frames: 9, dirs: SIDES, load: true },
  landing: { folder: 'landing/Dive_Kick_copy', anim: 'The_character_completes_a_forceful_kick_retracting', frames: 9, dirs: SIDES, load: true },   // after the Dive Kick: kick retracts, he straightens up
  block:  { folder: 'Block_state', anim: 'The_character_pulls_both_arms_inward_to_cross_them', frames: 9, dirs: SIDES, load: true },   // BLOCK: arms cross, one-shot fitted to RAPTOR_BLOCK.raiseMs, holds the last frame
  hit:    { folder: 'talking_a_punch', anim: 'Taking_Punch', frames: 6, dirs: SIDES, load: true },
  death:  { folder: 'Death_fall', anim: 'Falling_Back_Death', frames: 7, dirs: SIDES, load: true },
});

export const RAPTOR_ACTION_FPS = 30;   // default rate of one-shot clips; each play sets timeScale to fit its move
export const RAPTOR_DEATH_MS = 700;
export const RAPTOR_LANDING_MS = 620;   // Dive Kick landing clip length (his recovery is 850 ms: the rest is spent standing)
export const isRaptor = (skin) => skin === RAPTOR_ID;

const frameName = (i) => `frame_${String(i).padStart(3, '0')}.png`;
export const raptorRotationKey = (dir) => `${RAPTOR_TEX}.rot.${dir}`;
export const raptorRotationPath = (dir) => `${RAPTOR_DIR}/Idle/rotations/${dir}.png`;
export const raptorFrameKey = (name, dir, i) => `${RAPTOR_TEX}.${name}.${dir}.${i}`;
export const raptorAnimKey = (name, dir) => `${RAPTOR_TEX}.${name}.${dir}`;
export const raptorFramePath = (name, dir, i) => {
  const a = RAPTOR_ANIMS[name];
  return `${RAPTOR_DIR}/${a.folder}/animations/${a.anim}/${dir}/${frameName(i)}`;
};

/** Every image to load: [{ key, path }]. */
export function raptorAssets() {
  const out = RAPTOR_ALL_DIRS.map((d) => ({ key: raptorRotationKey(d), path: raptorRotationPath(d) }));
  for (const [name, a] of Object.entries(RAPTOR_ANIMS)) {
    if (!a.load) continue;
    for (const d of a.dirs) for (let i = 0; i < a.frames; i++) out.push({ key: raptorFrameKey(name, d, i), path: raptorFramePath(name, d, i) });
  }
  return out;
}

/** Every animation to register: [{ key, frames: [textureKey], frameRate, repeat }]. */
export function raptorAnimDefs() {
  const out = [];
  for (const [name, a] of Object.entries(RAPTOR_ANIMS)) {
    if (!a.load) continue;
    for (const d of a.dirs) {
      out.push({
        key: raptorAnimKey(name, d), repeat: a.loop ? -1 : 0, frameRate: a.loop ? a.fps : RAPTOR_ACTION_FPS,
        frames: Array.from({ length: a.frames }, (_, i) => raptorFrameKey(name, d, i)),
      });
    }
  }
  return out;
}

/** timeScale that fits an action clip of `name` into `ms`. */
export const raptorFitScale = (name, ms) => (RAPTOR_ANIMS[name].frames * 1000 / RAPTOR_ACTION_FPS) / Math.max(1, ms);
export const raptorDeathTimeScale = () => raptorFitScale('death', RAPTOR_DEATH_MS);

/** Walk art has east / west / north / south: a diagonal uses the side-on clip. */
const walkDir = (dir) => (FOUR.includes(dir) ? dir : dir.endsWith('west') ? 'west' : 'east');

const CLIP_OF = Object.freeze({ dive: 'dive', punch: 'punch', falcon: 'falcon' });
/** Length the move's clip is fitted to: wind-up + the strike up to a beat after its last hit. */
export const raptorMoveMs = (m) => m.id === 'rush' ? Math.min(m.attackMs, m.hits[m.hits.length - 1].atMs + 200)   // rush: the six-hit clip covers the punches only (it starts when the run ends)
  : m.id === 'dive' ? m.telegraphMs + m.flightMs   // Dive Kick: the clip is all airborne art, so it ends at touchdown; recovery shows a crouch still
  : m.telegraphMs + Math.min(m.attackMs, m.hits[m.hits.length - 1].atMs + 200);

/**
 * What to show for a RaptorBoss `g` ({ state, facing, vx, vy, move, moveSeq, lift }). Same contract as glitchPose: loop clips (idle, walk) repeat;
 * `move: true` = one-shot fitted to totalMs, restarted when `seq` changes; hit: fitted to the stun; death: one-shot.
 * `lift` is passed through (draw the sprite that many px above the floor, shadow stays on it). `rotation` is a still-pose fallback.
 */
export function raptorPose(g) {
  const face = g.facing < 0 ? 'west' : 'east';
  const rotation = raptorRotationKey(face);
  const lift = g.lift || 0;
  if (g.state === 'dead') return { anim: raptorAnimKey('death', face), dir: face, once: true, death: true, rotation, lift: 0, deathTimeScale: raptorDeathTimeScale() };
  if (g.state === 'hitstun') return { anim: raptorAnimKey('hit', face), dir: face, once: true, hit: true, frames: RAPTOR_ANIMS.hit.frames, rotation, lift: 0 };
  if (g.state === 'block') return { anim: raptorAnimKey('block', face), dir: face, once: true, move: true, seq: `blk${g.blockSeq || 0}`, totalMs: RAPTOR_BLOCK.raiseMs, clip: 'block', rotation, lift: 0 };   // guard up: arms cross once, then the last frame holds
  if ((g.state === 'telegraph' || g.state === 'attack') && g.move && CLIP_OF[g.move.id]) {
    const clip = CLIP_OF[g.move.id];
    return { anim: raptorAnimKey(clip, face), dir: face, once: true, move: true, seq: `mv${g.moveSeq}`, totalMs: raptorMoveMs(g.move), clip, rotation, lift };
  }
  if (g.state === 'recover' && g.move && g.move.id === 'dive') return { anim: raptorAnimKey('landing', face), dir: face, once: true, move: true, seq: `land${g.moveSeq}`, totalMs: RAPTOR_LANDING_MS, clip: 'landing', rotation, lift: 0 };   // landed: the landing clip (kick retracts, stands up), then holds its last frame
  if (g.move && g.move.id === 'rush') {
    if (g.state === 'attack' && g.running) return { anim: raptorAnimKey('run', face), dir: face, run: true, rotation, lift: 0 };   // looped run clip, only as the lead-in
    if (g.state === 'attack') return { anim: raptorAnimKey('six', face), dir: face, once: true, move: true, seq: `six${g.moveSeq}`, totalMs: raptorMoveMs(g.move), clip: 'six', rotation, lift: 0 };
  }
  const dir = g.state === 'approach' ? directionFromVelocity(g.vx || 0, g.vy || 0) : null;
  if (dir) { let d = walkDir(dir); if (d === 'east' || d === 'west') d = face; return { anim: raptorAnimKey('walk', d), dir: d, walk: true, rotation, lift }; }
  return { anim: raptorAnimKey('idle', face), dir: face, rotation, lift };
}
