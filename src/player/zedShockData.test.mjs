import assert from 'node:assert/strict';
import { SHOCK, shockDuration, shockState, arcPoints, isShockHit } from './zedShockData.js';

// Only a landed Specialist hit shocks.
assert.ok(isShockHit('rust-specialist', 10));
assert.ok(!isShockHit('rust-specialist', 0));
assert.ok(!isShockHit('rust-ranger', 10) && !isShockHit('grunt', 10) && !isShockHit(null, 10));
// Length: at least the minimum, longer when the stun is longer.
assert.equal(shockDuration(0), SHOCK.minMs);
assert.equal(shockDuration(240), SHOCK.minMs);
assert.equal(shockDuration(1000), 1000);
// Lifecycle
assert.equal(shockState(-1, 450), null);
assert.equal(shockState(450, 450), null);
const early = shockState(10, 450);
assert.ok(early.fade === 1 && early.arcs === SHOCK.arcs);
const late = shockState(440, 450);
assert.ok(late.fade < 0.1 && late.arcs >= 1 && late.jitterX === 0 && late.tint === SHOCK.cyan);
// Flicker alternates between two states over time.
const tints = new Set(); for (let t = 0; t < 270; t += 10) { const s = shockState(t, 450); tints.add(`${s.tint}|${s.tintFill}`); }
assert.ok(tints.size === 2);
// Reduce flash: no flicker, no jitter, steady cyan, fewer arcs, same length.
for (let t = 0; t < 450; t += 10) { const s = shockState(t, 450, true); assert.ok(s.jitterX === 0 && !s.tintFill && s.tint === SHOCK.cyan && s.arcs === SHOCK.arcsReduced); }
// Arcs stay inside the box, run bottom to top and are deterministic.
const box = { x: 100, y: 200, w: 60, h: 120 };
for (let step = 0; step < 20; step++) for (let i = 0; i < SHOCK.arcs; i++) {
  const pts = arcPoints(box, step, i);
  assert.ok(pts.length >= SHOCK.segments[0] + 1 && pts.length <= SHOCK.segments[1] + 1);
  assert.equal(pts[0][1], box.y + box.h); assert.equal(pts.at(-1)[1], box.y);
  for (const [x] of pts) assert.ok(x >= box.x && x <= box.x + box.w);
  assert.deepEqual(pts, arcPoints(box, step, i));
}
console.log('zedShockData ok');
