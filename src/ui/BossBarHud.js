// Boss health bar for the end-of-level boss (Dugan). Spec: design/art/boss-health-bar.md. Maths and numbers: bossBarData.js.
// Owned by HudScene: it feeds show / onDamage / die / reset and calls update every frame.
import { FONTS } from '../config/assetKeys.js';
import { shakeScale } from '../shared/hitFeedback.js';
import { loadSettings } from './optionsData.js';
import {
  BAR, COL, FILL, HIT, INTRO, EDGE, RAGE, DEATH, REDUCED, BOSS_PROFILES,
  fillBand, fillColors, drainFrac, joltOffset, introState, pulse, rageMoment, deathState, fillX, readoutText, inRage,
} from './bossBarData.js';

const css = (c) => `#${c.toString(16).padStart(6, '0')}`;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

export default class BossBarHud {
  constructor(scene) {
    this.scene = scene;
    const D = BAR.depths;
    this.edge = scene.add.graphics().setDepth(D.edgePulse).setVisible(false);
    this.g = scene.add.graphics().setDepth(D.front).setVisible(false);
    this.top = scene.add.graphics().setDepth(D.particles).setVisible(false);
    const T = (family, size, color, ox, oy) => scene.add.text(0, 0, '', { fontFamily: family, fontSize: `${size}px`, color, stroke: css(COL.ink), strokeThickness: 4 })
      .setOrigin(ox, oy).setDepth(D.text).setVisible(false);
    this.nameT = T(FONTS.button, BAR.name.fontSize, css(COL.cream), 0, 0.5);
    this.epiT = T(FONTS.body, BAR.epithet.fontSize, css(COL.sand), 1, 0.5);
    this.readT = T(FONTS.body, BAR.readout.fontSize, css(COL.cream), 1, 0);
    this.tagT = T(FONTS.button, BAR.tag.fontSize, css(COL.ink), 0, 0.5);
    this.tagT.setStroke('#000000', 0);
    this.s = null; this.t = 0;
  }

  get visible() { return !!(this.s && !this.s.hidden); }

  /** A boss registered. `p` is the entity-registered payload ({id, maxHp, boss, bossProfile}). Returns false if it has no profile. */
  show(p) {
    const profile = BOSS_PROFILES[p.bossProfile];
    if (!profile) return false;
    let st = {}; try { st = loadSettings(globalThis.localStorage); } catch (e) { /* no storage: defaults */ }
    const maxHp = p.maxHp || profile.maxHpFallback;
    this.s = {
      id: p.id, profile, maxHp, hp: maxHp, frac: 1, t0: this.t, hidden: false,
      reduced: st.reducedMotion === true, flashLow: st.hitFlash === 'Low' || st.reducedMotion === true,
      shakeK: st.reducedMotion === true ? 0 : shakeScale(st.screenShake),
      band: 'high', prevBand: 'high', bandSince: -1e9,
      dFrom: 1, dSince: -1e9, lethal: false,
      joltPx: 0, joltAt: -1e9, flashUntil: 0, flashAt: -1e9,
      rageSince: null, deathSince: null, pieces: null, introShook: false, edgeFx: null, goldFx: null,
    };
    this.nameT.setText(profile.name); this.epiT.setText(profile.epithet); this.tagT.setText(BAR.tag.text);
    for (const o of [this.edge, this.g, this.top, this.nameT, this.epiT, this.readT]) o.setVisible(true);
    this.tagT.setVisible(false);
    return true;
  }

  /** The boss took damage. */
  onDamage(id, hpAfter, amount) {
    const s = this.s; if (!s || s.id !== id || s.deathSince != null || amount <= 0) return;
    const t = this.t - s.t0, prev = s.frac;
    s.hp = Math.max(0, hpAfter); s.frac = clamp01(s.hp / s.maxHp);
    const shown = drainFrac(s.dFrom, prev, t - s.dSince); // a new hit restarts the cream chunk from wherever it is now
    s.dFrom = Math.max(shown, prev); s.dSince = t; s.lethal = s.hp <= 0;
    const heavy = amount >= HIT.heavyAt;
    if (!s.reduced && t - s.joltAt >= HIT.joltMinGapMs) { s.joltPx = heavy ? HIT.joltPx.heavy : HIT.joltPx.light; s.joltAt = t; }
    if (t - s.flashAt >= HIT.flashRateLimitMs) { s.flashAt = t; s.flashUntil = t + (heavy ? HIT.flashMs.heavy : HIT.flashMs.light); }
    const band = fillBand(s.frac, s.profile.rageThreshold);
    if (band !== s.band) {
      const wasRage = inRage(prev, s.profile.rageThreshold);
      s.prevBand = s.band; s.band = band; s.bandSince = t;
      if (!wasRage && inRage(s.frac, s.profile.rageThreshold) && s.hp > 0) {
        s.rageSince = t;
        this._shake(RAGE.cameraShake.ms, RAGE.cameraShake.intensity);
        this._edge(RAGE.edgePulse.color, s.reduced ? REDUCED.edgePeak : RAGE.edgePulse.peakAlpha, s.reduced ? 60 : RAGE.edgePulse.inMs, s.reduced ? REDUCED.edgeMs : RAGE.edgePulse.outMs);
      }
    }
  }

  /** The boss died: drain, shatter, fade. */
  die(id) {
    const s = this.s; if (!s || s.id !== id || s.deathSince != null) return;
    const t = this.t - s.t0;
    s.deathSince = t; s.frac = 0; s.lethal = true;
    if (s.dFrom <= 0) s.dFrom = 0.02;
    s.dSince = Math.min(s.dSince, t);
    this._edge(COL.gold, DEATH.goldPulse.peakAlpha, 60, DEATH.goldPulse.ms);
  }

  /** Retry / level change: gone. */
  reset() {
    this.s = null;
    for (const o of [this.edge, this.g, this.top, this.nameT, this.epiT, this.readT, this.tagT]) o.setVisible(false);
    this.edge.clear(); this.g.clear(); this.top.clear();
  }

  _shake(ms, intensity) {
    const s = this.s; if (!s || !s.shakeK) return;
    const a = this.scene.scene.get('ArenaScene'), cam = a && a.cameras && a.cameras.main;
    if (cam) cam.shake(ms, intensity * s.shakeK, true);
  }

  _edge(color, peak, inMs, outMs) { if (this.s) this.s.edgeFx = { color, peak, inMs, outMs, at: this.t - this.s.t0 }; }

  update(time, delta) {
    this.t += delta;
    if (this.s) this._draw();
  }

  _hatch(g, x1, x2, y, h, step, color, alpha) {
    if (x2 <= x1) return;
    g.lineStyle(2, color, alpha);
    for (let sx = x1 - h; sx < x2; sx += step) {
      const ya = Math.max(y, y + sx + h - x2), yb = Math.min(y + h, y + sx + h - x1);
      if (ya < yb) g.lineBetween(sx + h - (ya - y), ya, sx + h - (yb - y), yb);
    }
  }

  _draw() {
    const s = this.s, g = this.g, now = this.t - s.t0, reduced = s.reduced;
    const it = now - INTRO.delayMs;
    g.clear(); this.edge.clear(); this.top.clear();
    if (s.hidden) return;
    if (it < 0) { for (const o of [this.nameT, this.epiT, this.readT, this.tagT]) o.setAlpha(0); return; }
    const I = introState(it);
    const dead = s.deathSince != null, ds = dead ? deathState(now - s.deathSince, reduced) : null;
    if (ds && ds.done) { s.hidden = true; for (const o of [this.nameT, this.epiT, this.readT, this.tagT]) o.setVisible(false); return; }

    // one-shot intro camera shake + edge pulse at the name slam
    if (!s.introShook && it >= INTRO.slam.atMs) {
      s.introShook = true;
      this._shake(INTRO.cameraShake.ms, INTRO.cameraShake.intensity);
      this._edge(INTRO.edgePulse.color, reduced ? REDUCED.edgePeak : INTRO.edgePulse.peakAlpha, INTRO.edgePulse.inMs, reduced ? REDUCED.edgeMs : INTRO.edgePulse.outMs);
    }

    const P = s.profile, thr = P.rageThreshold, rageNow = !dead && inRage(s.frac, thr);
    const jolt = reduced ? 0 : I.slamJolt + joltOffset(s.joltPx, now - s.joltAt);
    const wipeK = reduced ? 1 : Math.max(0.001, I.wipe);
    const baseA = reduced ? clamp01(it / REDUCED.introFadeMs) : 1;
    const barA = baseA * (dead ? (reduced ? ds.bar : 1) : 1);
    const textA = baseA * (dead ? ds.text : 1);
    const showBar = !(dead && ds.shattered && !reduced);
    g.setPosition(BAR.block.x + BAR.block.w / 2 - (BAR.block.x + BAR.block.w / 2) * wipeK, jolt).setScale(wipeK, 1).setAlpha(barA);

    const F = BAR.frame, fx = BAR.fill, x0 = F.x, y0 = F.y, W = F.w, H = F.h;
    const rm = s.rageSince != null ? rageMoment(now - s.rageSince, reduced) : null;
    const frame = (c, a = 1) => g.fillStyle(c, a);

    if (showBar) {
      // shadow, outline, steel body, end caps
      frame(BAR.shadow.color, BAR.shadow.alpha).fillRect(x0 + BAR.shadow.dx, y0 + BAR.shadow.dy, W, H);
      frame(COL.ink).fillRect(x0, y0, W, H);
      frame(COL.steel).fillRect(x0 + F.outline, y0 + F.outline, W - 2 * F.outline, H - 2 * F.outline);
      frame(COL.steelLight).fillRect(x0 + F.outline, y0 + F.outline, W - 2 * F.outline, 2);
      frame(COL.slate).fillRect(x0 + F.outline, y0 + H - F.outline - 2, W - 2 * F.outline, 2);
      for (let r = 0; r < 6; r++) { // left cap: hazard stripes
        frame(r % 2 ? COL.ink : COL.hazard).fillRect(x0 + F.outline, y0 + F.outline + r * ((H - 6) / 6), F.capW - F.outline, (H - 6) / 6);
      }
      frame(COL.steelLight).fillRect(x0 + W - F.capW, y0 + F.outline, F.capW - F.outline, H - 2 * F.outline);
      frame(COL.slate);
      g.fillCircle(x0 + W - F.capW / 2 - 1, y0 + 9, 2.5).fillCircle(x0 + W - F.capW / 2 - 1, y0 + H - 9, 2.5);
      // track
      frame(COL.ink).fillRect(fx.x - F.innerLine, fx.y - F.innerLine, fx.w + 2 * F.innerLine, fx.h + 2 * F.innerLine);
      frame(COL.gunmetal).fillRect(fx.x, fx.y, fx.w, fx.h);

      // fill
      const fillK = reduced ? 1 : I.fill, fillFrac = s.frac * fillK, ww = fx.w * fillFrac;
      const zoneEnd = fillX(thr);
      this._hatch(g, fx.x + ww, zoneEnd, fx.y, fx.h, 8, COL.hazard, 0.22); // danger zone shows what rage will cost
      const dShown = drainFrac(s.dFrom, s.frac, now - s.dSince, s.lethal);
      if (dShown > s.frac) frame(COL.cream).fillRect(fx.x + ww, fx.y, fx.w * Math.min(dShown, 1) * fillK - ww, fx.h);
      if (ww > 0) {
        const c = fillColors(s.prevBand, s.band, now - s.bandSince);
        frame(c.body).fillRect(fx.x, fx.y, ww, fx.h);
        frame(c.top).fillRect(fx.x, fx.y, ww, fx.topPx * 0.5);
        frame(c.bottom).fillRect(fx.x, fx.y + fx.h - fx.bottomPx, ww, fx.bottomPx);
        if (FILL[s.band].hatch) this._hatch(g, fx.x, fx.x + ww, fx.y, fx.h, 8, COL.ink, 0.22);
        if (now < s.flashUntil) frame(COL.sparkCream, s.flashLow ? 0.2 : 0.55).fillRect(fx.x, fx.y, ww, fx.h);
        frame(COL.sparkCream, 0.9).fillRect(fx.x + ww - 2, fx.y, 2, fx.h); // bright leading edge
        if (s.band === 'critical') {
          frame(COL.sparkCream, 0.9);
          g.fillTriangle(fx.x + ww - 2, fx.y, fx.x + ww - 8, fx.y, fx.x + ww - 2, fx.y + 6).fillTriangle(fx.x + ww - 2, fx.y + fx.h, fx.x + ww - 8, fx.y + fx.h, fx.x + ww - 2, fx.y + fx.h - 6);
        }
      }
      // quarter ticks
      for (let k = 1; k <= 3; k++) { const x = fillX(k * 0.25); frame(COL.ink, BAR.ticks.alpha).fillRect(x - 1, fx.y + fx.h - BAR.ticks.len, BAR.ticks.width, BAR.ticks.len); }
      // rage notch + skull tab
      const nx = fillX(thr), pk = pulse(now, RAGE.pulseHz, reduced);
      frame(rageNow ? COL.hazardLight : COL.gold, rageNow ? 0.7 + 0.3 * pk : 1).fillRect(nx - BAR.notch.width / 2, BAR.notch.y0, BAR.notch.width, BAR.notch.y1 - BAR.notch.y0);
      const sc = rm ? rm.tabScale : 1, tw = BAR.skullTab.w * sc, th = BAR.skullTab.h * sc, ty = BAR.skullTab.y;
      const tabCol = rageNow ? COL.hazard : COL.steel;
      g.fillStyle(COL.ink, I.tab).fillPoints([{ x: nx - tw / 2 - 2, y: ty - 1 }, { x: nx + tw / 2 + 2, y: ty - 1 }, { x: nx + tw / 2 - 3, y: ty + th + 2 }, { x: nx - tw / 2 + 3, y: ty + th + 2 }], true);
      g.fillStyle(tabCol, I.tab).fillPoints([{ x: nx - tw / 2, y: ty }, { x: nx + tw / 2, y: ty }, { x: nx + tw / 2 - 4, y: ty + th }, { x: nx - tw / 2 + 4, y: ty + th }], true);
      const sk = 0.38 * th; // tiny skull
      g.fillStyle(COL.cream, I.tab).fillCircle(nx, ty + th * 0.42, sk).fillRect(nx - sk * 0.55, ty + th * 0.42 + sk * 0.5, sk * 1.1, sk * 0.7);
      g.fillStyle(COL.ink, I.tab).fillCircle(nx - sk * 0.4, ty + th * 0.4, sk * 0.28).fillCircle(nx + sk * 0.4, ty + th * 0.4, sk * 0.28);

      // rage halo + crossing flash
      if (rageNow) {
        const hz = s.band === 'critical' ? RAGE.criticalPulseHz : RAGE.pulseHz, p = pulse(now, hz, reduced);
        for (let i = 0; i < RAGE.halo.offsets.length; i++) {
          const o = RAGE.halo.offsets[i], a = reduced ? REDUCED.staticHalo[i] : RAGE.halo.alphas[i] * (RAGE.halo.min + (RAGE.halo.max - RAGE.halo.min) * p);
          g.lineStyle(2, COL.hazard, a).strokeRect(x0 - o, y0 - o, W + 2 * o, H + 2 * o);
        }
      }
      if (rm && rm.flash > 0) frame(COL.sparkCream, rm.flash).fillRect(x0, y0, W, H);
    }

    // name plate (top-left of the block) with the epithet and readout beside the frame
    const T = BAR.plate, shk = rm ? rm.plateShake : 0, px = BAR.block.x + shk;
    const nameSc = reduced ? 1 : I.nameScale;
    const pw = Math.max(T.minW, this.nameT.width + T.textPadX);
    const plateA = (reduced ? baseA : I.plate) * (dead ? ds.text : 1);
    if (plateA > 0) {
      const ragePlate = rageNow || s.rageSince != null && !dead;
      const poly = (inset, w) => [{ x: px + inset, y: T.y + inset }, { x: px + w - inset, y: T.y + inset }, { x: px + w - T.lean - inset, y: T.y + T.h }, { x: px + inset, y: T.y + T.h }];
      g.fillStyle(ragePlate ? RAGE.plateBorder : COL.ink, plateA).fillPoints(poly(0, pw), true);
      g.fillStyle(ragePlate ? RAGE.plateFill : COL.slate, plateA).fillPoints(poly(T.border, pw), true);
      g.fillStyle(COL.steelLight, plateA);
      g.fillCircle(px + T.rivets[0], T.y + 15, T.rivetR).fillCircle(px + pw + T.rivets[1], T.y + 15, T.rivetR);
    }
    this.nameT.setPosition(px + T.textX, T.y + 15 + jolt).setScale(nameSc).setAlpha(reduced ? textA : I.nameAlpha * (dead ? ds.text : 1));
    this.epiT.setPosition(BAR.epithet.x + (reduced ? 0 : (1 - I.epithet) * INTRO.epithet.slidePx), BAR.epithet.y + jolt).setAlpha(textA * (reduced ? baseA : I.epithet));
    const critical = s.band === 'critical';
    this.readT.setVisible(P.readout === 'hp').setPosition(BAR.readout.x, BAR.readout.y + jolt).setAlpha(textA * (reduced ? baseA : I.readout))
      .setText(readoutText(s.frac * s.maxHp, s.maxHp, critical)).setColor(css(critical ? FILL.critical.top : COL.cream));

    // ENRAGED tag beside the plate
    if (rm && !dead) {
      const k = rm.tagK, sc = reduced ? 1 : 1 + (RAGE.tag.scaleFrom - 1) * (1 - k), tw = (this.tagT.width + 2 * BAR.tag.padX) * sc, th = BAR.tag.h * sc;
      const cx = px + pw + BAR.tag.gap + tw / 2, cy = BAR.tag.y + BAR.tag.h / 2 + jolt;
      g.fillStyle(COL.ink, k * textA).fillRect(cx - tw / 2 - 2, cy - th / 2 - 2, tw + 4, th + 4);
      g.fillStyle(COL.hazard, k * textA).fillRect(cx - tw / 2, cy - th / 2, tw, th);
      this.tagT.setVisible(true).setOrigin(0.5).setPosition(cx, cy).setScale(sc).setAlpha(k * textA);
    } else this.tagT.setVisible(false);

    // death: bar shatters into steel chunks
    if (dead && ds.shattered && !reduced) {
      if (!s.pieces) {
        s.pieces = [];
        for (let i = 0; i < DEATH.pieces; i++) {
          s.pieces.push({ x: x0 + (i + 0.5) * (W / DEATH.pieces), y: y0 + H / 2, vx: (Math.random() - 0.5) * 260, vy: -80 - Math.random() * 160, r: Math.random() * 6, vr: (Math.random() - 0.5) * 8, c: [COL.steel, COL.slate, COL.ink, COL.hazard][i % 4] });
        }
        s.shatterAt = now; this._shake(DEATH.cameraShake.ms, DEATH.cameraShake.intensity);
      }
      const dt = (now - s.shatterAt) / 1000, fade = 1 - clamp01((now - s.shatterAt) / (DEATH.totalMs - DEATH.shatterAtMs));
      for (const p of s.pieces) {
        const x = p.x + p.vx * dt, y = p.y + p.vy * dt + 700 * dt * dt;
        this.top.fillStyle(p.c, fade).fillRect(x - 8, y - 6, 16, 12);
      }
    }

    // screen-edge pulse (intro / rage / death)
    const e = s.edgeFx;
    if (e) {
      const te = now - e.at, a = te < e.inMs ? e.peak * (te / e.inMs) : e.peak * (1 - (te - e.inMs) / e.outMs);
      if (a > 0) {
        const w = this.scene.scale.width, h = this.scene.scale.height, sw = EDGE.widthPx / EDGE.strips;
        for (let i = 0; i < EDGE.strips; i++) {
          this.edge.fillStyle(e.color, a * (EDGE.alphas[i] / EDGE.alphas[0]));
          this.edge.fillRect(i * sw, 0, sw, h).fillRect(w - (i + 1) * sw, 0, sw, h);
        }
      } else s.edgeFx = null;
    }
  }

  destroy() { for (const o of [this.edge, this.g, this.top, this.nameT, this.epiT, this.readT, this.tagT]) o.destroy(); this.s = null; }
}
