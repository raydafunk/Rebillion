import assert from 'node:assert/strict';
import {
  ENEMY_BAR, HIT_PARTICLES, barBand, barFillColor, barFillTopColor, barFillArea, barPosition, telegraphIconBottomY,
  hitDir, sprayBaseAngleDeg, sprayVelocity, hitClass, particleCounts, pickWeighted, cullForCap,
  capParticles, buildHit, stepParticle, renderModel, rampColor, sparkTrailColor, flashAllowed, starPoints,
  createBarState, barOnDamage, barUpdate, barView, drainValue, BAR_OFFSET_ABOVE_SPRITE,
} from './hitFeedbackData.js';

// colour bands (spec 7.1) and the new Enemy Critical colour
assert.equal(barFillColor(1), 0x4fb3d9); assert.equal(barFillColor(0.51), 0x4fb3d9);
assert.equal(barFillColor(0.5), 0xd9822b); assert.equal(barFillColor(0.26), 0xd9822b);
assert.equal(barFillColor(0.25), 0xc9452f); assert.equal(barFillColor(0.01), 0xc9452f);
assert.notEqual(barFillColor(0.1), 0xff3b30); // never Telegraph Red
assert.equal(barFillTopColor(0.9), 0xa9ddf0); assert.equal(barFillTopColor(0.4), 0xf0a957); assert.equal(barFillTopColor(0.1), 0xe9715c);
assert.equal(barBand(0.5), 'mid');

// geometry
assert.deepEqual(barFillArea(), { w: 90, h: 4 });
assert.equal(BAR_OFFSET_ABOVE_SPRITE, 12);
assert.deepEqual(barPosition(500, 300), { x: 452, y: 300 - 12 - 10 });
assert.equal(telegraphIconBottomY(278), 274);

// direction: spray away from attacker, facing breaks ties
assert.equal(hitDir(200, 100), 1); assert.equal(hitDir(100, 200), -1);
assert.equal(hitDir(100, 100, -1), -1); assert.equal(hitDir(100, 100, 1), 1);
assert.equal(sprayBaseAngleDeg(1), -10); assert.equal(sprayBaseAngleDeg(-1), 190);
for (const dir of [1, -1]) {
  for (let off = -35; off <= 35; off += 5) {
    const v = sprayVelocity(dir, off, 300);
    assert.ok(Math.sign(v.vx) === dir, `vx must point away (dir ${dir}, off ${off})`);
  }
  assert.ok(sprayVelocity(dir, 0, 300).vy < 0, 'centre of the cone is biased up');
}

// classes
assert.equal(hitClass(5, false), 'light'); assert.equal(hitClass(12, false), 'heavy'); assert.equal(hitClass(1, true), 'ko');
assert.equal(hitClass(20, false, 12, 18), 'finisher');

// counts per class (spec 7.3.3). Spec text says light total 22 but its own rows sum to 23.
assert.deepEqual(particleCounts('light'), { core: 1, ring: 1, star: 1, slash: 1, sparks: 6, shards: 4, flakes: 6, smoke: 3, groundDust: 0, total: 23 });
assert.equal(particleCounts('heavy').total, 34);
assert.equal(particleCounts('finisher').total, 47);
assert.deepEqual(particleCounts('ko'), { core: 1, ring: 1, star: 1, slash: 2, sparks: 12, shards: 11, flakes: 14, smoke: 6, groundDust: 6, total: 54 });
for (const cls of ['light', 'heavy', 'finisher', 'ko']) {
  const made = buildHit(cls, { x: 100, y: 100 }, 1, 160);
  assert.equal(made.length, particleCounts(cls).total, cls);
  assert.ok(made.length <= HIT_PARTICLES.cap);
  const n = (k) => made.filter((p) => p.kind === k).length, c = particleCounts(cls);
  assert.equal(n('spark'), c.sparks); assert.equal(n('shard'), c.shards); assert.equal(n('flake'), c.flakes);
  assert.equal(n('smoke'), c.smoke); assert.equal(n('groundDust'), c.groundDust); assert.equal(n('slash'), c.slash);
}
assert.equal(pickWeighted(HIT_PARTICLES.flakes.colors, 0.1), 0x9c5a2e);
assert.equal(pickWeighted(HIT_PARTICLES.flakes.colors, 0.6), 0x6b3e22);
assert.equal(pickWeighted(HIT_PARTICLES.flakes.colors, 0.95), 0xf58a2a);
assert.equal(pickWeighted(HIT_PARTICLES.smoke.colors, 0.1), 0xaeb6bc);

// spec values per class
assert.deepEqual(Object.values(HIT_PARTICLES.core.radius), [10, 16, 22, 28]);
assert.deepEqual(Object.values(HIT_PARTICLES.ring.radius), [28, 48, 64, 72]);
assert.deepEqual(Object.values(HIT_PARTICLES.star.radius), [18, 30, 40, 46]);
assert.deepEqual(Object.values(HIT_PARTICLES.slash.length), [60, 110, 150, 170]);
assert.deepEqual(HIT_PARTICLES.layerDepth, { shapes: 5050, debris: 5800 });

// no forbidden colours anywhere in the config
{
  const seen = new Set();
  (function walk(o) { if (typeof o === 'number') seen.add(o); else if (o && typeof o === 'object') Object.values(o).forEach(walk); })(HIT_PARTICLES);
  assert.ok(!seen.has(0xff3b30) && !seen.has(0xc9452f));
}

// colour ramp: white -> gold -> ember -> rust brown, linear in between
assert.equal(rampColor(0), 0xffffff); assert.equal(rampColor(0.2), 0xffd24a); assert.equal(rampColor(0.5), 0xf58a2a);
assert.equal(rampColor(0.8), 0x9c5a2e); assert.equal(rampColor(1), 0x9c5a2e);
assert.ok(((rampColor(0.1) >> 8) & 255) > 0xd2 && ((rampColor(0.1) >> 8) & 255) < 0xff);
assert.equal(rampColor(0, true), 0xffd24a); // reduce-flash skips the white stop
assert.equal(rampColor(1, true), 0x9c5a2e);
assert.equal(sparkTrailColor(0.2, 0), 0xffd24a);
assert.notEqual(sparkTrailColor(0.2, 3), sparkTrailColor(0.2, 0)); // older trail segment is cooler
assert.equal(sparkTrailColor(0.2, 5), rampColor(0.2 + 0.12 * 5));

// rate limit: skip core + front star within 120 ms, keep everything else
assert.equal(flashAllowed(1000, null), true); assert.equal(flashAllowed(1100, 1000), false);
assert.equal(flashAllowed(1120, 1000), true);
{
  const lim = buildHit('heavy', { x: 0, y: 0 }, 1, 60, { allowFlash: false });
  assert.ok(!lim.some((p) => p.kind === 'core')); assert.equal(lim.find((p) => p.kind === 'star').front, false);
  assert.equal(lim.length, particleCounts('heavy').total - 1);
  assert.ok(lim.some((p) => p.kind === 'ring') && lim.some((p) => p.kind === 'slash') && lim.some((p) => p.kind === 'spark'));
}

// reduce-flash: no core, front star or slash; recoloured back star and ring; debris stays
{
  const r = buildHit('ko', { x: 0, y: 0 }, 1, 60, { reduce: true });
  for (const k of ['core', 'slash']) assert.ok(!r.some((p) => p.kind === k));
  const star = r.find((p) => p.kind === 'star'); star.t = 0.1;
  assert.equal(star.front, false);
  const m = renderModel(star); assert.equal(m.front, null);
  assert.equal(m.back.fill, 0xfff6d6); assert.equal(m.back.alpha, 0.6); assert.equal(m.back.outline, null);
  const ring = r.find((p) => p.kind === 'ring'); ring.t = 0.5; const rm = renderModel(ring);
  assert.equal(rm.color, 0xbfc8cf); assert.equal(rm.width, 2); assert.ok(rm.alpha <= 0.5);
  const c = particleCounts('ko');
  assert.equal(r.filter((p) => p.kind === 'shard').length, c.shards);
  assert.equal(r.filter((p) => p.kind === 'flake').length, c.flakes);
  assert.equal(r.filter((p) => p.kind === 'smoke').length, c.smoke);
  assert.equal(r.filter((p) => p.kind === 'groundDust').length, c.groundDust);
  const sp = r.find((p) => p.kind === 'spark'); sp.t = 0; assert.equal(renderModel(sp).color, 0xffd24a);
  const n = buildHit('ko', { x: 0, y: 0 }, 1, 60); const sn = n.find((p) => p.kind === 'spark'); sn.t = 0;
  assert.equal(renderModel(sn).color, 0xffffff);
}

// direction: every moving particle travels away from the attacker, both ways, all classes
for (const dir of [1, -1]) for (const cls of ['light', 'heavy', 'finisher', 'ko']) {
  for (let rep = 0; rep < 20; rep++) {
    for (const p of buildHit(cls, { x: 500, y: 300 }, dir, 360)) {
      if (p.vx !== undefined) assert.equal(Math.sign(p.vx), dir, `${p.kind} ${cls} dir ${dir}`);
      if (p.kind === 'slash') assert.ok(Math.sign(p.x - 500) === dir, 'slash centre leads away');
    }
  }
}

// motion: shards bounce on the floor (max per class) then rest; flakes land and stop; smoke delayed 40 ms
{
  const sh = { kind: 'shard', x: 0, y: 100, age: 0, delay: 0, life: 600, t: 0, vx: 100, vy: 200, g: 1100, rot: 0, spin: 300, floorY: 120, bounces: 0, maxBounces: 1 };
  let bounced = false;
  for (let i = 0; i < 20 && stepParticle(sh, 16); i++) if (sh.vy < 0) bounced = true;
  assert.ok(bounced); assert.equal(sh.bounces, 1);
  for (let i = 0; i < 20; i++) stepParticle(sh, 16);
  assert.equal(sh.y, 120); assert.equal(sh.vy, 0); assert.equal(sh.vx, 0);
  // flake launch velocities are random (some arc up first), so step every flake and check those that land
  const flakes = buildHit('light', { x: 0, y: 100 }, 1, 120).filter((p) => p.kind === 'flake');
  for (const fl of flakes) for (let i = 0; i < 60 && fl.life > fl.age; i++) stepParticle(fl, 16);
  const landed = flakes.filter((p) => p.landed);
  assert.ok(landed.length > 0);
  for (const fl of landed) { assert.equal(fl.y, 120); assert.equal(fl.vx, 0); }
  const sm = buildHit('light', { x: 0, y: 100 }, 1, 120).find((p) => p.kind === 'smoke');
  assert.equal(sm.delay, 40); stepParticle(sm, 30); assert.equal(renderModel(sm), null); assert.equal(sm.x, 0);
  stepParticle(sm, 30); assert.ok(renderModel(sm));
  const fk = { kind: 'flake', age: 0, delay: 0, life: 400, t: 0 };
  fk.t = 0.5; assert.equal(renderModel(fk).alpha, 1); fk.t = 0.9; assert.ok(renderModel(fk).alpha < 1 && renderModel(fk).alpha > 0);
}

// shape timings: core gone by 80 ms, layer A shapes gone by 260 ms; star front dies first; star is 8-pointed
for (const cls of ['light', 'heavy', 'finisher', 'ko']) {
  for (const p of buildHit(cls, { x: 0, y: 0 }, 1, 60)) {
    if (['core', 'ring', 'star', 'slash'].includes(p.kind)) assert.ok(p.life <= 260, p.kind);
    if (p.kind === 'core') assert.ok(p.life <= 80);
  }
}
{
  const star = buildHit('heavy', { x: 0, y: 0 }, 1, 60).find((p) => p.kind === 'star');
  assert.equal(starPoints(star).length, 16);
  star.age = star.life * 0.9; star.t = 0.9; assert.equal(renderModel(star).front, null);
  assert.ok(renderModel(star).back.alpha > 0);
  star.age = star.life * 0.2; star.t = 0.2; assert.equal(renderModel(star).front.alpha, 1);
}

// cap + culling priority: flake, smoke, shard, groundDust; core/ring/star/slash/spark never dropped
{
  const mk = (...kinds) => kinds.map((kind) => ({ kind }));
  const list = mk('spark', 'flake', 'smoke', 'shard', 'groundDust', 'flake', 'ring', 'shard');
  assert.deepEqual(cullForCap(list, 1, 8), [1]);
  assert.deepEqual(cullForCap(list, 3, 8), [1, 5, 2]);
  assert.deepEqual(cullForCap(list, 4, 8), [1, 5, 2, 3]);
  assert.deepEqual(cullForCap(list, 0, 8), []);
  assert.deepEqual(cullForCap(list, 20, 8).map((i) => list[i].kind).sort(), ['flake', 'flake', 'groundDust', 'shard', 'shard', 'smoke']);
  // 60 cap with a KO on top of a finisher: protected kinds survive, total stays at 60
  const busy = buildHit('ko', { x: 0, y: 0 }, 1, 60), prior = buildHit('finisher', { x: 0, y: 0 }, 1, 60);
  const capped = capParticles(prior, busy);
  assert.equal(capped.live.length + capped.incoming.length, 60);
  const prot = (l) => l.filter((p) => ['core', 'ring', 'star', 'slash', 'spark'].includes(p.kind)).length;
  assert.equal(prot(capped.live) + prot(capped.incoming), prot(prior) + prot(busy));
  assert.equal(capParticles(mk('spark', 'flake', 'ring'), mk('flake')).live.length, 3);
}

// bar state: hidden until damaged, appears, holds 3s at 1, then idle alpha (never 0); min 0.6 under 50%
{
  const s = createBarState(30);
  barUpdate(s, 16); assert.equal(s.alpha, 0);
  barOnDamage(s, 25); // 83%
  barUpdate(s, 40); assert.ok(s.alpha > 0 && s.alpha < 1);
  barUpdate(s, 60); assert.equal(s.alpha, 1);
  barUpdate(s, 2800); assert.equal(s.alpha, 1);
  barUpdate(s, 2000); assert.equal(s.alpha, ENEMY_BAR.idleAlpha);
  barOnDamage(s, 10); barUpdate(s, 16); assert.equal(s.alpha, 1); // re-brightens
  barUpdate(s, 6000); assert.equal(s.alpha, ENEMY_BAR.lowHpMinAlpha); // 33% < 50%
  // revert switch: hides again
  const h = createBarState(30); barOnDamage(h, 25); barUpdate(h, 100); barUpdate(h, 9000, ENEMY_BAR, false);
  assert.equal(h.alpha, 0);
}

// drain: holds 300ms, then eases to hp over 250ms; new hit in hold keeps the older edge and restarts hold
{
  const s = createBarState(30);
  barOnDamage(s, 24); assert.equal(drainValue(s), 1);
  barUpdate(s, 299); assert.equal(drainValue(s), 1);
  barUpdate(s, 100); const mid = drainValue(s); assert.ok(mid < 1 && mid > 0.8);
  barUpdate(s, 500); assert.ok(Math.abs(drainValue(s) - 0.8) < 1e-9);
  const t = createBarState(30);
  barOnDamage(t, 24); barUpdate(t, 200); barOnDamage(t, 18);
  assert.equal(drainValue(t), 1); assert.equal(t.holdLeft, 300);
  barUpdate(t, 300 + 250); assert.ok(Math.abs(drainValue(t) - 0.6) < 1e-9);
}

// pulse, flash, reduce-flash, KO fade
{
  const s = createBarState(30); barOnDamage(s, 20); barUpdate(s, 0);
  let v = barView(s); assert.ok(Math.abs(v.scale - 1.12) < 1e-9); assert.equal(v.flashing, true);
  barUpdate(s, 66); v = barView(s); assert.equal(v.flashing, false); assert.ok(v.scale > 1);
  barUpdate(s, 40); assert.equal(barView(s).scale, 1);
  const r = createBarState(30); barOnDamage(r, 20, { reduceFlash: true }); assert.equal(barView(r).flashing, false);
  const k = createBarState(30); barOnDamage(k, 0, { killed: true }); barUpdate(k, 100); assert.equal(k.alpha, 1);
  barUpdate(k, 250 + 150); assert.equal(k.alpha, 0);
}
console.log('hitFeedbackData tests passed');
