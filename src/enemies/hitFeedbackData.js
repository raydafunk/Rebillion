// Grunt health bar + hit particle values and pure logic. No Phaser.
// Source of truth: design/art/hit-feedback-spec.md section 7 (7.4 config sketch). Hex values are spec-exact.
const hex = (s) => parseInt(s.slice(1), 16);

/** Bottom edge of the bar sits this many px above the top of the sprite body (assumes the 128px frame). */
export const BAR_OFFSET_ABOVE_SPRITE = 12;
/** Telegraph icon bottom = bar top - this (spec 7.1). */
export const TELEGRAPH_ABOVE_BAR_GAP = 4;
/** true: bar stays at idleAlpha once damaged. false: reverts to hiding after idleFadeAfterMs. */
export const BAR_STAYS_VISIBLE_AFTER_DAMAGE = true;

export const ENEMY_BAR = Object.freeze({
  size: [96, 10], // outer, frame included. Heavy enemies: [128, 12]
  borderPx: 2, padPx: 1,
  border: hex('#14181C'), bevel: hex('#7C8A96'), bg: hex('#2A3138'),
  // Enemy Critical #C9452F is deliberately NOT Telegraph Red #FF3B30.
  fill: Object.freeze({ high: hex('#4FB3D9'), mid: hex('#D9822B'), low: hex('#C9452F') }),
  fillTop: Object.freeze({ high: hex('#A9DDF0'), mid: hex('#F0A957'), low: hex('#E9715C') }),
  midAt: 0.5, lowAt: 0.25,
  drain: Object.freeze({ color: hex('#F4E6C8'), holdMs: 300, shrinkMs: 250 }),
  idleFadeAfterMs: 3000, idleAlpha: 0.35, lowHpMinAlpha: 0.6,
  showInMs: 80, idleFadeMs: 300, koFadeMs: 150,
  pulseScale: 1.12, pulseMs: 100, fillFlashMs: 66, flashColor: 0xffffff,
});

export const ENEMY_FLASH_MS = Object.freeze({ light: 66, heavy: 83, finisher: 100 });
export const REDUCE_FLASH_TINT = 0xbfc8cf;
export const STAGGER = Object.freeze({ scaleX: 1.08, scaleY: 0.94, returnMs: 80 });

// Hit particles v2 (spec 7.3 / 7.4). Per-class tables are keyed light/heavy/finisher/ko; two-key tables
// ({light, heavy}) apply 'heavy' to heavy, finisher and ko. Telegraph Red #FF3B30 and Enemy Critical #C9452F never appear here.
export const HIT_PARTICLES = Object.freeze({
  upBiasDeg: 10, cap: 60,
  cullOrder: Object.freeze(['flake', 'smoke', 'shard', 'groundDust']),
  layerDepth: Object.freeze({ shapes: 5050, debris: 5800 }),
  flashRateLimitMs: 120,
  ramp: Object.freeze([[0.0, hex('#FFFFFF')], [0.2, hex('#FFD24A')], [0.5, hex('#F58A2A')], [0.8, hex('#9C5A2E')]]),
  core: Object.freeze({ radius: { light: 10, heavy: 16, finisher: 22, ko: 28 }, color: hex('#FFFFFF'), alpha: 0.85,
    lifeMs: { light: 50, heavy: 60, finisher: 70, ko: 80 }, from: 0.5 }),
  ring: Object.freeze({ startRadius: 6, radius: { light: 28, heavy: 48, finisher: 64, ko: 72 },
    width: { light: [4, 1], heavy: [4, 1], finisher: [6, 1], ko: [6, 1] }, colors: [hex('#FFFFFF'), hex('#FFD24A')], switchAt: 0.4,
    lifeMs: { light: 140, heavy: 180, finisher: 220, ko: 260 } }),
  star: Object.freeze({ points: 8, innerRatio: 0.45, tipJitter: [0.8, 1.15], tiltDeg: 15,
    radius: { light: 18, heavy: 30, finisher: 40, ko: 46 },
    back: { fill: hex('#FFD24A'), outline: hex('#14181C'), outlinePx: 2 }, front: { fill: hex('#FFFFFF'), radiusRatio: 0.6 },
    scale: [0.4, 1.1], scaleUntil: 0.5, backFadeFrom: 0.6, frontFadeFrom: 0.4,
    lifeMs: { light: 100, heavy: 150, finisher: 180, ko: 200 }, frontLifeRatio: 0.8 }),
  slash: Object.freeze({ count: { light: 1, heavy: 1, finisher: 2, ko: 2 },
    length: { light: 60, heavy: 110, finisher: 150, ko: 170 }, thickness: { light: 6, heavy: 10, finisher: 12, ko: 14 },
    tiltDeg: 12, crossDeg: 35, crossLengthRatio: 0.6, leadRatio: 0.2, fill: hex('#FFFFFF'), outline: hex('#FFD24A'), outlinePx: 2,
    outlineFrom: 'heavy', lifeMs: { light: 80, heavy: 110, finisher: 130, ko: 150 }, growUntil: 0.35, lengthFrom: 0.3 }),
  sparks: Object.freeze({ count: { light: 6, heavy: 9, finisher: 12, ko: 12 }, streamerEvery: 4,
    lenPx: { light: [14, 20], heavy: [18, 26] }, thickness: 3, streamerThickness: 2,
    speed: { light: [420, 780], heavy: [520, 900] }, streamerSpeedMul: 1.5, streamerLifeMul: 0.7, coneDeg: 25, gravity: 400,
    lifeMs: { light: [180, 260], heavy: [220, 300], finisher: [240, 320], ko: [240, 320] },
    trail: { samples: 5, spacingMs: 14, widthPx: [3, 1], coolPerSample: 0.12 }, fadeFrom: 0.8, lenShrink: 0.6 }),
  shards: Object.freeze({ count: { light: 4, heavy: 7, finisher: 10, ko: 11 }, sizePx: { light: [5, 8], heavy: [7, 12] },
    aspect: 2, triangleShare: 0.5,
    colors: [[hex('#7C8A96'), 0.4], [hex('#BFC8CF'), 0.25], [hex('#FFF6D6'), 0.2], [hex('#E3A92B'), 0.15]],
    speed: { light: [220, 420], heavy: [300, 560] }, coneDeg: 40, gravity: 1100, spinDegPerSec: 540,
    floor: { yOffset: [-4, 6], restitution: 0.45, vxKeep: 0.7, spinKeep: 0.6, maxBounces: { light: 1, heavy: 2, finisher: 2, ko: 2 } },
    lifeMs: [450, 650], fadeFrom: 0.7 }),
  flakes: Object.freeze({ count: { light: 6, heavy: 10, finisher: 14, ko: 14 }, sizePx: [3, 5],
    colors: [[hex('#9C5A2E'), 0.5], [hex('#6B3E22'), 0.25], [hex('#F58A2A'), 0.25]],
    speed: [120, 300], coneDeg: 55, gravity: 700, spinDegPerSec: 360, landFadeMs: 150, lifeMs: [350, 500] }),
  smoke: Object.freeze({ count: { light: 3, heavy: 4, finisher: 6, ko: 6 }, sizePx: [10, 18], grow: 2.0,
    colors: [[hex('#AEB6BC'), 0.6], [hex('#7C8A96'), 0.4]], alpha: 0.5, speed: [30, 90], coneDeg: 70, gravity: -80,
    delayMs: 40, lifeMs: [300, 450] }),
  groundDust: Object.freeze({ count: { ko: 6 }, sizePx: [8, 14], grow: 1.6, color: hex('#C9B79A'), alpha: 0.6,
    speed: [60, 140], coneDeg: 60, downBiasDeg: 20, gravity: -50, lifeMs: 400 }),
  reduceFlash: Object.freeze({ starBack: { fill: hex('#FFF6D6'), alpha: 0.6 }, ring: { color: hex('#BFC8CF'), alpha: 0.5, widthPx: 2 } }),
});

// ---------- pure helpers ----------

/** 'high' | 'mid' | 'low' band for hp fraction. Over 50% high, 26-50% mid, 25% or less low. */
export function barBand(frac, cfg = ENEMY_BAR) {
  if (frac > cfg.midAt) return 'high';
  if (frac > cfg.lowAt) return 'mid';
  return 'low';
}
export const barFillColor = (frac, cfg = ENEMY_BAR) => cfg.fill[barBand(frac, cfg)];
export const barFillTopColor = (frac, cfg = ENEMY_BAR) => cfg.fillTop[barBand(frac, cfg)];

/** Inner fill area size: outer minus border and padding each side (96x10 -> 90x4). */
export function barFillArea(cfg = ENEMY_BAR) {
  const inset = (cfg.borderPx + cfg.padPx) * 2; // (border 2 + pad 1) each side = 6 -> 90 x 4
  return { w: cfg.size[0] - inset, h: cfg.size[1] - inset };
}

export const hpFrac = (hp, maxHp) => (maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0);
export const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);

/** Bar top-left in world px: centred on x, bottom edge `offset` px above spriteTopY. */
export function barPosition(x, spriteTopY, cfg = ENEMY_BAR, offset = BAR_OFFSET_ABOVE_SPRITE) {
  return { x: x - cfg.size[0] / 2, y: spriteTopY - offset - cfg.size[1] };
}

/** y for the bottom of the telegraph icon so it clears the bar. */
export const telegraphIconBottomY = (barTopY) => barTopY - TELEGRAPH_ABOVE_BAR_GAP;

/** Hit class from damage and kill state. ko wins; heavy at/above finisherDamage. */
export function hitClass(amount, killed, heavyAt = 12, finisherAt = Infinity) {
  if (killed) return 'ko';
  if (amount >= finisherAt) return 'finisher';
  return amount >= heavyAt ? 'heavy' : 'light';
}

/**
 * Spray direction: AWAY from the attacker. sign(target.x - attacker.x); if equal use attacker facing.
 * Returns +1 (right) or -1 (left).
 */
export function hitDir(targetX, attackerX, attackerFacing = 1) {
  const d = Math.sign(targetX - attackerX);
  return d !== 0 ? d : (attackerFacing < 0 ? -1 : 1);
}

/** Base angle in degrees (screen space, y down, so "up" is negative): 0 right, 180 left, minus upBias toward up. */
export function sprayBaseAngleDeg(dir, upBiasDeg = HIT_PARTICLES.upBiasDeg) {
  // Right: 0 - bias = -10 (up-right). Left: 180 + bias = 190 (up-left, y-down angles).
  return dir > 0 ? -upBiasDeg : 180 + upBiasDeg;
}

/** Velocity for a particle at `offsetDeg` within the cone, given dir and speed. */
export function sprayVelocity(dir, offsetDeg, speed, upBiasDeg = HIT_PARTICLES.upBiasDeg) {
  const a = ((sprayBaseAngleDeg(dir, upBiasDeg) + offsetDeg) * Math.PI) / 180;
  return { vx: Math.cos(a) * speed, vy: Math.sin(a) * speed };
}

/** Pick a colour from [[color, weight], ...] with r in [0,1). */
export function pickWeighted(table, r) {
  let acc = 0;
  for (const [c, w] of table) { acc += w; if (r < acc) return c; }
  return table[table.length - 1][0];
}

// ---------- hit particle logic (pure) ----------

const DEG = Math.PI / 180;
const lerp = (a, b, k) => a + (b - a) * k;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const easeQuadOut = easeOutQuad;
export const easeCubicOut = (t) => 1 - (1 - t) ** 3;
export const easeExpoOut = (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));
export const easeBackOut = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2; };

/** Per-class lookup; two-key tables ({light, heavy}) use 'heavy' for heavy, finisher and ko. */
export const tier = (table, cls) => (table[cls] !== undefined ? table[cls] : (cls === 'light' ? table.light : table.heavy));

export function lerpColor(a, b, k) {
  const ch = (s) => Math.round(lerp((a >> s) & 255, (b >> s) & 255, k));
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

/** Hot-to-cool ramp colour at life fraction t (spec 7.3.2). skipWhite: reduce-flash, ramp starts at Gold. */
export function rampColor(t, skipWhite = false, ramp = HIT_PARTICLES.ramp) {
  const u = clamp01(skipWhite ? ramp[1][0] + t * (1 - ramp[1][0]) : t);
  if (u >= ramp[ramp.length - 1][0]) return ramp[ramp.length - 1][1];
  for (let i = 0; i < ramp.length - 1; i++) {
    const [t0, c0] = ramp[i], [t1, c1] = ramp[i + 1];
    if (u <= t1) return lerpColor(c0, c1, (u - t0) / (t1 - t0));
  }
  return ramp[ramp.length - 1][1];
}

/** Particle counts for a hit class (spec 7.3.3; front star excluded). */
export function particleCounts(cls, cfg = HIT_PARTICLES) {
  const o = {
    core: 1, ring: 1, star: 1, slash: cfg.slash.count[cls], sparks: cfg.sparks.count[cls], shards: cfg.shards.count[cls],
    flakes: cfg.flakes.count[cls], smoke: cfg.smoke.count[cls], groundDust: cfg.groundDust.count[cls] ?? 0,
  };
  o.total = Object.values(o).reduce((a, b) => a + b, 0);
  return o;
}

/** True when a new core flash + front star may spawn (120 ms rate limit). */
export const flashAllowed = (nowMs, lastCoreMs, limitMs = HIT_PARTICLES.flashRateLimitMs) =>
  lastCoreMs == null || nowMs - lastCoreMs >= limitMs;

const PROTECTED = new Set(['core', 'ring', 'star', 'slash', 'spark']);

/**
 * Indices of `list` to drop so list + `incoming` (a count) fits the cap. Priority: flake, smoke, shard, groundDust,
 * oldest (lowest index) first within a kind. core/ring/star/slash/spark are never dropped.
 */
export function cullForCap(list, incoming, cap = HIT_PARTICLES.cap, order = HIT_PARTICLES.cullOrder) {
  let over = list.length + incoming - cap;
  const drop = [];
  for (const kind of order) {
    for (let i = 0; i < list.length && over > 0; i++) if (list[i].kind === kind) { drop.push(i); over--; }
  }
  return drop;
}

/** Apply the cap to live + incoming particles together. Returns { live, incoming } kept (old debris goes before new). */
export function capParticles(live, incoming, cap = HIT_PARTICLES.cap) {
  const all = live.concat(incoming), drop = new Set(cullForCap(all, 0, cap));
  return { live: live.filter((_, i) => !drop.has(i)), incoming: incoming.filter((_, i) => !drop.has(i + live.length)) };
}

export const isProtectedKind = (k) => PROTECTED.has(k);

/**
 * Build every particle for one enemy hit (spec 7.3.3). Pure; rng injectable.
 * pt: contact point. dir: +1/-1 AWAY from attacker. floorY: target feet y.
 * opts: { reduce, allowFlash (false skips core + front star, the rate limit), rng }
 * All velocities come from sprayVelocity(dir, ...), so nothing travels toward the attacker.
 */
export function buildHit(cls, pt, dir, floorY, { reduce = false, allowFlash = true, rng = Math.random, cfg = HIT_PARTICLES } = {}) {
  const rnd = (a, b) => a + rng() * (b - a), rr = (r) => rnd(r[0], r[1]), sgn = () => (rng() < 0.5 ? -1 : 1);
  const heavyUp = cls !== 'light';
  const out = [];
  const base = (kind, life, extra = {}) => ({ kind, x: pt.x, y: pt.y, age: 0, delay: 0, life, t: 0, ...extra });
  const spray = (cone, speed, extraDeg = 0, bias = cfg.upBiasDeg) => sprayVelocity(dir, rnd(-cone, cone) + extraDeg, speed, bias);

  // Layer A (shapes): ring, core, slash, star in draw order
  const rg = cfg.ring;
  out.push(base('ring', rg.lifeMs[cls], { r0: rg.startRadius, r1: rg.radius[cls], w0: rg.width[cls][0], w1: rg.width[cls][1], reduce }));
  if (!reduce && allowFlash) out.push(base('core', cfg.core.lifeMs[cls], { r: cfg.core.radius[cls] }));
  if (!reduce) {
    const sl = cfg.slash, len = sl.length[cls], n = sl.count[cls];
    for (let i = 0; i < n; i++) {
      const l = i === 0 ? len : len * sl.crossLengthRatio;
      const tilt = (i === 0 ? rnd(-sl.tiltDeg, sl.tiltDeg) : sgn() * sl.crossDeg + rnd(-sl.tiltDeg, sl.tiltDeg)) * DEG;
      out.push(base('slash', sl.lifeMs[cls], { x: pt.x + dir * sl.leadRatio * l, len: l, thick: sl.thickness[cls] * (i === 0 ? 1 : sl.crossLengthRatio),
        ang: tilt, outline: heavyUp }));
    }
  }
  const st = cfg.star, tips = [];
  for (let i = 0; i < st.points; i++) tips.push(rr(st.tipJitter));
  out.push(base('star', st.lifeMs[cls], { r: st.radius[cls], rot: rnd(-st.tiltDeg, st.tiltDeg) * DEG, tips,
    front: !reduce && allowFlash, frontLife: st.lifeMs[cls] * st.frontLifeRatio, reduce }));

  // Layer B (debris): ground dust, smoke, flakes, shards, sparks
  const gd = cfg.groundDust;
  for (let i = 0; i < (gd.count[cls] ?? 0); i++) {
    const v = spray(gd.coneDeg, rr(gd.speed), dir > 0 ? gd.downBiasDeg : -gd.downBiasDeg, 0);
    out.push(base('groundDust', gd.lifeMs, { y: floorY, vx: v.vx, vy: v.vy * 0.3, g: gd.gravity, size: rr(gd.sizePx) }));
  }
  const sm = cfg.smoke;
  for (let i = 0; i < sm.count[cls]; i++) {
    const v = spray(sm.coneDeg, rr(sm.speed));
    out.push(base('smoke', rr(sm.lifeMs), { delay: sm.delayMs, vx: v.vx, vy: v.vy, g: sm.gravity, size: rr(sm.sizePx), color: pickWeighted(sm.colors, rng()) }));
  }
  const fl = cfg.flakes;
  for (let i = 0; i < fl.count[cls]; i++) {
    const v = spray(fl.coneDeg, rr(fl.speed));
    out.push(base('flake', rr(fl.lifeMs), { vx: v.vx, vy: v.vy, g: fl.gravity, size: rr(fl.sizePx), rot: rnd(0, 360), spin: rnd(-fl.spinDegPerSec, fl.spinDegPerSec),
      color: pickWeighted(fl.colors, rng()), floorY, landed: false }));
  }
  const sh = cfg.shards;
  for (let i = 0; i < sh.count[cls]; i++) {
    const v = spray(sh.coneDeg, rr(tier(sh.speed, cls)));
    out.push(base('shard', rr(sh.lifeMs), { vx: v.vx, vy: v.vy, g: sh.gravity, size: rr(tier(sh.sizePx, cls)), tri: rng() < sh.triangleShare,
      rot: rnd(0, 360), spin: rnd(-sh.spinDegPerSec, sh.spinDegPerSec), color: pickWeighted(sh.colors, rng()),
      floorY: floorY + rr(sh.floor.yOffset), bounces: 0, maxBounces: sh.floor.maxBounces[cls] }));
  }
  const sp = cfg.sparks;
  for (let i = 0; i < sp.count[cls]; i++) {
    const streamer = i % sp.streamerEvery === sp.streamerEvery - 1;
    const v = spray(sp.coneDeg, rr(tier(sp.speed, cls)) * (streamer ? sp.streamerSpeedMul : 1));
    out.push(base('spark', rr(sp.lifeMs[cls]) * (streamer ? sp.streamerLifeMul : 1), { vx: v.vx, vy: v.vy, g: sp.gravity, len: rr(tier(sp.lenPx, cls)),
      thick: streamer ? sp.streamerThickness : sp.thickness, streamer, hist: [], histAcc: 0, skipWhite: reduce }));
  }
  return out;
}

/** Advance one particle by dtMs (real time). Returns false when it is finished. Sets p.t (0..1 active life fraction). */
export function stepParticle(p, dtMs, cfg = HIT_PARTICLES) {
  p.age += dtMs;
  if (p.age < p.delay) return true;
  const active = p.age - p.delay;
  const dt = Math.min(dtMs, active) / 1000;
  p.t = clamp01(active / p.life);
  if (active >= p.life) return false;
  switch (p.kind) {
    case 'spark': {
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      const tr = cfg.sparks.trail;
      p.histAcc += dtMs;
      if (p.histAcc >= tr.spacingMs) { p.histAcc -= tr.spacingMs; p.hist.unshift({ x: p.x, y: p.y }); if (p.hist.length > tr.samples) p.hist.pop(); }
      break;
    }
    case 'shard': {
      const f = cfg.shards.floor;
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.spin * dt;
      if (p.y >= p.floorY && p.vy > 0) {
        p.y = p.floorY;
        if (p.bounces < p.maxBounces) { p.vy = -f.restitution * p.vy; p.vx *= f.vxKeep; p.spin *= f.spinKeep; p.bounces++; }
        else { p.vy = 0; p.vx = 0; p.spin = 0; } // out of bounces: lie on the floor until it fades
      }
      break;
    }
    case 'flake':
      if (!p.landed) {
        p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.spin * dt;
        if (p.y >= p.floorY && p.vy > 0) { p.y = p.floorY; p.vx = p.vy = p.spin = 0; p.landed = true; }
      }
      break;
    case 'smoke': case 'groundDust':
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; break;
    default: break;
  }
  return true;
}

/** Colour of trail segment i (0 = newest) for a spark at life fraction t: older is cooler. */
export const sparkTrailColor = (t, i, skipWhite = false, cfg = HIT_PARTICLES) => rampColor(t + cfg.sparks.trail.coolPerSample * i, skipWhite);

/** Star polygon vertices (flat array of {x,y}); radius scale s, ratio of outer radius k (front star uses radiusRatio). */
export function starPoints(p, s = 1, k = 1, cfg = HIT_PARTICLES) {
  const n = cfg.star.points * 2, pts = [];
  for (let i = 0; i < n; i++) {
    const outer = i % 2 === 0;
    const rad = p.r * k * s * (outer ? p.tips[i / 2] : cfg.star.innerRatio);
    const a = (Math.PI * i) / cfg.star.points + p.rot;
    pts.push({ x: p.x + Math.cos(a) * rad, y: p.y + Math.sin(a) * rad });
  }
  return pts;
}

/** Rhombus vertices for a slash at its current length/thickness. */
export function slashPoints(p, len, thick) {
  const c = Math.cos(p.ang), s = Math.sin(p.ang), h = len / 2, w = thick / 2;
  return [{ x: p.x - c * h, y: p.y - s * h }, { x: p.x - s * w, y: p.y + c * w }, { x: p.x + c * h, y: p.y + s * h }, { x: p.x + s * w, y: p.y - c * w }];
}

/**
 * Draw model for a particle at its current p.t. Returns null while delayed. Numbers only; the view draws them.
 * Reduce-flash variants are baked into the particles at build time (p.reduce / p.skipWhite).
 */
export function renderModel(p, cfg = HIT_PARTICLES) {
  if (p.age < p.delay) return null;
  const t = p.t;
  switch (p.kind) {
    case 'core':
      return { r: p.r * lerp(cfg.core.from, 1, easeQuadOut(t)), color: cfg.core.color, alpha: cfg.core.alpha * (1 - t) ** 2 };
    case 'ring': {
      const r = lerp(p.r0, p.r1, easeCubicOut(t));
      if (p.reduce) { const rf = cfg.reduceFlash.ring; return { r, width: rf.widthPx, color: rf.color, alpha: rf.alpha * (1 - t ** 1.5) }; }
      return { r, width: lerp(p.w0, p.w1, t), color: t < cfg.ring.switchAt ? cfg.ring.colors[0] : cfg.ring.colors[1], alpha: 1 - t ** 1.5 };
    }
    case 'star': {
      const st = cfg.star;
      const sk = clamp01(t / st.scaleUntil), s = t >= st.scaleUntil ? st.scale[1] : lerp(st.scale[0], st.scale[1], easeBackOut(sk));
      const backA = t < st.backFadeFrom ? 1 : 1 - (t - st.backFadeFrom) / (1 - st.backFadeFrom);
      const tf = clamp01((p.age - p.delay) / p.frontLife);
      const frontA = !p.front || tf >= 1 ? 0 : tf < st.frontFadeFrom ? 1 : 1 - (tf - st.frontFadeFrom) / (1 - st.frontFadeFrom);
      return {
        scale: s,
        back: p.reduce ? { fill: cfg.reduceFlash.starBack.fill, alpha: cfg.reduceFlash.starBack.alpha * backA, outlinePx: 0, outline: null }
          : { fill: st.back.fill, alpha: backA, outlinePx: st.back.outlinePx, outline: st.back.outline },
        front: frontA > 0 ? { fill: st.front.fill, alpha: frontA, radiusRatio: st.front.radiusRatio } : null,
      };
    }
    case 'slash': {
      const sl = cfg.slash;
      const len = p.len * lerp(sl.lengthFrom, 1, easeExpoOut(clamp01(t / sl.growUntil)));
      return { len, thick: p.thick * (1 - t) ** 2, fill: sl.fill, outline: p.outline ? sl.outline : null, outlinePx: sl.outlinePx, alpha: 1 };
    }
    case 'spark': {
      const sp = cfg.sparks, a = t < sp.fadeFrom ? 1 : 1 - (t - sp.fadeFrom) / (1 - sp.fadeFrom);
      return { len: p.len * (1 - sp.lenShrink * t), thick: p.thick, color: rampColor(t, p.skipWhite), alpha: a };
    }
    case 'shard':
      return { alpha: t < cfg.shards.fadeFrom ? 1 : 1 - (t - cfg.shards.fadeFrom) / (1 - cfg.shards.fadeFrom) };
    case 'flake': {
      const left = p.life * (1 - t);
      return { alpha: Math.min(1, left / cfg.flakes.landFadeMs) };
    }
    case 'smoke':
      return { r: (p.size * lerp(1, cfg.smoke.grow, easeQuadOut(t))) / 2, alpha: cfg.smoke.alpha * (1 - t) };
    case 'groundDust':
      return { r: (p.size * lerp(1, cfg.groundDust.grow, t)) / 2, alpha: cfg.groundDust.alpha * (1 - t) };
    default: return null;
  }
}

// ---------- bar state machine (pure, ms-driven) ----------

export function createBarState(maxHp, cfg = ENEMY_BAR) {
  return {
    maxHp, frac: 1, drainFrom: 1, holdLeft: 0, shrinkT: cfg.drain.shrinkMs, // shrinkT >= shrinkMs = drain idle
    everDamaged: false, sinceHit: Infinity, showT: cfg.showInMs, alpha: 0,
    pulseT: cfg.pulseMs, flashT: cfg.fillFlashMs, ko: false, koT: 0, koDelay: 0, reduceFlash: false,
  };
}

/** Current drain-segment right edge as hp fraction (>= frac). */
export function drainValue(s, cfg = ENEMY_BAR) {
  if (s.holdLeft > 0) return s.drainFrom;
  if (s.shrinkT >= cfg.drain.shrinkMs) return s.frac;
  const k = easeOutQuad(s.shrinkT / cfg.drain.shrinkMs);
  return s.drainFrom + (s.frac - s.drainFrom) * k;
}

/** Register damage. hpAfter from damage-applied; killed shortens the drain hold so the fade finishes inside the corpse linger. */
export function barOnDamage(s, hpAfter, { killed = false, reduceFlash = false } = {}, cfg = ENEMY_BAR) {
  const prevDrain = drainValue(s, cfg);
  const inHold = s.holdLeft > 0;
  s.frac = hpFrac(hpAfter, s.maxHp);
  // Hit during hold keeps the older left edge (drainFrom); otherwise start from what is currently shown.
  s.drainFrom = inHold ? s.drainFrom : Math.max(prevDrain, s.frac);
  s.holdLeft = killed ? 0 : cfg.drain.holdMs;
  s.shrinkT = 0;
  if (!s.everDamaged) s.showT = 0;
  s.everDamaged = true; s.sinceHit = 0;
  s.pulseT = 0; s.flashT = 0; s.reduceFlash = reduceFlash;
  if (killed) { s.ko = true; s.koT = 0; s.koDelay = cfg.drain.shrinkMs; }
  return s;
}

/** Target alpha while idle, for the visibility rules. */
export function idleTargetAlpha(s, cfg = ENEMY_BAR, staysVisible = BAR_STAYS_VISIBLE_AFTER_DAMAGE) {
  let a = staysVisible ? cfg.idleAlpha : 0;
  if (staysVisible && s.frac < cfg.midAt) a = Math.max(a, cfg.lowHpMinAlpha);
  return a;
}

export function barUpdate(s, dtMs, cfg = ENEMY_BAR, staysVisible = BAR_STAYS_VISIBLE_AFTER_DAMAGE) {
  let shrinkDt = dtMs;
  if (s.holdLeft > 0) { shrinkDt = Math.max(0, dtMs - s.holdLeft); s.holdLeft = Math.max(0, s.holdLeft - dtMs); } // carry leftover into the shrink
  if (s.holdLeft === 0 && s.shrinkT < cfg.drain.shrinkMs) s.shrinkT = Math.min(cfg.drain.shrinkMs, s.shrinkT + shrinkDt);
  s.pulseT = Math.min(cfg.pulseMs, s.pulseT + dtMs);
  s.flashT = Math.min(cfg.fillFlashMs, s.flashT + dtMs);
  s.sinceHit += dtMs;
  if (s.showT < cfg.showInMs) s.showT = Math.min(cfg.showInMs, s.showT + dtMs);

  let alpha;
  if (!s.everDamaged) alpha = 0;
  else if (s.sinceHit < cfg.idleFadeAfterMs) alpha = 1;
  else {
    const target = idleTargetAlpha(s, cfg, staysVisible);
    const k = Math.min(1, (s.sinceHit - cfg.idleFadeAfterMs) / cfg.idleFadeMs);
    alpha = 1 + (target - 1) * k;
  }
  if (s.everDamaged) alpha *= s.showT / cfg.showInMs;
  if (s.ko) {
    s.koT += dtMs;
    const fadeStart = s.koDelay;
    const k = Math.max(0, Math.min(1, (s.koT - fadeStart) / cfg.koFadeMs));
    alpha *= 1 - k;
  }
  s.alpha = alpha;
  return s;
}

/** Render model for the view. */
export function barView(s, cfg = ENEMY_BAR) {
  const scale = s.pulseT < cfg.pulseMs ? 1 + (cfg.pulseScale - 1) * (1 - s.pulseT / cfg.pulseMs) : 1;
  return {
    alpha: s.alpha, scale, frac: s.frac, drain: drainValue(s, cfg),
    band: barBand(s.frac, cfg), fill: barFillColor(s.frac, cfg), fillTop: barFillTopColor(s.frac, cfg),
    flashing: !s.reduceFlash && s.flashT < cfg.fillFlashMs,
  };
}
