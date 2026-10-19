// Zed's on-screen visual: sprite selection + procedural stand-in animation.
// zedPose() is pure (testable without Phaser). ZedVisual applies it to an image.
// Real frame animations: register Phaser anims named `zed.<state>` (e.g. zed.run,
// zed.attack) or `zed.<moveId>` (zed.light1); ZedVisual plays them when they exist
// and skips the procedural pose. See registerZedAnimations().

import { MOVES, DODGE, PARRY } from './moves.js';

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
  // Frames are 64x64 canvases (not 48): lowest opaque row is 52-54 (avg ~53) vs idle's 45 on 48.
  // Feet anchor = (53.5 + 1 + 2px ground gap)/64, same gap idle has (45+1+2 = 48/48).
  { state: 'run', folder: 'Running', anim: 'running', frames: 8, fps: 13, originY: 56.5 / 64, repeat: -1 },
  // Cross punch plays once for every attack move (light/heavy) and holds its last frame until the move ends.
  // 80x80 canvas, character same pixel size as idle; lowest opaque row 61 -> (61 + 1 + 2px gap)/80.
  { state: 'attack', folder: 'fighting_pose', anim: 'Cross_Punch', frames: 6, fps: 24, originY: 64 / 80, repeat: 0 },
  // High kick is the 3rd light hit (finisher); zed.light3.<dir> takes priority over the generic zed.attack clip.
  // 80x80 canvas, same framing as the punch (standing foot rows 58-63).
  { state: 'light3', folder: 'fighting_pose_2', anim: 'High_Kick', frames: 7, fps: 24, originY: 64 / 80, repeat: 0 },
  // Dodge sway: 9 frames, 68x68 canvas, lowest opaque row 55 -> (55 + 1 + 2px gap)/68. Stretched over DODGE.duration below.
  { state: 'dodge', folder: 'Zed_a_young_street_dodge', anim: 'Zed_a_young_street_fighter_seen_in_side_profile_animations', frames: 9, fps: 15, originY: 58 / 68, repeat: 0 },
  // Parry reaction (T or M): 9 frames, 68x68 canvas (same framing as dodge; foot row unmeasured, assumed 58/68). Stretched over PARRY.duration.
  { state: 'parry', folder: 'Zed_parry_reaction_a', anim: 'Zed_parry_reaction_animation_triggered_when_hit._Q', frames: 9, fps: 15, originY: 58 / 68, repeat: 0 },
];
// Static single-pose textures shown for a machine state (rotations only, no frames yet).
// originY: Jumping PNG feet sit at row 46 vs idle's 45 (both 48x48), so lift 1 source px to share the idle foot line.
export const ZED_POSES = { jump: { state: 'Jumping', originY: 49 / 48 } };
export const zedFrameKey = (state, dir, i) => `zed.${state}.${dir}.${i}`;
export const zedAnimKey = (state, dir) => `zed.${state}.${dir}`;
export const zedFramePath = (a, dir, i) => `${a.folder}/animations/${a.anim}/${dir}/frame_${String(i).padStart(3, '0')}.png`;
const SIDE = Object.values(ZED_SPRITE.dir);

/** Queue rotation PNGs per state, plus east/west animation frames (call from scene.preload). */
export function loadZedSprites(scene, states = ['Idle']) {
  for (const s of states) {
    for (const d of DIRS) scene.load.image(zedTextureKey(s, d), `${ZED_SPRITE.base}${s}/rotations/${d}.png`);
  }
  for (const a of ZED_ANIMS) for (const d of SIDE) for (let i = 0; i < a.frames; i++) {
    scene.load.image(zedFrameKey(a.state, d, i), ZED_SPRITE.base + zedFramePath(a, d, i));
  }
}

/** Register `zed.<state>.<dir>` anims (e.g. zed.run.east / zed.run.west). Idempotent; skips unloaded frames. */
export function registerZedAnimations(scene) {
  for (const a of ZED_ANIMS) for (const d of SIDE) {
    const key = zedAnimKey(a.state, d);
    if (scene.anims.exists(key) || !scene.textures.exists(zedFrameKey(a.state, d, 0))) continue;
    for (let i = 0; i < a.frames; i++) scene.textures.get(zedFrameKey(a.state, d, i)).setFilter?.(1); // NEAREST
    scene.anims.create({ key, frames: Array.from({ length: a.frames }, (_, i) => ({ key: zedFrameKey(a.state, d, i) })), frameRate: a.fps, repeat: a.repeat ?? -1 });
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
      const k = Math.max(-1, Math.min(1, -(s.vy ?? 0) / 520)); // 520 = |jumpVelocity|; +1 rising, -1 falling
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
    case 'block': p.tint = 0x88aaff; p.sx = 1.05; p.sy = 0.94; p.ox = -2 * f; break;
    case 'dodge': p.sx = 1.1; p.sy = 0.9; p.angle = 8 * f; break;
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
  }

  /** Call every render. zed = Zed instance; feetX/feetY world position of the feet. */
  update(zed, dt, feetX, feetY, depth) {
    this.t += dt;
    const m = zed.machine;
    const facing = zed.facing;
    const dir = facing < 0 ? ZED_SPRITE.dir.left : ZED_SPRITE.dir.right;
    const grounded = zed.sprite.body.blocked.down || zed.sprite.body.touching.down;
    const stateKey = m.state === 'attack' && m.moveId ? m.moveId : m.state;
    const animKey = [`zed.${stateKey}.${dir}`, `zed.${m.state}.${dir}`, `zed.${stateKey}`, `zed.${m.state}`].find((k) => this.scene.anims.exists(k));
    const img = this.image;
    img.setPosition(feetX, feetY).setDepth(depth);
    if (animKey) { // real frames available: let them drive; keep tint/alpha only
      const animTag = `${animKey}|${m.state === 'attack' ? m.moveId : ''}`; // chained attacks restart the clip
      if (this._anim !== animTag) { img.play(animKey); this._anim = animTag; }
      const clip = ZED_ANIMS.find((a) => animKey.startsWith(`zed.${a.state}.`));
      img.setOrigin(ZED_SPRITE.origin.x, clip?.originY ?? ZED_SPRITE.origin.y);
      img.setScale(this.base.sx, this.base.sy).setPosition(feetX, feetY).setAngle(0);
      if (m.state === 'attack' && clip) { // stretch the punch/kick over the move: wind-up, snap on the active frames, ease out
        const mv = MOVES[m.moveId];
        if (mv) img.anims.timeScale = (clip.frames / clip.fps) / ((mv.startup + mv.active + mv.recovery * (m.moveId.startsWith('heavy') ? 0.5 : 1)) / 60);
      } else if (m.state === 'dodge' && clip) { // play the sway exactly once across the whole dodge (duration is in 60 fps steps)
        img.anims.timeScale = (clip.frames / clip.fps) / (DODGE.duration / 60);
      } else if (m.state === 'parry' && clip) { // one pass across the whole parry
        img.anims.timeScale = (clip.frames / clip.fps) / (PARRY.duration / 60);
      } else img.anims.timeScale = 1;
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
    } else if (m.state === 'attack') img.x = feetX + punchLunge(m, facing); // weight shift: lean back, step into the hit
    img.setAlpha(p.alpha);
    if (animKey && m.state === 'attack' && p.tintFill == null) img.clearTint();
    else if (p.tintFill != null) img.setTintFill(p.tintFill);
    else if (p.tint != null) img.setTint(p.tint);
    else img.clearTint();
  }

  destroy() { this.image.destroy(); }
}
