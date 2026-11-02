import assert from 'node:assert/strict';
import { WALL_SLAM as W, LANE_TOP, LANE_BOTTOM, clampImpactY, shakeFrames, dentAt, ringRadius, vignetteK, sparkColor } from './wallSlamData.js';
import { shakeFrames as stompShake } from './megaStompData.js';

assert.equal(clampImpactY(300), LANE_TOP); assert.equal(clampImpactY(900), LANE_BOTTOM); assert.equal(clampImpactY(600), 600);
const full = shakeFrames(1);
assert.equal(full.length, 5); assert.equal(full[0].at, 0, 'the jolt starts on the slam');
const peak = Math.max(...full.map((f) => f.intensity)); assert.equal(peak, 0.015);
assert.ok(peak < Math.max(...stompShake(1).map((f) => f.intensity)), 'quieter than the Mega Stomp');
assert.ok(full.at(-1).at + full.at(-1).ms <= 400, 'a short jolt, not a rumble');
assert.deepEqual(shakeFrames(0), []); assert.equal(shakeFrames(0.5)[0].intensity, 0.0075);
assert.equal(dentAt(-1), null); assert.equal(dentAt(W.dent.fadeToMs), null);
assert.equal(dentAt(0).rx, W.dent.rx[0]); assert.equal(dentAt(W.dent.growMs).rx, W.dent.rx[1]);
assert.equal(dentAt(W.dent.holdMs).alpha, W.dent.alpha); assert.ok(dentAt(800).alpha < W.dent.alpha / 2);
assert.equal(ringRadius(0), W.ringDust.startRx); assert.equal(ringRadius(W.ringDust.travelMs), W.ringDust.endRx);
assert.equal(vignetteK(0), 0); assert.equal(vignetteK(W.vignette.inMs), 1); assert.equal(vignetteK(W.vignette.inMs + W.vignette.outMs), 0);
assert.equal(sparkColor(0), 0xffffff); assert.equal(sparkColor(0.9), 0x9c5a2e);
assert.ok(W.chunks.count + W.sparks.count + W.ringDust.count + W.burstDust.count <= W.particleCap + 20, 'rough particle budget');
console.log('Wall Slam data tests passed');
