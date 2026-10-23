// Phaser view for enemy health bars, hit flash/stagger and hit particles (hit-feedback-spec.md section 7).
// Consumes the shared events only: `hit-request` (cached per attacker, for position/facing/overlap centre)
// and `damage-applied` (targetId, attackerId, amount, hpAfter, knockback). Does not redefine either.
//
// Gap in the contract: `damage-applied` carries no attacker position/facing or hit type. We read both from the
// preceding `hit-request` (origin, facing, hitbox) keyed by attackerId, fall back to the knockback sign, and derive
// light/heavy/ko from amount + hpAfter. No combat change needed.
import { EVENTS } from '../shared/events.js';
import { PLAYER_ID } from '../shared/combatData.js';
import { worldRect, rectsOverlap } from '../combat/hitResolver.js';
import {
  ENEMY_BAR, ENEMY_FLASH_MS, STAGGER, HIT_PARTICLES as P, REDUCE_FLASH_TINT,
  createBarState, barOnDamage, barUpdate, barView, barFillArea, barPosition, telegraphIconBottomY,
  hitClass, hitDir, buildHit, capParticles, stepParticle, renderModel, starPoints, slashPoints, sparkTrailColor, flashAllowed,
} from './hitFeedbackData.js';

export const BAR_DEPTH = 5100;       // above characters (depth = y) and the swing overlay, below sparks (6000)
export const SHAPE_DEPTH = P.layerDepth.shapes; // 5050: flash shapes above characters, BELOW the bar so they never cover it
export const PARTICLE_DEPTH = P.layerDepth.debris; // 5800: debris above the bar

export class EnemyHitFx {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} events shared emitter (game.events)
   * @param {object} o { getEnemy(id) -> grunt|undefined, finisherDamage, reduceFlash: () => bool }
   */
  constructor(scene, events, { getEnemy, maxHp, hurtbox, heavyAt = 12, finisherAt = Infinity, reduceFlash = () => false }) {
    this.scene = scene; this.events = events; this.getEnemy = getEnemy;
    this.maxHp = maxHp; this.hurtbox = hurtbox; this.heavyAt = heavyAt; this.finisherAt = finisherAt; this.reduceFlash = reduceFlash;
    this.bars = new Map();      // id -> { s: barState, topY }
    this.flash = new Map();     // id -> { left, tint }
    this.stagger = new Map();   // id -> { left, total }
    this.lastReq = new Map();   // attackerId -> hit-request
    this.parts = [];
    this.clockMs = 0; this.lastCoreMs = null; // rate limit clock (real time)
    this.barGfx = scene.add.graphics().setDepth(BAR_DEPTH);
    this.shapeGfx = scene.add.graphics().setDepth(SHAPE_DEPTH);
    this.partGfx = scene.add.graphics().setDepth(PARTICLE_DEPTH);
    this._onReq = (r) => this.lastReq.set(r.attackerId, r);
    // Queued: the resolver emits damage-applied from inside its own hit-request handler, which can run before ours
    // caches the request. Processing in update() guarantees the matching request is cached.
    this.pending = [];
    this._onDmg = (d) => this.pending.push(d);
    events.on(EVENTS.HIT_REQUEST, this._onReq);
    events.on(EVENTS.DAMAGE_APPLIED, this._onDmg);
  }

  onDamage(d) {
    if (d.targetId === PLAYER_ID || d.amount <= 0) return;
    const g = this.getEnemy(d.targetId);
    if (!g) return;
    const killed = d.hpAfter <= 0;
    const cls = hitClass(d.amount, killed, this.heavyAt, this.finisherAt);
    const reduce = this.reduceFlash();
    let bar = this.bars.get(d.targetId);
    if (!bar) { bar = { s: createBarState(this.maxHp), topY: g.y - 100 }; this.bars.set(d.targetId, bar); }
    barOnDamage(bar.s, d.hpAfter, { killed, reduceFlash: reduce });

    const flashMs = ENEMY_FLASH_MS[cls === 'ko' ? 'heavy' : cls] ?? ENEMY_FLASH_MS.light;
    this.flash.set(d.targetId, { left: flashMs, tint: reduce ? REDUCE_FLASH_TINT : 0xffffff, fill: !reduce });
    this.stagger.set(d.targetId, { left: STAGGER.returnMs, total: STAGGER.returnMs });

    const req = this.lastReq.get(d.attackerId);
    const attackerX = req ? req.origin.x : (d.knockback > 0 ? g.x - 1 : g.x + 1); // knockback is signed away from attacker
    const dir = hitDir(g.x, attackerX, req ? req.facing : (d.knockback < 0 ? -1 : 1));
    this.spawnHit(this._contact(g, req), dir, cls, reduce, g.y);
  }

  // Overlap centre of hitbox and hurtbox; fallback: target centre x, y - 60% of hurtbox height.
  _contact(g, req) {
    if (req) {
      const a = worldRect(req.hitbox, req.origin, req.facing);
      const b = worldRect(this.hurtbox, g, g.facing);
      if (rectsOverlap(a, b)) {
        const x0 = Math.max(a.x, b.x), x1 = Math.min(a.x + a.w, b.x + b.w);
        const y0 = Math.max(a.y, b.y), y1 = Math.min(a.y + a.h, b.y + b.h);
        return { x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
      }
    }
    return { x: g.x, y: g.y - this.hurtbox.h * 0.6 };
  }

  /** floorY: target feet y (flakes and shards land/bounce there, KO dust spawns there). */
  spawnHit(pt, dir, cls, reduce, floorY = pt.y + 60) {
    const allowFlash = flashAllowed(this.clockMs, this.lastCoreMs);
    if (!reduce && allowFlash) this.lastCoreMs = this.clockMs;
    const made = buildHit(cls, pt, dir, floorY, { reduce, allowFlash });
    const { live, incoming } = capParticles(this.parts, made, P.cap);
    this.parts = live.concat(incoming);
  }

  /** True while the enemy should render white (or steel under reduce-flash). Returns tint colour or null. */
  flashTint(id) { const f = this.flash.get(id); return f && f.left > 0 ? f : null; }

  /** Multipliers for sprite scale during stagger, or {x:1,y:1}. Eases back over STAGGER.returnMs. */
  staggerScale(id) {
    const s = this.stagger.get(id);
    if (!s || s.left <= 0) return { x: 1, y: 1 };
    const k = s.left / s.total;
    return { x: 1 + (STAGGER.scaleX - 1) * k, y: 1 + (STAGGER.scaleY - 1) * k };
  }

  /** Y for the bottom of the telegraph icon (bar top - 4px) or null when this enemy has no bar. */
  telegraphBottomY(id) {
    const bar = this.bars.get(id);
    return bar ? telegraphIconBottomY(bar.topY) : null;
  }

  /** views: Map id -> { body } (sprite whose top defines the body top). dtMs real time. */
  update(dtMs, views) {
    for (const d of this.pending.splice(0)) this.onDamage(d);
    for (const [id, f] of this.flash) { f.left -= dtMs; if (f.left <= 0) this.flash.delete(id); }
    for (const [id, s] of this.stagger) { s.left -= dtMs; if (s.left <= 0) this.stagger.delete(id); }

    const g = this.barGfx; g.clear();
    const area = barFillArea(), [W, H] = ENEMY_BAR.size, bp = ENEMY_BAR.borderPx + ENEMY_BAR.padPx;
    for (const [id, bar] of this.bars) {
      const enemy = this.getEnemy(id), v = views.get(id);
      if (!enemy || !v) { this.bars.delete(id); continue; }
      barUpdate(bar.s, dtMs);
      const body = v.body;
      const spriteTop = body.y - body.displayHeight * body.originY; // sprite body top, not the hitbox
      const pos = barPosition(enemy.x, spriteTop);
      bar.topY = pos.y;
      const m = barView(bar.s);
      if (m.alpha <= 0.001) continue;
      const cx = pos.x + W / 2, cy = pos.y + H / 2;
      const X = (x) => cx + (x - cx) * m.scale, Y = (y) => cy + (y - cy) * m.scale; // pulse about the centre
      const rect = (c, x, y, w, h, a = m.alpha) => { if (w > 0) g.fillStyle(c, a).fillRect(X(x), Y(y), w * m.scale, h * m.scale); };
      rect(ENEMY_BAR.border, pos.x, pos.y, W, H);
      rect(ENEMY_BAR.bg, pos.x + ENEMY_BAR.borderPx, pos.y + ENEMY_BAR.borderPx, W - ENEMY_BAR.borderPx * 2, H - ENEMY_BAR.borderPx * 2);
      // 1px bevel highlight, top and left, just inside the border
      rect(ENEMY_BAR.bevel, pos.x + ENEMY_BAR.borderPx, pos.y + ENEMY_BAR.borderPx, W - ENEMY_BAR.borderPx * 2, 1);
      rect(ENEMY_BAR.bevel, pos.x + ENEMY_BAR.borderPx, pos.y + ENEMY_BAR.borderPx, 1, H - ENEMY_BAR.borderPx * 2);
      const fx = pos.x + bp, fy = pos.y + bp;
      rect(ENEMY_BAR.drain.color, fx, fy, area.w * m.drain, area.h);
      const fw = area.w * m.frac;
      rect(m.flashing ? ENEMY_BAR.flashColor : m.fill, fx, fy, fw, area.h);
      if (!m.flashing) rect(m.fillTop, fx, fy, fw, 1);
    }

    this.clockMs += dtMs;
    const pg = this.partGfx; pg.clear();
    const sg = this.shapeGfx; sg.clear();
    this.parts = this.parts.filter((p) => stepParticle(p, dtMs));
    for (const p of this.parts) {
      const m = renderModel(p);
      if (!m) continue;
      if (p.kind === 'core') sg.fillStyle(m.color, m.alpha).fillCircle(p.x, p.y, m.r);
      else if (p.kind === 'ring') sg.lineStyle(m.width, m.color, m.alpha).strokeCircle(p.x, p.y, m.r);
      else if (p.kind === 'slash') this._slash(sg, p, m);
      else if (p.kind === 'star') this._star(sg, p, m);
      else this._debris(pg, p, m);
    }
  }

  _slash(g, p, m) {
    if (m.thick <= 0.05) return;
    const pts = slashPoints(p, m.len, m.thick);
    g.fillStyle(m.fill, m.alpha).fillPoints(pts, true);
    if (m.outline != null) g.lineStyle(m.outlinePx, m.outline, m.alpha).strokePoints(pts, true);
  }

  _star(g, p, m) {
    const pts = starPoints(p, m.scale);
    g.fillStyle(m.back.fill, m.back.alpha).fillPoints(pts, true);
    if (m.back.outline != null && m.back.alpha > 0) g.lineStyle(m.back.outlinePx, m.back.outline, m.back.alpha).strokePoints(pts, true);
    if (m.front) g.fillStyle(m.front.fill, m.front.alpha).fillPoints(starPoints(p, m.scale, m.front.radiusRatio), true);
  }

  _debris(pg, p, m) {
    if (m.alpha <= 0) return;
    if (p.kind === 'spark') {
      const tr = P.sparks.trail, chain = [{ x: p.x, y: p.y }, ...p.hist];
      for (let i = 0; i < chain.length - 1; i++) {
        const w = Math.max(1, p.thick * (1 - i / tr.samples)); // tapers 3 -> ~1
        pg.lineStyle(w, sparkTrailColor(p.t, i, p.skipWhite), m.alpha).lineBetween(chain[i].x, chain[i].y, chain[i + 1].x, chain[i + 1].y);
      }
      pg.save(); pg.translateCanvas(p.x, p.y); pg.rotateCanvas(Math.atan2(p.vy, p.vx));
      pg.fillStyle(m.color, m.alpha).fillRect(-m.len / 2, -m.thick / 2, m.len, m.thick); pg.restore();
    } else if (p.kind === 'shard' || p.kind === 'flake') {
      const long = p.size, short = p.kind === 'shard' ? p.size / P.shards.aspect : p.size;
      pg.save(); pg.translateCanvas(p.x, p.y); pg.rotateCanvas((p.rot * Math.PI) / 180);
      pg.fillStyle(p.color, m.alpha);
      if (p.tri) pg.fillTriangle(-long / 2, short / 2, long / 2, short / 2, 0, -short / 2 - short / 2);
      else pg.fillRect(-long / 2, -short / 2, long, short);
      pg.restore();
    } else if (p.kind === 'smoke') {
      pg.fillStyle(p.color, m.alpha).fillCircle(p.x, p.y, m.r);
      pg.fillStyle(p.color, m.alpha / 2).fillCircle(p.x, p.y, m.r * 0.6);
    } else if (p.kind === 'groundDust') {
      pg.fillStyle(P.groundDust.color, m.alpha).fillCircle(p.x, p.y, m.r);
    }
  }

  remove(id) { this.bars.delete(id); this.flash.delete(id); this.stagger.delete(id); }

  destroy() {
    this.events.off(EVENTS.HIT_REQUEST, this._onReq);
    this.events.off(EVENTS.DAMAGE_APPLIED, this._onDmg);
    this.barGfx.destroy(); this.shapeGfx.destroy(); this.partGfx.destroy();
    this.parts.length = 0; this.bars.clear();
  }
}
