// Zed's electrified look after a Copper Fang taser hit: cyan/white flicker on his sprite plus crackling arcs round the body.
// Phaser Graphics + tint only, no assets. Spec: design/art/zed-shock.md. Zed's hit clip keeps playing underneath.
import { SHOCK, shockDuration, shockState, arcPoints, isShockHit } from './zedShockData.js';
import { EVENTS } from '../shared/events.js';
import { PLAYER_ID } from '../shared/combatData.js';

export class ZedShockFx {
  /** @param o { events, getAttackerSkin: (id) => string|null, getImage: () => Phaser.GameObjects.Sprite, reduceFlash: () => boolean } */
  constructor(scene, { events, getAttackerSkin, getImage, reduceFlash = () => false }) {
    this.scene = scene; this.events = events; this.getAttackerSkin = getAttackerSkin; this.getImage = getImage; this.reduceFlash = reduceFlash;
    this.g = scene.add.graphics().setDepth(SHOCK.depth);
    this.t = 0; this.total = 0; this.active = false;
    this._onDmg = (d) => {
      if (d.targetId !== PLAYER_ID || !d.landed) return;
      if (!isShockHit(this.getAttackerSkin(d.attackerId), d.amount)) return;
      this.t = 0; this.total = shockDuration(d.hitstun); this.active = true;
    };
    events.on(EVENTS.DAMAGE_APPLIED, this._onDmg);
  }

  reset() { this.active = false; this.g.clear(); }
  destroy() { this.events.off(EVENTS.DAMAGE_APPLIED, this._onDmg); this.g.destroy(); }

  /** Call after Zed's sprite has been updated for the frame, so the tint and jitter win. */
  update(dtMs) {
    this.g.clear();
    if (!this.active) return;
    this.t += dtMs;
    const s = shockState(this.t, this.total, this.reduceFlash());
    const img = this.getImage();
    if (!s) { this.active = false; return; }
    if (s.tintFill) img.setTintFill(s.tint); else img.setTint(s.tint);
    img.x += s.jitterX;
    const b = img.getBounds();
    const box = { x: b.x + b.width * 0.2, y: b.y + b.height * 0.1, w: b.width * 0.6, h: b.height * 0.85 };
    for (let i = 0; i < s.arcs; i++) {
      const pts = arcPoints(box, s.step, i);
      for (const [w, col, a] of [[5, SHOCK.cyan, 0.35 * s.fade], [2, SHOCK.white, 0.95 * s.fade]]) {
        this.g.lineStyle(w, col, a).beginPath().moveTo(pts[0][0], pts[0][1]);
        for (let k = 1; k < pts.length; k++) this.g.lineTo(pts[k][0], pts[k][1]);
        this.g.strokePath();
      }
    }
  }
}
