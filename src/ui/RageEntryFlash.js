// Rage entry flash + whole-world freeze (design/art/rage-entry-flash.md). The scene calls start() on RAGE_EVENTS.ACTIVATED and
// tick(realDt) every frame; while `frozen` it skips its own simulation. Overlay lives in the Arena scene (scrollFactor 0), so the
// HudScene stays on top, visible and unshaken. Everything animates on REAL time via tick(), never via scene tweens or time scale.
import { RAGE_ENTRY_FX as C } from '../player/rageConfig.js';
import { FONTS } from '../config/assetKeys.js';
import { RAGE_COPY } from './rageHudCopy.js';
import { entryVisual, createRageFreeze, lineBurst, wedgePoints } from './rageEntryFxData.js';

const VIGNETTE_KEY = 'fx.rage.entry.vignette';
const DEPTH = 5000; // above world sprites (depth = feet y), below HudScene (a separate scene drawn after this one)

export default class RageEntryFlash {
  /**
   * @param scene   the ArenaScene
   * @param opts    { getAnchor() -> {x,y} Zed's screen position, reduceFlash() -> bool, shake(ms, intensity),
   *                  onFreeze(), onThaw() }  (world pause/resume stays in the scene)
   */
  constructor(scene, opts) {
    this.scene = scene; this.o = opts;
    this.clock = createRageFreeze();
    this.objs = null;
  }

  get frozen() { return this.clock.active; }

  /** Begin the effect. Ignored (returns false) while one is already running. */
  start() {
    const reduced = !!this.o.reduceFlash();
    if (!this.clock.start(reduced)) return false;
    this.reduced = reduced;
    this._build();
    this.o.onFreeze();
    if (!reduced) this.o.shake(C.shakeMs, C.shakeIntensity);
    this._draw();
    return true;
  }

  /** Advance with REAL delta ms. Returns true on the frame the freeze ends (the scene resumes this same frame). */
  tick(dt) {
    if (!this.clock.active) return false;
    const ended = this.clock.tick(dt);
    if (ended) { this._thaw(); return true; }
    this._draw();
    return false;
  }

  /** Stop immediately (knockout, round end, retry, shutdown): objects destroyed, world thawed. Safe to call any time. */
  cancel() { if (this.clock.cancel()) this._thaw(); else this._destroyObjs(); }
  destroy() { this.cancel(); }

  _thaw() { this._destroyObjs(); try { this.o.onThaw(); } catch (e) { /* scene already torn down */ } }

  _destroyObjs() {
    if (!this.objs) return;
    for (const o of Object.values(this.objs)) o?.destroy?.();
    this.objs = null;
  }

  _build() {
    const s = this.scene, cam = s.cameras.main, w = cam.width, h = cam.height;
    this._destroyObjs();
    this._vignetteTexture(256);
    const mk = (o) => o.setScrollFactor(0).setDepth(DEPTH);
    const over = 80; // overscan so camera shake never shows an edge
    const o = {};
    o.flash = mk(s.add.rectangle(w / 2, h / 2, w + over * 2, h + over * 2, C.colors.red, 0)).setDepth(DEPTH);
    if (!this.reduced && s.textures.exists(VIGNETTE_KEY)) o.vignette = mk(s.add.image(w / 2, h / 2, VIGNETTE_KEY)).setDisplaySize(w + over * 2, h + over * 2).setAlpha(0).setDepth(DEPTH + 1);
    o.lines = mk(s.add.graphics()).setAlpha(0).setDepth(DEPTH + 2); // drawn once at design size around (0,0); moved/scaled per frame
    for (const wedge of lineBurst(this.reduced)) {
      const p = wedgePoints(wedge);
      o.lines.fillStyle(wedge.color, 1).fillTriangle(p[0], p[1], p[2], p[3], p[4], p[5]);
    }
    o.title = mk(s.add.text(w / 2, h / 2, RAGE_COPY.entryTitle, {
      fontFamily: FONTS.button, fontSize: '140px', color: '#FFD24A', stroke: '#2E1F16', strokeThickness: 10,
    })).setOrigin(0.5).setAngle(-2.5).setShadow(7, 7, '#A8402E', 0, true, true).setAlpha(0).setDepth(DEPTH + 3);
    this.objs = o;
  }

  // Pre-baked radial vignette: transparent centre, Rage Ember at the edges (peak 45 percent, scaled by the flash).
  _vignetteTexture(size) {
    const tm = this.scene.textures;
    if (tm.exists(VIGNETTE_KEY)) return;
    try {
      const tex = tm.createCanvas(VIGNETTE_KEY, size, size), ctx = tex.getContext();
      const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.18, size / 2, size / 2, size * 0.72);
      g.addColorStop(0, 'rgba(122,46,26,0)'); g.addColorStop(1, 'rgba(122,46,26,1)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, size, size); tex.refresh();
    } catch (e) { /* no canvas: skip the vignette */ }
  }

  _draw() {
    const o = this.objs; if (!o) return;
    const cam = this.scene.cameras.main, w = cam.width, h = cam.height;
    const v = entryVisual(this.clock.elapsed, this.reduced);
    const a = this.o.getAnchor() || { x: w / 2, y: h / 2 };
    o.flash.setFillStyle(C.colors.red, v.flash);
    o.vignette?.setAlpha(v.vignette);
    if (o.lines) {
      const k = Math.max(w / 1280, h / 720) * v.linesScale; // expands outward from Zed
      const j = this.reduced ? 0 : C.linesJitterPx * (v.linesScale > 1.15 ? 1 : 0);
      o.lines.setPosition(a.x + (Math.random() * 2 - 1) * j, a.y + (Math.random() * 2 - 1) * j).setScale(k).setAlpha(v.linesAlpha);
    }
    const ts = Math.min(w / 1280, h / 720) * v.titleScale;
    o.title.setPosition(a.x, Math.max(110, a.y - 120)).setScale(ts).setAlpha(v.titleAlpha);
  }
}
