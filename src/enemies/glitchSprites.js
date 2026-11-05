// "Glitch" sprite data (Level 4 mini-boss, wave 5). No Phaser. Art lives in assets/sprites/Glitch/ (PixelLab export):
//   <folder>/rotations/<dir>.png and <folder>/animations/<anim>/<dir>/frame_000.png...
// He is a GlitchBoss (GlitchBoss.js); the clips map onto his states and moves:
//   idle   : standing / recovering            walk : backing away / closing in (follows the movement direction)
//   disk   : Shock_Disk_Throw_sta   drones : Drone_Barrage   decoy : Hologram_Duplicate   spike : Data_Spike   teleport : Emergency_Teleport
//   punch  : Hologram_Duplicate_Upppercut (the hologram double's surprise uppercut, drawn on the decoy, not on Glitch)
//   hit    : talking_a_punch (parry stun only)    death : death_fall
// Move clips are one-shots fitted to wind-up + strike.
import { DIRECTIONS, directionFromVelocity } from './breakerData.js';
import { GLITCH_ID } from './glitchData.js';

export const GLITCH_DIR = 'assets/sprites/Glitch';
export const GLITCH_TEX = 'rust.glitch';
export const GLITCH_ALL_DIRS = DIRECTIONS;
const SIDES = Object.freeze(['east', 'west']);
const FOUR = Object.freeze(['east', 'north', 'south', 'west']);

export const GLITCH_ANIMS = Object.freeze({
  idle:     { folder: 'Idle', anim: 'idle_breathing', frames: 8, fps: 6, loop: true, dirs: FOUR, load: true },
  walk:     { folder: 'walking', anim: 'walking', frames: 8, fps: 10, loop: true, dirs: FOUR, load: true },
  disk:     { folder: 'Shock_Disk_Throw_sta', anim: 'The_character_draws_their_right_hand_back_to_the_h', frames: 9, dirs: SIDES, load: true },
  drones:   { folder: 'Drone_Barrage', anim: 'The_character_pulls_their_right_hand_back_to_the_h', frames: 9, dirs: SIDES, load: true },
  decoy:    { folder: 'Hologram_Duplicate', anim: 'The_character_performs_a_rapid_shimmering_pulse_cr', frames: 9, dirs: SIDES, load: true },
  spike:    { folder: 'Data_Spike', anim: 'The_character_pulls_the_right_hand_back_to_the_hip', frames: 9, dirs: SIDES, load: true },
  teleport: { folder: 'Emergency_Teleport', anim: 'The_character_rapidly_dissolves_into_a_shimmering', frames: 9, dirs: SIDES, load: true },
  punch:    { folder: 'Hologram_Duplicate_Upppercut', anim: 'Surprise_Uppercut', frames: 7, dirs: SIDES, load: true },
  hit:      { folder: 'talking_a_punch', anim: 'Taking_Punch', frames: 6, dirs: SIDES, load: true },
  death:    { folder: 'death_fall', anim: 'Falling_Back_Death', frames: 7, dirs: SIDES, load: true },
});

export const GLITCH_ACTION_FPS = 30;   // default rate of one-shot clips; each play sets timeScale to fit its move
export const GLITCH_DEATH_MS = 700;
export const GLITCH_PUNCH_MS = 600;    // the decoy's uppercut clip is fitted to this
export const isGlitch = (skin) => skin === GLITCH_ID;

const frameName = (i) => `frame_${String(i).padStart(3, '0')}.png`;
export const glitchRotationKey = (dir) => `${GLITCH_TEX}.rot.${dir}`;
export const glitchRotationPath = (dir) => `${GLITCH_DIR}/Idle/rotations/${dir}.png`;
export const glitchFrameKey = (name, dir, i) => `${GLITCH_TEX}.${name}.${dir}.${i}`;
export const glitchAnimKey = (name, dir) => `${GLITCH_TEX}.${name}.${dir}`;
export const glitchFramePath = (name, dir, i) => {
  const a = GLITCH_ANIMS[name];
  return `${GLITCH_DIR}/${a.folder}/animations/${a.anim}/${dir}/${frameName(i)}`;
};

/** Every image to load: [{ key, path }]. */
export function glitchAssets() {
  const out = GLITCH_ALL_DIRS.map((d) => ({ key: glitchRotationKey(d), path: glitchRotationPath(d) }));
  for (const [name, a] of Object.entries(GLITCH_ANIMS)) {
    if (!a.load) continue;
    for (const d of a.dirs) for (let i = 0; i < a.frames; i++) out.push({ key: glitchFrameKey(name, d, i), path: glitchFramePath(name, d, i) });
  }
  return out;
}

/** Every animation to register: [{ key, frames: [textureKey], frameRate, repeat }]. */
export function glitchAnimDefs() {
  const out = [];
  for (const [name, a] of Object.entries(GLITCH_ANIMS)) {
    if (!a.load) continue;
    for (const d of a.dirs) {
      out.push({
        key: glitchAnimKey(name, d), repeat: a.loop ? -1 : 0, frameRate: a.loop ? a.fps : GLITCH_ACTION_FPS,
        frames: Array.from({ length: a.frames }, (_, i) => glitchFrameKey(name, d, i)),
      });
    }
  }
  return out;
}

/** timeScale that fits an action clip of `name` into `ms`. */
export const glitchFitScale = (name, ms) => (GLITCH_ANIMS[name].frames * 1000 / GLITCH_ACTION_FPS) / Math.max(1, ms);
export const glitchDeathTimeScale = () => glitchFitScale('death', GLITCH_DEATH_MS);

/** Walk art has east / west / north / south: a diagonal uses the side-on clip. */
const walkDir = (dir) => (FOUR.includes(dir) ? dir : dir.endsWith('west') ? 'west' : 'east');

const CLIP_OF = Object.freeze({ disk: 'disk', drones: 'drones', decoy: 'decoy', spike: 'spike', teleport: 'teleport' });
/** Length the move's clip is fitted to: wind-up + strike (the decoy's long strike is capped so the shimmer clip stays readable). */
export const glitchMoveMs = (m) => m.telegraphMs + (m.id === 'decoy' ? 300 : m.attackMs);

/**
 * What to show for a GlitchBoss `g` ({ state, facing, vx, vy, move, moveSeq }). Same contract as roycePose: loop clips (idle, walk) repeat;
 * `move: true` = one-shot fitted to totalMs, restarted when `seq` changes; hit: fitted to the stun; death: one-shot.
 * `rotation` is a still pose to fall back on when a clip is not available.
 */
export function glitchPose(g) {
  const face = g.facing < 0 ? 'west' : 'east';
  const rotation = glitchRotationKey(face);
  if (g.state === 'dead') return { anim: glitchAnimKey('death', face), dir: face, once: true, death: true, rotation, deathTimeScale: glitchDeathTimeScale() };
  if (g.state === 'hitstun') return { anim: glitchAnimKey('hit', face), dir: face, once: true, hit: true, frames: GLITCH_ANIMS.hit.frames, rotation };
  if ((g.state === 'telegraph' || g.state === 'attack') && g.move && CLIP_OF[g.move.id]) {
    const clip = CLIP_OF[g.move.id];
    return { anim: glitchAnimKey(clip, face), dir: face, once: true, move: true, seq: `mv${g.moveSeq}`, totalMs: glitchMoveMs(g.move), clip, rotation };
  }
  const dir = g.state === 'approach' ? directionFromVelocity(g.vx || 0, g.vy || 0) : null;
  if (dir) { let d = walkDir(dir); if (d === 'east' || d === 'west') d = face; /* he keeps facing Zed while backing away */ return { anim: glitchAnimKey('walk', d), dir: d, walk: true, rotation }; }
  return { anim: glitchAnimKey('idle', face), dir: face, rotation };
}
