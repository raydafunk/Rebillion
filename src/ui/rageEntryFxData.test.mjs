import assert from 'node:assert/strict';
import { entryVisual, createRageFreeze, freezeMs, lineBurst, wedgePoints, seededRandom } from './rageEntryFxData.js';
import { RAGE_ENTRY_FX as C } from '../player/rageConfig.js';

assert.equal(freezeMs(false), 450); assert.equal(freezeMs(true), 300);

// freeze clock: real ms, no retrigger, ends exactly once
const f = createRageFreeze();
assert.equal(f.active, false);
assert.equal(f.start(false), true); assert.equal(f.active, true);
assert.equal(f.start(false), false, 'cannot retrigger mid-freeze');
assert.equal(f.tick(200), false); assert.equal(f.left, 250);
assert.equal(f.tick(-50), false); assert.equal(f.left, 250, 'negative dt ignored');
assert.equal(f.tick(250), true); assert.equal(f.active, false);
assert.equal(f.tick(16), false, 'no second end');
assert.equal(f.start(true), true); assert.equal(f.total, 300);
assert.equal(f.cancel(), true); assert.equal(f.active, false); assert.equal(f.cancel(), false);

// envelope: one monotone rise then fall, capped, ends at 0 (no strobing)
for (const reduced of [false, true]) {
  const total = freezeMs(reduced), max = reduced ? C.reduced.flashAlphaMax : C.flashAlphaMax;
  let peak = 0, prev = 0, falling = false;
  for (let t = 0; t <= total; t += 5) {
    const v = entryVisual(t, reduced);
    assert.ok(v.flash <= max + 1e-9 && v.flash <= 0.55);
    if (v.flash < prev - 1e-9) falling = true;
    if (falling) assert.ok(v.flash <= prev + 1e-9, 'no second rise');
    prev = v.flash; peak = Math.max(peak, v.flash);
  }
  assert.ok(Math.abs(peak - max) < 1e-9);
  const end = entryVisual(total, reduced);
  assert.equal(end.flash, 0); assert.equal(end.linesAlpha, 0); assert.equal(end.titleAlpha, 0);
}
const a = entryVisual(0); assert.equal(a.flash, 0); assert.equal(a.linesScale, C.linesScale[0]); assert.equal(a.titleScale, C.titleScaleFrom);
assert.ok(entryVisual(120).linesScale > 1.1 && entryVisual(300).linesScale <= C.linesScale[1] + 1e-9);
const r = entryVisual(100, true);
assert.equal(r.vignette, 0); assert.equal(r.linesScale, 1); assert.equal(r.titleScale, 1); assert.ok(r.linesAlpha <= C.reduced.linesAlpha);
assert.ok(entryVisual(100).vignette > 0);

// line burst: deterministic, 40-50 tapered wedges, clear core, palette rules
const burst = lineBurst(false), burst2 = lineBurst(false);
assert.deepEqual(burst, burst2, 'same seed, same burst');
assert.notDeepEqual(burst, lineBurst(false, C, 7), 'different seed differs');
assert.ok(burst.length >= 40 && burst.length <= 50);
assert.equal(burst.filter((w) => w.color === C.colors.white).length, C.burst.whiteCount);
assert.ok(burst.some((w) => w.color === C.colors.red) && burst.some((w) => w.color === C.colors.redWhite));
for (const w of burst) {
  assert.ok(w.r0 >= C.coreRadius, 'core stays clear');
  assert.ok(w.r1 > w.r0 && w.r1 <= C.burst.reach);
  assert.ok(w.halfWidth * 2 >= C.burst.widthMinPx - 1e-9 && w.halfWidth * 2 <= C.burst.widthMaxPx + 1e-9);
  const p = wedgePoints(w);
  assert.equal(p.length, 6);
  for (const k of [0, 2]) assert.ok(Math.hypot(p[k], p[k + 1]) >= C.coreRadius, 'base corners outside core');
  assert.ok(Math.abs(Math.hypot(p[4], p[5]) - w.r1) < 1e-6, 'tip at r1');
}
assert.ok(new Set(burst.map((w) => w.r1.toFixed(2))).size > 10, 'randomised lengths');
const red = lineBurst(true);
assert.equal(red.length, burst.length); assert.ok(red.every((w) => w.color !== C.colors.white), 'no pure white when reduced');
const rr = seededRandom(1); const v1 = rr(); assert.ok(v1 >= 0 && v1 < 1); assert.equal(seededRandom(1)(), v1);
console.log('rageEntryFxData ok');
