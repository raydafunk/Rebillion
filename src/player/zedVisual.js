// Zed's on-screen visual: sprite selection + procedural stand-in animation.
// zedPose() is pure (testable without Phaser). ZedVisual applies it to an image.
// Real frame animations: register Phaser anims named `zed.<state>` (e.g. zed.run,
// zed.attack) or `zed.<moveId>` (zed.light1); ZedVisual plays them when they exist
// and skips the procedural pose. See registerZedAnimations().

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
// Metadata folder/anim names are case-sensitive on disk: "Idle" vs "walk".
export const ZED_ANIMS = [
  // originY: frames are 64x64 canvases with feet at row ~54 (idle: 48x48, feet at 45), so the
  // feet anchor is (54 + 1 + 2px ground gap)/64 to match idle's foot line on the shadow.
  { state: 'run', folder: 'walk', anim: 'Walking', frames: 8, fps: 11, originY: 57 / 64 },
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
    scene.anims.create({ key, frames: Array.from({ length: a.frames }, (_, i) => ({ key: zedFrameKey(a.state, d, i) })), frameRate: a.fps, repeat: -1 });
  }
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
    case 'idle': { const b = Math.sin(t / 260); p.sy = 1 + 0.02 * b; p.sx = 1 - 0.015 * b; break; }
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
    case 'dodge': p.alpha = 0.5; p.sx = 1.1; p.sy = 0.9; p.angle = 8 * f; break;
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
      if (this._anim !== animKey) { img.play(animKey); this._anim = animKey; }
      const clip = ZED_ANIMS.find((a) => animKey.startsWith(`zed.${a.state}`));
      img.setOrigin(ZED_SPRITE.origin.x, clip?.originY ?? ZED_SPRITE.origin.y);
      img.setScale(this.base.sx, this.base.sy).setPosition(feetX, feetY).setAngle(0);
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
    }
    img.setAlpha(p.alpha);
    if (p.tintFill != null) img.setTintFill(p.tintFill);
    else if (p.tint != null) img.setTint(p.tint);
    else img.clearTint();
  }

  destroy() { this.image.destroy(); }
}
