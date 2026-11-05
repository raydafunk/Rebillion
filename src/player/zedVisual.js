// Zed's on-screen visual: sprite selection + procedural stand-in animation.
// zedPose() is pure (testable without Phaser). ZedVisual applies it to an image.
// Real frame animations: register Phaser anims named `zed.<state>` (e.g. zed.run,
// zed.attack) or `zed.<moveId>` (zed.light1); ZedVisual plays them when they exist
// and skips the procedural pose. See registerZedAnimations().

import { MOVES, PARRY, PICKUP_POSE } from './moves.js';
import { ZED_CONFIG } from './config.js';
import { GRAB_CONFIG } from './grabConfig.js';

export const ZED_SPRITE = {
  size: 48,                 // source px (metadata.json states[].character.size)
  scale: 2.5,               // 48 -> 120 px on screen
  origin: { x: 0.5, y: 1 }, // feet anchor
  dir: { right: 'east', left: 'west' }, // side view: swap textures instead of flipX
  base: 'assets/sprites/zed/',
};
const DIRS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'];
export const zedTextureKey = (state, dir) => `zed.${state.toLowerCase()}.${dir}`;

// Frame animations (side view only). state = machine state the clip plays for.
// Metadata folder/anim names are case-sensitive on disk: "Idle", "Running"/"running".
export const ZED_ANIMS = [
  // Running plays for the machine's single locomotion state ('run' = fast movement).
  // 8 directions: measured per-dir mean foot row 52.0-53.6 (N/S/diagonals within 1px of E/W 53.1), so one originY, no dirOriginY.
  // Frames are 64x64 canvases (not 48): lowest opaque row is 52-54 (avg ~53) vs idle's 45 on 48.
  // Feet anchor = (53.5 + 1 + 2px ground gap)/64, same gap idle has (45+1+2 = 48/48).
  { state: 'run', folder: 'Running', anim: 'running', frames: 8, fps: 13, originY: 56.5 / 64, repeat: -1, dirs: 'all',
    dirOriginY: { south: 54 / 64, 'north-east': 53.5 / 64, north: 52.5 / 64, 'north-west': 52.25 / 64 } },
  // Cross punch plays once for every attack move (light/heavy) and holds its last frame until the move ends.
  // 80x80 canvas, character same pixel size as idle; lowest opaque row 61 -> (61 + 1 + 2px gap)/80.
  { state: 'attack', folder: 'fighting_pose', anim: 'Cross_Punch', frames: 6, fps: 24, originY: 64 / 80, repeat: 0 },
  // High kick is the 3rd light hit (finisher); zed.light3.<dir> takes priority over the generic zed.attack clip.
  // 80x80 canvas, same framing as the punch (standing foot rows 58-63).
  { state: 'light3', folder: 'fighting_pose_2', anim: 'High_Kick', frames: 7, fps: 24, originY: 64 / 80, repeat: 0 },
  // Jumping flying kick (airborne light press): zed.airkick.<dir>, stretched over the move, holds the last frame until landing.
  // 80x80 canvas; foot row not measured, assumed to match the standing kick (64/80).
  { state: 'airkick', folder: 'flying_Jumping_Kick', anim: 'Flying_Kick', frames: 6, fps: 24, originY: 64 / 80, repeat: 0 },
  // Heavy attack clips. heavy1 uses the generic zed.attack punch unless its own clip exists, so register one each.
  // heavy1: two-punch hard combo (16 frames, 68x68; foot row unmeasured, assumed 58/68). Stretched over the move.
  { state: 'heavy1', folder: 'fighting_pose_hard_attracts_one_hard_combo_2', anim: 'two_punch_combo', frames: 16, fps: 24, originY: 58 / 68, repeat: 0 },
  // heavy2: hard high kick (8 frames, 68x68, assumed 58/68).
  { state: 'heavy2', folder: 'fighting_pose_hard kick', anim: 'high_kick', frames: 8, fps: 24, originY: 58 / 68, repeat: 0 },
  // heavy3: combo finisher, reuses the hard high kick art (own state key so it can get a unique clip later).
  { state: 'heavy3', folder: 'fighting_pose_hard kick', anim: 'high_kick', frames: 8, fps: 24, originY: 58 / 68, repeat: 0 },
  // heavy4: heavy uppercut finisher (8 frames, 68x68, lowest opaque row 54-55 -> 58/68). Folder is nested under "Heavy uppercut".
  { state: 'heavy4', folder: 'Heavy uppercut/fighting_pose_hard_attracts_one_uppercut', anim: 'uppercut', frames: 8, fps: 24, originY: 58 / 68, repeat: 0 },
  // airheavy: powerful jumping double kick (9 frames, 68x68, assumed 58/68). Nested export folder; east/west only (a south clip also exists).
  { state: 'airheavy', folder: 'Flying Kick Hard/flying_Jumping_Kick_heavy', anim: 'The_character_initiates_a_powerful_jumping_double', frames: 9, fps: 24, originY: 58 / 68, repeat: 0 },
  // Parry reaction (T or M): 9 frames, 68x68 canvas (foot row unmeasured, assumed 58/68). Stretched over PARRY.duration.
  { state: 'parry', folder: 'Zed_parry_reaction_a', anim: 'Zed_parry_reaction_animation_triggered_when_hit._Q', frames: 9, fps: 15, originY: 58 / 68, repeat: 0 },
  // Hit reaction (Taking_Punch): 6 frames, 64x64 canvas like Running (lowest opaque row 53 -> 56.5/64). Played once across the hitstun (stretched in update()).
  { state: 'hitstun', folder: 'when_getting_hit', anim: 'Taking_Punch', frames: 6, fps: 15, originY: 56.5 / 64, repeat: 0 },
  // Uppercut launch (lunched_in_the_air_b): 9 frames, played once across the hitstun, holds the last frame. Canvases differ per dir: east 64x64
  // (lowest opaque row per frame 53,52,51,50,47,46,50,50,52), west 68x68 (55,55,55,55,53,52,52,54,55). The tumble lift is in the art, so one
  // fixed origin per dir at the starting foot row (+1 +2px gap): east 56/64, west 58/68. Purely visual: getState().lift / hit logic untouched.
  { state: 'launched', folder: 'lunched_in_the_air_b', anim: 'The_character_performs_a_mid-air_lunge_by_curling', frames: 9, fps: 20, originY: 56 / 64, repeat: 0,
    dirOriginY: { west: 58 / 68 } },
  // Pick up an item (Picking_Up): 5 frames, 64x64 canvas like Running (foot row assumed 53 -> 56.5/64). Stretched over PICKUP_POSE.duration.
  { state: 'pickup', folder: 'pick_up', anim: 'Picking_Up', frames: 5, fps: 12, originY: 56.5 / 64, repeat: 0 },
  // Rage Special (zed.special.<dir>): 9 frames, 68x68 canvas (foot row unmeasured, assumed 58/68). Stretched over the move.
  { state: 'special', folder: 'Super_special_move', anim: 'The_character_pivots_sharply_right_hand_drawing_to', frames: 9, fps: 15, originY: 58 / 68, repeat: 0 },
  // Rage attack set (east/west; foot rows unmeasured, assumed like the other 68px/80px clips). Stretched over the move.
  { state: 'rageKick', folder: 'Special Kick/Super_special_move_ideal_copy', anim: 'High_Kick', frames: 8, fps: 24, originY: 58 / 68, repeat: 0 },
  { state: 'rageUppercut', folder: 'Special Uppercut/Super_special_move_move_2', anim: 'uppercut', frames: 8, fps: 24, originY: 58 / 68, repeat: 0 },
  { state: 'rageAirKick', folder: 'Super Air Kick/Super_special_move_kick', anim: 'Hurricane_Kick', frames: 4, fps: 24, originY: 64 / 80, repeat: 0 },
  // Death (Falling_Back_Death): 7 frames, 80x80 canvas, plays once and holds the last frame (lowest opaque row 62 -> (62 + 1 + 2px gap)/80).
  // 7 frames / 12 fps = 583 ms, inside ArenaScene's END_DELAY_MS (700) so the lose screen waits for the fall.
  // dirOriginY (back/front views): feet sit on the shadow centre, not 2px above it. = (mean lowest opaque row + 1 + gap)/64 with
  // gap -1 for north/north-east/north-west (1 src px sink so the planted foot is inside the shadow ellipse) and +1 for south;
  // east/west and south-east/south-west keep originY.
  // Carrying a weapon (8 directions, dirs: 'all'): idle when still, walk when moving (incl. depth/diagonals). 64x64 canvases,
  // lowest opaque row measured 51-54 (idle 52-53, walk 51-54 bobbing) -> same 56.5/64 foot line as Running.
  { state: 'carryidle', folder: 'Carrying_weapon_ideal', anim: 'Idle', frames: 8, fps: 10, originY: 56.5 / 64, repeat: -1, dirs: 'all',
    dirOriginY: { south: 55 / 64, 'north-east': 53 / 64, north: 52 / 64, 'north-west': 53 / 64 } },
  // RAGE locomotion (only while zed.rage.isActive, see zedClipKeys). 4 directions (east/west/north/south, no diagonals), 68x68 canvases.
  // Foot rows measured with PIL (lowest opaque row per frame, mean): idle E/W/N 55, S 57 (constant across frames); run E 54.5, W 53.9, N 54.0, S 57.9
  // (S bobs 54-62). Same ground gap as the other 68px clips (row + 1 + 2 = 58/68 for E/W); N sinks 1px, S sits 1px lower like the 64px clips.
  { state: 'rageidle', folder: 'Super_special_move_ideal', anim: 'idle_breathing', frames: 8, fps: 10, originY: 58 / 68, repeat: -1, dirs: 'cardinal',
    dirOriginY: { north: 55 / 68, south: 59 / 68 } },
  { state: 'ragerun', folder: 'Super_special_move_running', anim: 'Running', frames: 8, fps: 13, originY: 57.5 / 68, repeat: -1, dirs: 'cardinal',
    dirOriginY: { west: 57 / 68, north: 54 / 68, south: 60 / 68 } },
  { state: 'carrywalk', folder: 'Carrying_weapon_stat_walking', anim: 'Walking', frames: 8, fps: 12, originY: 56.5 / 64, repeat: -1, dirs: 'all',
    dirOriginY: { south: 55 / 64, 'north-east': 52.5 / 64, north: 52.75 / 64, 'north-west': 52.5 / 64 } },
  // Grab and Wall Slam (Zed.js machine.lock states). held: "hangs limply" clip, 68x68 (lowest row 55 -> (55+1+2)/68), loops while pinned to Dugan's hand.
  { state: 'held', folder: 'being_held_state', anim: 'The_character_hangs_limply_as_if_suspended_by_an_u', frames: 9, fps: 10, originY: 58 / 68, repeat: -1 },
  // slammed: the death fall (Falling_Back_Death) stretched over GRAB_CONFIG.slamFallMs, then he lies on the last frame. getup: the same frames
  // played in reverse over getupMs. Same canvas and foot lines as the dead clip.
  { state: 'slammed', folder: 'knock_down_death', anim: 'Falling_Back_Death', frames: 7, fps: 12, originY: 65 / 80, repeat: 0,
    dirOriginY: { west: 64 / 80 }, frameOriginY: { east: { 6: 54 / 80 }, west: { 6: 54 / 80 } } },
  { state: 'getup', folder: 'knock_down_death', anim: 'Falling_Back_Death', frames: 7, fps: 12, originY: 65 / 80, repeat: 0, reverse: true,
    dirOriginY: { west: 64 / 80 }, frameOriginY: { east: { 6: 54 / 80 }, west: { 6: 54 / 80 } } },
  { state: 'dead', folder: 'knock_down_death', anim: 'Falling_Back_Death', frames: 7, fps: 12, originY: 65 / 80, repeat: 0,
    // The lying frame's body ends at row 51 in both directions (east also has a few stray pixels at rows 57-62 that
    // aren't the body, which is why measuring "lowest opaque row" left him floating), so it's pinned at (51 + 1 + 2)/80.
    // West's first frames sit 1px higher than east's (low row 61 vs 62).
    dirOriginY: { west: 64 / 80 }, frameOriginY: { east: { 6: 54 / 80 }, west: { 6: 54 / 80 } } },
];
// Static single-pose textures shown for a machine state (rotations only, no frames yet).
// originY: Jumping PNG feet sit at row 46 vs idle's 45 (both 48x48), so lift 1 source px to share the idle foot line.
export const ZED_POSES = { jump: { state: 'Jumping', originY: 49 / 48 } };
export const zedFrameKey = (state, dir, i) => `zed.${state}.${dir}.${i}`;
export const zedAnimKey = (state, dir) => `zed.${state}.${dir}`;
export const zedFramePath = (a, dir, i) => `${a.folder}/animations/${a.anim}/${dir}/frame_${String(i).padStart(3, '0')}.png`;
const SIDE = Object.values(ZED_SPRITE.dir);
const CARDINAL = ['east', 'west', 'north', 'south'];
/** Directions a clip is loaded/registered for: all 8 when `dirs: 'all'`, east/west/north/south for `dirs: 'cardinal'`, else east/west only. */
export const clipDirs = (a) => (a.dirs === 'all' ? DIRS : a.dirs === 'cardinal' ? CARDINAL : SIDE);
/** dir8 -> a cardinal direction: diagonals take their horizontal part (north-east -> east, south-west -> west). */
export const cardinalDir = (d8) => (d8 === 'north' || d8 === 'south' ? d8 : String(d8).endsWith('west') ? 'west' : 'east');
export const ZED_DIRS = DIRS;

/** Origin Y for a clip frame. `dir` is the direction in the clip's own key (dir8 for dirs:'all' clips, east/west otherwise). */
export function clipOriginY(clip, dir, frame, fallback = ZED_SPRITE.origin.y) {
  return clip?.frameOriginY?.[dir]?.[frame] ?? clip?.dirOriginY?.[dir] ?? clip?.originY ?? fallback;
}

/**
 * 8-way facing from movement input (moveY: -1 = up/north, +1 = down/south; opposite keys already cancel to 0).
 * No input keeps `prev` (last direction). Pure.
 */
export function dir8FromInput(moveX, moveY, prev = 'east') {
  const x = Math.sign(moveX || 0), y = Math.sign(moveY || 0);
  if (!x && !y) return prev;
  return (y < 0 ? 'north' : y > 0 ? 'south' : '') + (y && x ? '-' : '') + (x > 0 ? 'east' : x < 0 ? 'west' : '');
}

/** stateKey for a hitstun: 'launched' for an uppercut hit (falls back to zed.hitstun if the clip is missing), else the machine state. Pure. */
export function hitStateKey(state, hitKind) {
  return state === 'hitstun' && hitKind === 'launch' ? 'launched' : state;
}

/** Carry clip state for the machine state, or null when the normal clips should play. */
/** Clip keys to try, best first, for a live (non-dead) Zed: carry/run use the 8-way dir, then the east/west chain. */
export function zedClipKeys({ state, stateKey, dir, dir8, carrying, raging = false }) {
  // Rage locomotion clips (4 dirs) win over the carry clips: while raging Zed never shows the carrying-a-weapon look.
  // Carry clips apply only when NOT raging. Only idle/run; every other state is unchanged.
  const rage = raging ? rageState(state) : null;
  const carry = raging ? null : carryState(carrying, state);
  return [...(carry ? [`zed.${carry}.${dir8}`] : rage ? [`zed.${rage}.${cardinalDir(dir8 ?? dir)}`, `zed.${rage}.${dir}`] : state === 'run' ? [`zed.run.${dir8}`] : []),
    `zed.${stateKey}.${dir}`, `zed.${state}.${dir}`, `zed.${stateKey}`, `zed.${state}`];
}

/** Rage clip state for the machine state, or null (attack, jump, parry, hitstun, grab... keep their own clips). */
export function rageState(machineState) {
  return machineState === 'idle' ? 'rageidle' : machineState === 'run' ? 'ragerun' : null;
}

export function carryState(carrying, machineState) {
  if (!carrying) return null;
  if (machineState === 'idle') return 'carryidle';
  if (machineState === 'run') return 'carrywalk'; // 'run' is the single locomotion state (depth moves count)
  return null;
}

/** Queue rotation PNGs per state, plus east/west animation frames (call from scene.preload). */
export function loadZedSprites(scene, states = ['Idle']) {
  // Skip keys that already exist (scene restart) or are already queued in this preload (a second caller), so Phaser doesn't log "Texture key already in use".
  const queued = (key) => scene.textures.exists(key) || scene.load.list.entries.some((f) => f.key === key) || scene.load.inflight.entries.some((f) => f.key === key);
  const queue = (key, path) => { if (!queued(key)) scene.load.image(key, path); };
  for (const s of states) {
    for (const d of DIRS) queue(zedTextureKey(s, d), `${ZED_SPRITE.base}${s}/rotations/${d}.png`);
  }
  for (const a of ZED_ANIMS) for (const d of clipDirs(a)) for (let i = 0; i < a.frames; i++) {
    queue(zedFrameKey(a.state, d, i), ZED_SPRITE.base + zedFramePath(a, d, i));
  }
}

/** Register `zed.<state>.<dir>` anims (zed.run.east/west; all 8 dirs for `dirs: 'all'` clips). Idempotent; skips unloaded frames. */
export function registerZedAnimations(scene) {
  for (const a of ZED_ANIMS) for (const d of clipDirs(a)) {
    const key = zedAnimKey(a.state, d);
    if (scene.anims.exists(key) || !scene.textures.exists(zedFrameKey(a.state, d, 0))) continue;
    for (let i = 0; i < a.frames; i++) scene.textures.get(zedFrameKey(a.state, d, i)).setFilter?.(1); // NEAREST
    const order = Array.from({ length: a.frames }, (_, i) => (a.reverse ? a.frames - 1 - i : i));
    scene.anims.create({ key, frames: order.map((i) => ({ key: zedFrameKey(a.state, d, i) })), frameRate: a.fps, repeat: a.repeat ?? -1 });
  }
}

/** Horizontal body shift (px, facing-signed) for a punch: small pull-back in startup, forward step on active, settle in recovery. */
export function punchLunge(m, facing = 1) {
  const k = m.moveId && m.moveId.startsWith('heavy') ? 1.6 : 1;
  const mv = MOVES[m.moveId];
  if (!mv) return 0;
  const f = m.frame ?? 0;
  const ease = (t) => { const c = Math.max(0, Math.min(1, t)); return c * c * (3 - 2 * c); }; // smoothstep: no velocity snaps
  let x;
  if (f < mv.startup) x = -5 * k * ease(f / mv.startup);                                          // coil back
  else if (f < mv.startup + mv.active) x = k * (-5 + 17 * ease((f - mv.startup + 1) / mv.active)); // drive forward
  else x = 12 * k * (1 - ease((f - mv.startup - mv.active) / mv.recovery));                        // settle
  return x * facing;
}

const IDLE = { sx: 1, sy: 1, ox: 0, oy: 0, angle: 0, tint: null, tintFill: null, alpha: 1 };

/**
 * @param {{state:string, phase?:string|null, moveId?:string|null, t:number, grounded?:boolean, vy?:number, dead?:boolean, facing?:number, guard?:string|null}} s  t in ms
 * @returns {{sx,sy,ox,oy,angle,tint,tintFill,alpha}} scale, px offset (ox in facing direction), degrees
 */
export function zedPose(s) {
  const p = { ...IDLE };
  const f = s.facing ?? 1;
  const t = s.t ?? 0;
  if (s.dead) return { ...p, alpha: 0.35, angle: 80 * f };
  switch (s.state) {
    // Idle: gentle breathing. Height only (width stays crisp), ~1% and slow (~2.8 s cycle) so it doesn't read as
    // squash. The sprite's origin is at the feet, so the feet stay planted; only the head/torso rise a few px.
    case 'idle': p.sy = 1 + 0.01 * (0.5 + 0.5 * Math.sin(t / 450)); break;
    case 'run': { const b = Math.abs(Math.sin(t / 90)); p.oy = -4 * b; p.sy = 1 + 0.03 * b; p.angle = 4 * f; break; }
    case 'jump': {
      // Follow vertical speed continuously (neutral at the apex) so the shape never snaps when vy flips sign.
      const k = Math.max(-1, Math.min(1, -(s.vy ?? 0) / Math.abs(ZED_CONFIG.jumpVelocity))); // +1 rising, -1 falling
      p.sx = 1 - 0.07 * k; p.sy = 1 + 0.10 * k; break;
    }
    case 'attack': {
      const heavy = s.moveId && s.moveId.startsWith('heavy');
      const k = heavy ? 1.6 : 1;
      if (s.phase === 'startup') { p.ox = -6 * k * f; p.angle = -6 * k * f; p.sx = 0.95; }
      else if (s.phase === 'active') { p.ox = 12 * k * f; p.angle = 8 * k * f; p.sx = 1.12; p.sy = 0.94; p.tint = 0xfff2b0; }
      else { p.ox = 4 * k * f; p.angle = 2 * f; }
      break;
    }
    case 'hitstun': p.tintFill = 0xffffff; p.ox = -5 * f; p.angle = -10 * f; p.sx = 0.92; p.sy = 1.06; break;
    // Grab and Wall Slam: no dedicated clips yet, so a tint + squash pose reads each phase.
    case 'held': p.tint = 0xffc266; p.sx = 0.9; p.sy = 1.08; p.angle = Math.sin(t / 55) * 5; p.oy = -2 * Math.abs(Math.sin(t / 70)); break;
    case 'slammed': p.tint = 0xff8866; p.angle = 80 * f; p.alpha = 0.85; break;   // pose used only when the clips are missing; the clip is drawn at full alpha, untinted
    case 'getup': p.tint = 0xffe0a0; p.angle = 25 * f; p.alpha = 0.6 + 0.4 * Math.abs(Math.sin(t / 60)); break;
    case 'block': p.tint = 0x88aaff; p.sx = 1.05; p.sy = 0.94; p.ox = -2 * f; break;
    default: break;
  }
  return p;
}

export class ZedVisual {
  /** @param scene Phaser scene (textures already loaded via loadZedSprites) */
  constructor(scene, key = zedTextureKey('Idle', ZED_SPRITE.dir.right)) {
    this.scene = scene;
    registerZedAnimations(scene);
    this.image = scene.add.sprite(0, 0, key).setOrigin(ZED_SPRITE.origin.x, ZED_SPRITE.origin.y);
    this.image.setScale(ZED_SPRITE.scale);
    if (typeof Phaser !== 'undefined') { // crisp pixel art on all direction textures
      for (const st of ['Idle', ...Object.values(ZED_POSES).map((q) => q.state)]) for (const d of DIRS) { const k = zedTextureKey(st, d); if (scene.textures.exists(k)) scene.textures.get(k).setFilter(Phaser.Textures.FilterMode.NEAREST); }
    }
    this.base = { sx: ZED_SPRITE.scale, sy: ZED_SPRITE.scale };
    this.t = 0;
    this._anim = null;
    this._wasDead = false;
  }

  /** Call every render. zed = Zed instance; feetX/feetY world position of the feet. */
  update(zed, dt, feetX, feetY, depth) {
    this.t += dt;
    const m = zed.machine;
    const facing = zed.facing;
    const dir = facing < 0 ? ZED_SPRITE.dir.left : ZED_SPRITE.dir.right;
    const grounded = zed.sprite.body.blocked.down || zed.sprite.body.touching.down;
    const stateKey = m.state === 'attack' && m.moveId ? m.moveId : hitStateKey(m.state, zed.hitKind);
    if (this._wasDead && !zed.dead) this._anim = null; // revived (retry): force the next clip to restart
    this._wasDead = !!zed.dead;
    const carry = zed.dead || zed.rage?.isActive ? null : carryState(zed.carrying, m.state); // rage hides the carry look (zed.carrying itself is untouched)
    const dir8 = zed.dir8 ?? dir;
    const animKey = (zed.dead ? [`zed.dead.${dir}`, 'zed.dead'] : zedClipKeys({ state: m.state, stateKey, dir, dir8, carrying: zed.carrying, raging: !!zed.rage?.isActive })).find((k) => this.scene.anims.exists(k));
    const img = this.image;
    img.setPosition(feetX, feetY).setDepth(depth);
    if (animKey) { // real frames available: let them drive; keep tint/alpha only
      const animTag = `${animKey}|${zed.dead ? 'dead' : ''}|${m.state === 'attack' ? m.moveId : ''}`; // chained attacks restart the clip
      if (zed.dead && !grounded) { // killed in the air: hold the first death frame until he lands, then fall
        img.stop(); img.setTexture(zedFrameKey('dead', dir, 0)); this._anim = null;
      } else if (this._anim !== animTag) {
        // carry clips share a gait across directions: keep the frame index when only the direction changed
        const keepFrame = carry && this._carryTag === carry ? Number(String(img.anims.currentFrame?.textureKey ?? '').split('.').pop()) || 0 : 0;
        img.play(keepFrame ? { key: animKey, startFrame: keepFrame } : animKey); this._anim = animTag;
      }
      this._carryTag = carry;
      const clip = ZED_ANIMS.find((a) => animKey.startsWith(`zed.${a.state}.`));
      const fi = Number(String(img.anims.currentFrame?.textureKey ?? img.texture.key).split('.').pop());
      const clipDir = clip?.dirs ? animKey.slice(`zed.${clip.state}.`.length) || dir : dir; // key's own dir (dir8, or east/west on fallback)
      img.setOrigin(ZED_SPRITE.origin.x, clipOriginY(clip, clipDir, fi));
      img.setScale(this.base.sx, this.base.sy).setPosition(feetX, feetY).setAngle(0);
      if (m.state === 'attack' && clip) { // stretch the punch/kick over the move: wind-up, snap on the active frames, ease out
        const mv = MOVES[m.moveId];
        if (mv) img.anims.timeScale = (clip.frames / clip.fps) / ((mv.startup + mv.active + mv.recovery * (m.moveId.startsWith('heavy') ? 0.5 : 1)) / 60);
      } else if (m.state === 'parry' && clip) { // one pass across the whole parry
        img.anims.timeScale = (clip.frames / clip.fps) / (PARRY.duration / 60);
      } else if (m.state === 'pickup' && clip) { // one pass across the whole pick-up
        img.anims.timeScale = (clip.frames / clip.fps) / (PICKUP_POSE.duration / 60);
      } else if (m.state === 'hitstun' && clip) { // one pass (Taking_Punch or the uppercut launch clip) across the whole hitstun (length captured when the hit lands)
        if (this._hitTotal == null || m.hitstunLeft > this._hitLeft) this._hitTotal = m.hitstunLeft;
        this._hitLeft = m.hitstunLeft;
        img.anims.timeScale = (clip.frames / clip.fps) / (Math.max(1, this._hitTotal) / 60);
      } else if (m.state === 'slammed' && clip) { // fall backwards over slamFallMs, then lie on the last frame
        img.anims.timeScale = (clip.frames / clip.fps) / (GRAB_CONFIG.slamFallMs / 1000);
      } else if (m.state === 'getup' && clip) { // rise over the get-up
        img.anims.timeScale = (clip.frames / clip.fps) / (GRAB_CONFIG.getupMs / 1000);
      } else img.anims.timeScale = 1;
      if (m.state !== 'hitstun') this._hitTotal = null;
    } else {
      if (this._anim) { img.stop(); this._anim = null; img.setOrigin(ZED_SPRITE.origin.x, ZED_SPRITE.origin.y); }
      const pose = ZED_POSES[m.state];
      let tk = pose && zedTextureKey(pose.state, dir);
      if (!tk || !this.scene.textures.exists(tk)) { tk = zedTextureKey('Idle', dir); img.setOrigin(ZED_SPRITE.origin.x, ZED_SPRITE.origin.y); }
      else img.setOrigin(ZED_SPRITE.origin.x, pose.originY);
      if (img.texture.key !== tk && this.scene.textures.exists(tk)) img.setTexture(tk);
    }
    const p = zedPose({ state: m.state, phase: m.phase, moveId: m.moveId, t: this.t, grounded,
      vy: zed.sprite.body.velocity.y, dead: zed.dead, facing });
    if (!animKey) {
      img.setScale(this.base.sx * p.sx, this.base.sy * p.sy);
      img.setPosition(feetX + p.ox, feetY + p.oy).setAngle(p.angle);
    } else if (m.state === 'attack' && m.moveId !== 'airkick' && m.moveId !== 'airheavy' && m.moveId !== 'rageAirKick') img.x = feetX + punchLunge(m, facing); // weight shift: lean back, step into the hit
    img.setAlpha(animKey && (zed.dead || m.state === 'slammed') ? 1 : p.alpha); // the death clip is drawn at full alpha
    if (animKey && (m.state === 'hitstun' || m.state === 'slammed')) img.clearTint(); // the clip shows the hit; no solid-white flash over it
    else if (animKey && m.state === 'attack' && p.tintFill == null) img.clearTint();
    else if (p.tintFill != null) img.setTintFill(p.tintFill);
    else if (p.tint != null) img.setTint(p.tint);
    else img.clearTint();
  }

  destroy() { this.image.destroy(); }
}
